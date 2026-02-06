import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.users.findFirst({
        where: { status: 'active' }
    });
    if (!user) {
        console.log('No user found');
        return;
    }
    console.log(`User found: ${user.username} (ID: ${user.id})`);
    await prisma.users.update({
        where: { id: user.id },
        data: { two_factor_enabled: true }
    }); // Cast as any if type definition not updated
    console.log('2FA enabled for user.');
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=enable_user_2fa.js.map