
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'tongvanhoang782004@gmail.com';
    console.log(`Updating role for ${email}...`);

    const user = await prisma.users.update({
        where: { email },
        data: { role: 'admin' }
    });

    console.log('User updated:', JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
        , 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
