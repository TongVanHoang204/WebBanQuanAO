
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  try {
    const counts = await prisma.orders.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    let output = "STATUS COUNTS:\n";
    counts.forEach(c => {
      output += `${c.status}: ${c._count.id}\n`;
    });
    
    fs.writeFileSync('debug_output.txt', output);
    console.log('Saved to debug_output.txt');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
