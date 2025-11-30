import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.shippingZone.count();
  console.log(`Shipping Zones: ${count}`);
  
  if (count === 0) {
    console.log('Creating default zone...');
    await prisma.shippingZone.create({
      data: {
        name: 'Default Zone',
        countries: ['BO'], // Bolivia
        is_active: true
      }
    });
    console.log('Default zone created.');
  } else {
    const zones = await prisma.shippingZone.findMany();
    console.log('Zones:', zones);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
