import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Adding reward_points to users...");
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN reward_points INT NOT NULL DEFAULT 0;`;
    
    console.log("Adding foreign key to product_reviews...");
    await prisma.$executeRaw`ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;`;

    console.log("Creating review_images table...");
    await prisma.$executeRaw`
      CREATE TABLE \`review_images\` (
        \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        \`review_id\` bigint(20) unsigned NOT NULL,
        \`image_url\` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`created_at\` datetime(3) NOT NULL DEFAULT current_timestamp(3),
        PRIMARY KEY (\`id\`),
        KEY \`idx_ri_review\` (\`review_id\`),
        CONSTRAINT \`review_images_review_id_fkey\` FOREIGN KEY (\`review_id\`) REFERENCES \`product_reviews\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    console.log("Success!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
