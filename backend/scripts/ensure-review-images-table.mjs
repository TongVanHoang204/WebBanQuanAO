import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS review_images (
      id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
      review_id bigint(20) unsigned NOT NULL,
      image_url varchar(1000) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT current_timestamp(3),
      PRIMARY KEY (id),
      KEY idx_ri_review (review_id),
      CONSTRAINT review_images_review_id_fkey FOREIGN KEY (review_id)
        REFERENCES product_reviews (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('review_images table is ready');
}

main()
  .catch((error) => {
    console.error('Failed to ensure review_images table:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
