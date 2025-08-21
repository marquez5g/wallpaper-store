import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const WOMPI_BASE_URL = process.env.WOMPI_ENVIRONMENT === 'production' 
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1'

// Create payment link
export async function POST(request) {
  try {
    const { orderId } = await request.json()

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            wallpaper: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order already processed' },
        { status: 400 }
      )
    }

    // Create Wompi payment link
    const paymentData = {
      name: `WallpaperStore - Orden ${order.orderNumber}`,
      description: `Compra de ${order.items.length} wallpaper(s)`,
      single_use: false,
      collect_shipping: false,
      currency: "COP",
      amount_in_cents: order.totalAmount,
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?token=${order.downloadToken}`,
      expire_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      shipping_address: null,
      billing_data: {
        customer_email: order.customerEmail,
        customer_full_name: order.customerName,
        customer_phone_number: order.customerPhone
      }
    }

    const response = await fetch(`${WOMPI_BASE_URL}/payment_links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Wompi error:', result)
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

    // Update order with payment ID
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: result.data.id }
    })

    return NextResponse.json({
      paymentUrl: result.data.permalink,
      paymentId: result.data.id
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// Webhook for payment status updates
export async function PUT(request) {
  try {
    const signature = request.headers.get('x-signature')
    const timestamp = request.headers.get('x-timestamp')
    const body = await request.text()

    // Verify webhook signature (important for security)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WOMPI_WEBHOOK_SECRET)
      .update(body + timestamp)
      .digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    
    if (event.event === 'transaction.updated') {
      const transaction = event.data.transaction
      
      // Find order by payment ID
      const order = await prisma.order.findFirst({
        where: { paymentId: transaction.payment_link_id }
      })

      if (order) {
        let status = 'PENDING'
        
        if (transaction.status === 'APPROVED') {
          status = 'PAID'
          
          // Create download records
          const orderWithItems = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true }
          })

          const downloadRecords = orderWithItems.items.map(item => ({
            orderId: order.id,
            wallpaperId: item.wallpaperId,
            customerEmail: order.customerEmail
          }))

          await prisma.download.createMany({
            data: downloadRecords,
            skipDuplicates: true
          })

          // TODO: Send email with download links
          
        } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
          status = 'FAILED'
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status,
            paymentMethod: transaction.payment_method?.type
          }
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}