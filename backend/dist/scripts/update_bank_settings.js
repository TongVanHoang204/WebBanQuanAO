import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function updateSettings() {
    try {
        const bankSettings = {
            payment_bank_id: 'MB',
            payment_bank_account: '0935818922',
            payment_bank_account_name: 'TONG VAN HOANG',
            payment_bank_info: 'Ngân hàng: MB Bank\nSTK: 0935818922\nChủ TK: TONG VAN HOANG\nNội dung: [Mã đơn hàng]'
        };
        for (const [key, value] of Object.entries(bankSettings)) {
            await prisma.settings.upsert({
                where: { key: key },
                update: { value: value },
                create: { key: key, value: value }, // removed 'type' as it doesn't exist in schema
            });
            console.log(`Updated ${key}`);
        }
        console.log('Bank settings updated successfully.');
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await prisma.$disconnect();
    }
}
updateSettings();
//# sourceMappingURL=update_bank_settings.js.map