import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'hoang',
  port: 8080,
  database: 'fashion_store',
  multipleStatements: true
};

const SQL_FILE_PATH = 'C:/Users/Hoang/Desktop/VsCode/ShopFeshen/fashion_store.sql';

async function importDb() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(DB_CONFIG);

    console.log('Cleaning database...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const [tables] = await connection.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'fashion_store'");
    
    console.log(`Found ${tables.length} tables to drop.`);

    for (const row of tables) {
      console.log(`Dropping table ${row.TABLE_NAME || row.table_name}...`);
      await connection.query(`DROP TABLE IF EXISTS \`${row.TABLE_NAME || row.table_name}\``);
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`Reading SQL file from ${SQL_FILE_PATH}...`);
    const sql = await fs.readFile(SQL_FILE_PATH, 'utf8');

    console.log('Executing SQL script...');
    await connection.query(sql);
    
    console.log('Adding missing columns to products table...');
    await connection.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS length DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS width DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS height DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS brand_id BIGINT UNSIGNED NULL,
      ADD COLUMN IF NOT EXISTS tags TEXT NULL
    `);
    
    console.log('Database imported and updated successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error importing database:', error);
    process.exit(1);
  }
}

importDb();
