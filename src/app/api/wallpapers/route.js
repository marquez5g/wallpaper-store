import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const skip = (page - 1) * limit

    const where = {
      active: true,
      ...(category && category !== 'All' ? { category } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ]
      } : {})
    }

    const [wallpapers, total] = await Promise.all([
      prisma.wallpaper.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          previewUrl: true,
          thumbnailUrl: true,
          resolution: true,
          downloads: true,
        }
      }),
      prisma.wallpaper.count({ where })
    ])

    return NextResponse.json({
      wallpapers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching wallpapers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallpapers' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    const wallpaper = await prisma.wallpaper.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        price: Math.round(data.price * 100), // Convert to cents
        previewUrl: data.previewUrl,
        fullResUrl: data.fullResUrl,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags || [],
        resolution: data.resolution,
        fileSize: data.fileSize,
      }
    })

    return NextResponse.json(wallpaper, { status: 201 })
  } catch (error) {
    console.error('Error creating wallpaper:', error)
    return NextResponse.json(
      { error: 'Failed to create wallpaper' },
      { status: 500 }
    )
  }
}