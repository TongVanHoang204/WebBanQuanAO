import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  try {
    const reviews = await prisma.$queryRaw`SHOW CREATE TABLE product_reviews`;
    const users = await prisma.$queryRaw`SHOW CREATE TABLE users`;
    fs.writeFileSync('db_out.json', JSON.stringify({reviews, users}, null, 2));
  } catch (e) {
    console.error("Error:", e);
    fs.writeFileSync('db_out.json', JSON.stringify({error: String(e)}));
  } finally {
    await prisma.$disconnect();
  }
}
main();
