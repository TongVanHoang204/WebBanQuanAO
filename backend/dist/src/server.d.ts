import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare global {
    interface BigInt {
        toJSON(): string | number;
    }
}
//# sourceMappingURL=server.d.ts.map