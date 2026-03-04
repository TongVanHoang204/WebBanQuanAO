import { prisma } from './lib/prisma.js';
export { prisma };
declare global {
    interface BigInt {
        toJSON(): string | number;
    }
}
//# sourceMappingURL=server.d.ts.map