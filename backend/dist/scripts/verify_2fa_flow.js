import { PrismaClient } from '@prisma/client';
const API_URL = 'http://localhost:4000/api';
const prisma = new PrismaClient();
async function main() {
    console.log('--- Testing 2FA Flow ---');
    // 1. Identify User (ensure 2FA is enabled)
    const username = 'khanh';
    const password = '123456';
    console.log(`1. Logging in as ${username}...`);
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) {
            console.error('❌ Login failed:', res.status, await res.text());
            return;
        }
        const data = await res.json();
        if (data.require2fa) {
            console.log('✅ 2FA Required as expected.');
            const userId = data.userId;
            console.log(`   UserId: ${userId}`);
            // 2. Fetch OTP from DB
            console.log('2. Fetching OTP from database...');
            const user = await prisma.users.findUnique({ where: { id: BigInt(userId) } });
            const otp = user.two_factor_otp;
            console.log(`   OTP Found: ${otp}`);
            if (!otp) {
                console.error('❌ OTP not found in DB!');
                return;
            }
            // 3. Verify OTP
            console.log('3. Verifying OTP...');
            const verifyRes = await fetch(`${API_URL}/auth/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp })
            });
            if (!verifyRes.ok) {
                console.error('❌ Verification req failed:', verifyRes.status, await verifyRes.text());
                return;
            }
            const verifyData = await verifyRes.json();
            if (verifyData.success && verifyData.data.token) {
                console.log('✅ 2FA Verification Successful!');
                console.log('   Token received:', verifyData.data.token.substring(0, 20) + '...');
            }
            else {
                console.error('❌ Verification Failed:', verifyData);
            }
        }
        else {
            console.error('❌ Login did not require 2FA. Response:', data);
        }
    }
    catch (error) {
        console.error('❌ Error:', error.message);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=verify_2fa_flow.js.map