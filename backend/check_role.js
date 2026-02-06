
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper to handle BigInt serialization
const replacer = (key, value) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

async function main() {
    const users = await prisma.users.findMany({
        where: { email: { contains: 'gmail.com' } },
        select: { id: true, username: true, email: true, role: true }
    });
    console.log(JSON.stringify(users, replacer, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
