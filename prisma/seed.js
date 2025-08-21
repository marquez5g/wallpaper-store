const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sampleWallpapers = [
  {
    title: 'Mountain Sunset',
    description: 'Beautiful mountain landscape at sunset',
    category: 'Nature',
    price: 1500000, // 15000 COP in cents
    previewUrl: 'https://picsum.photos/400/600?random=1',
    fullResUrl: 'https://picsum.photos/1920/1080?random=1',
    thumbnailUrl: 'https://picsum.photos/300/200?random=1',
    tags: ['mountain', 'sunset', 'landscape', 'nature'],
    resolution: '1920x1080',
    fileSize: '2.3MB'
  },
  {
    title: 'Ocean Waves',
    description: 'Peaceful ocean waves crashing on the shore',
    category: 'Nature',
    price: 1200000, // 12000 COP in cents
    previewUrl: 'https://picsum.photos/400/600?random=2',
    fullResUrl: 'https://picsum.photos/1920/1080?random=2',
    thumbnailUrl: 'https://picsum.photos/300/200?random=2',
    tags: ['ocean', 'waves', 'sea', 'blue', 'peaceful'],
    resolution: '1920x1080',
    fileSize: '1.8MB'
  },
  {
    title: 'City Lights',
    description: 'Stunning cityscape with vibrant night lights',
    category: 'Urban',
    price: 1800000, // 18000 COP in cents
    previewUrl: 'https://picsum.photos/400/600?random=3',
    fullResUrl: 'https://picsum.photos/1920/1080?random=3',
    thumbnailUrl: 'https://picsum.photos/300/200?random=3',
    tags: ['city', 'lights', 'urban', 'night', 'skyline'],
    resolution: '1920x1080',
    fileSize: '3.1MB'
  },
  {
    title: 'Forest Path',
    description: 'Mystical forest path surrounded by tall trees',
    category: 'Nature',
    price: 1400000, // 14000 COP in cents
    previewUrl: 'https://picsum.photos/400/600?random=4',
    fullResUrl: 'https://picsum.photos/1920/1080?random=4',
    thumbnailUrl: 'https://picsum.photos/300/200?random=4',
    tags: ['forest', 'path', 'trees', 'green', 'mystical'],
    resolution: '1920x1080',
    fileSize: '2.7MB'
  },
  {
    title: 'Abstract Colors',
    description: 'Vibrant abstract design with flowing colors',
    category: 'Abstract',
    price: 2000000, // 20000 COP in cents
    previewUrl: 'https://picsum.photos/400/600?random=5',
    fullResUrl: 'https://picsum.photos/1920/1080?random=5',
    thumbnailUrl: 'https://picsum.photos/300/200?random=5',
    tags: ['abstract', 'colors', 'vibrant', 'art', 'design'],
    resolution: '1920x1080',
    fileSize: '1.5MB'
  },
  {
    title: 'Desert Dunes',
    description: 'Golden sand dunes in the Sahara desert',
    category: 'Nature',
    price: 1600000, // 16000 COP in cents
    previewUrl: 'https://picsum.photos/400/600?random=6',
    fullResUrl: 'https://picsum.photos/1920/1080?random=6',
    thumbnailUrl: 'https://picsum.photos/300/200?random=6',
    tags: ['desert', 'dunes', 'sand', 'golden', 'sahara'],
    resolution: '1920x1080',
    fileSize: '2.1MB'
  }
]

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Clean existing data
  await prisma.download.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.wallpaper.deleteMany()
  
  // Create wallpapers
  for (const wallpaper of sampleWallpapers) {
    await prisma.wallpaper.create({
      data: wallpaper
    })
  }
  
  console.log('✅ Database seeded successfully!')
  console.log(`📸 Created ${sampleWallpapers.length} wallpapers`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })