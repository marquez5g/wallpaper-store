import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

function generateOrderNumber() {
  return `WS${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`
}

function generateDownloadToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request) {
  try {
    const { customerEmail, customerName, customerPhone, items } = await request.json()

    // Validate required fields
    if (!customerEmail || !customerName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get wallpapers and calculate total
    const wallpaperIds = items.map(item => item.wallpaperId)
    const wallpapers = await prisma.wallpaper.findMany({
      where: { id: { in: wallpaperIds }, active: true }
    })

    if (wallpapers.length !== wallpaperIds.length) {
      return NextResponse.json(
        { error: 'Some wallpapers not found or inactive' },
        { status: 400 }
      )
    }

    // Calculate total amount
    let totalAmount = 0
    const orderItems = items.map(item => {
      const wallpaper = wallpapers.find(w => w.id === item.wallpaperId)
      const itemTotal = wallpaper.price * item.quantity
      totalAmount += itemTotal
      
      return {
        wallpaperId: item.wallpaperId,
        quantity: item.quantity,
        price: wallpaper.price
      }
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerEmail,
        customerName,
        customerPhone,
        totalAmount,
        downloadToken: generateDownloadToken(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            wallpaper: {
              select: {
                id: true,
                title: true,
                previewUrl: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      downloadToken: order.downloadToken
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (!email && !token) {
      return NextResponse.json(
        { error: 'Email or token required' },
        { status: 400 }
      )
    }

    const where = token 
      ? { downloadToken: token }
      : { customerEmail: email }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            wallpaper: {
              select: {
                id: true,
                title: true,
                previewUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}