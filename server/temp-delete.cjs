const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    await prisma.$queryRaw`DELETE FROM mesures_annuelles CASCADE`;
    await prisma.$queryRaw`DELETE FROM indicateurs CASCADE`;
    await prisma.$queryRaw`DELETE FROM objectifs_strategiques CASCADE`;
    await prisma.$queryRaw`DELETE FROM programmes_ldf CASCADE`;
    console.log('done');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
clean();
