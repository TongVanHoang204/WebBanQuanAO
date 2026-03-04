import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Vietnamese names
const firstNames = ['Minh', 'Hùng', 'Anh', 'Tú', 'Linh', 'Hà', 'Phương', 'Thảo', 'Dũng', 'Quang', 'Hải', 'Nam', 'Thu', 'Mai', 'Lan', 'Hương', 'Tuấn', 'Đức', 'Hoàng', 'Long'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];

// Vietnamese cities
const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Biên Hòa', 'Nha Trang', 'Huế', 'Buôn Ma Thuột', 'Vũng Tàu'];
const districts = ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Phú Nhuận', 'Thủ Đức', 'Cầu Giấy', 'Đống Đa'];
const streets = ['Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Võ Văn Tần', 'Điện Biên Phủ', 'Cách Mạng Tháng 8', 'Pasteur', 'Nam Kỳ Khởi Nghĩa', 'Lý Tự Trọng'];

// Product data
const productNames = [
  'Áo thun nam basic', 'Áo polo premium', 'Áo sơ mi công sở', 'Áo khoác bomber',
  'Quần jean slim fit', 'Quần kaki classic', 'Quần short thể thao', 'Quần jogger',
  'Đầm maxi hoa', 'Đầm công sở thanh lịch', 'Chân váy xếp ly', 'Áo croptop nữ',
  'Áo hoodie unisex', 'Áo len cổ lọ', 'Áo blazer nữ', 'Áo cardigan mỏng',
  'Túi tote canvas', 'Balo laptop', 'Ví da nam', 'Túi đeo chéo mini',
  'Giày sneaker trắng', 'Giày oxford nam', 'Sandal nữ', 'Dép quai ngang',
  'Mũ lưỡi trai', 'Mũ bucket hat', 'Khăn choàng cashmere', 'Thắt lưng da cao cấp',
  'Áo thun oversize', 'Áo flannel kẻ sọc', 'Vest nam công sở', 'Áo gile len',
  'Quần culottes', 'Quần ống rộng', 'Quần legging', 'Chân váy midi',
  'Set bộ thể thao', 'Đồ ngủ pijama', 'Áo bra thể thao', 'Quần đùi bơi',
  'Áo thun in họa tiết', 'Áo tank top', 'Áo ba lỗ gym', 'Áo khoác gió',
  'Quần baggy', 'Quần tây âu', 'Váy xòe vintage', 'Đầm body sexy',
  'Áo len gấu', 'Set váy công chúa'
];

const orderStatuses = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '099', '070', '076', '077', '078', '079', '081', '082', '083', '084', '085'];
  return randomElement(prefixes) + randomInt(1000000, 9999999).toString();
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password once
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Create 50 Users
  console.log('Creating users...');
  const users = [];
  for (let i = 1; i <= 50; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const fullName = `${lastName} ${firstName}`;
    const username = `user_${i}_${Date.now() % 10000}`;
    const email = `${slugify(firstName)}${i}@example.com`;
    
    users.push({
      username,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      phone: generatePhone(),
      role: i <= 2 ? 'admin' : 'customer' as any,
      status: Math.random() > 0.1 ? 'active' : 'blocked' as any,
      address_line1: `${randomInt(1, 500)} ${randomElement(streets)}`,
      address_line2: randomElement(districts),
      city: randomElement(districts),
      province: randomElement(cities),
      country: 'VN',
      created_at: randomDate(new Date('2025-01-01'), new Date())
    });
  }

  await prisma.users.createMany({
    data: users,
    skipDuplicates: true
  });
  console.log(`✅ Created ${users.length} users`);

  // Get all users for orders
  const allUsers = await prisma.users.findMany({ where: { role: 'customer' } });

  // 2. Create Categories if not exist
  console.log('Creating categories...');
  const categoryNames = [
    'Áo nam', 'Quần nam', 'Áo nữ', 'Quần nữ', 'Váy đầm', 
    'Túi xách', 'Giày dép', 'Phụ kiện', 'Đồ thể thao', 'Đồ ngủ'
  ];
  
  for (const name of categoryNames) {
    await prisma.categories.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        is_active: true
      }
    });
  }
  console.log(`✅ Created ${categoryNames.length} categories`);

  const allCategories = await prisma.categories.findMany();

  // 3. Create 50 Products
  console.log('Creating products...');
  const createdProducts = [];

  for (let i = 0; i < 50; i++) {
    const name = productNames[i % productNames.length] + (i >= productNames.length ? ` V${Math.floor(i / productNames.length) + 1}` : '');
    const basePrice = randomInt(50, 500) * 1000;
    const slug = slugify(name) + '-' + randomInt(1000, 9999);
    
    try {
      const product = await prisma.products.create({
        data: {
          sku: `SKU-${Date.now()}-${i}`,
          name,
          slug,
          description: `<p>Sản phẩm ${name} chất lượng cao, thiết kế thời trang, phù hợp mọi dịp.</p>`,
          base_price: basePrice,
          compare_at_price: basePrice * 1.2,
          is_active: true,
          category_id: randomElement(allCategories).id,
          created_at: randomDate(new Date('2025-06-01'), new Date())
        }
      });

      // Create variants for each product
      const sizes = ['S', 'M', 'L', 'XL'];
      for (const size of sizes) {
        await prisma.product_variants.create({
          data: {
            product_id: product.id,
            variant_sku: `${product.sku}-${size}`,
            price: basePrice,
            compare_at_price: basePrice * 1.2,
            stock_qty: randomInt(10, 100),
            is_active: true
          }
        });
      }

      createdProducts.push(product);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`✅ Created ${createdProducts.length} products with variants`);

  // Get all variants
  const allVariants = await prisma.product_variants.findMany({
    include: { product: true }
  });

  // 4. Create 100 Orders
  console.log('Creating orders...');
  let orderCount = 0;

  for (let i = 0; i < 100; i++) {
    const user = randomElement(allUsers);
    const orderDate = randomDate(new Date('2025-11-01'), new Date());
    const status = randomElement(orderStatuses) as any;
    const itemCount = randomInt(1, 4);
    
    let subtotal = 0;
    const orderItems = [];

    for (let j = 0; j < itemCount; j++) {
      const variant = randomElement(allVariants);
      const qty = randomInt(1, 3);
      const unitPrice = Number(variant.price);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      orderItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        sku: variant.variant_sku,
        name: variant.product.name,
        unit_price: unitPrice,
        qty,
        line_total: lineTotal
      });
    }

    const shippingFee = subtotal > 500000 ? 0 : 30000;
    const grandTotal = subtotal + shippingFee;

    try {
      await prisma.orders.create({
        data: {
          order_code: `FS${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(i + 100).padStart(4, '0')}`,
          user_id: user.id,
          status,
          subtotal,
          discount_total: 0,
          shipping_fee: shippingFee,
          grand_total: grandTotal,
          customer_name: user.full_name || 'Khách hàng',
          customer_phone: user.phone || generatePhone(),
          ship_address_line1: user.address_line1 || `${randomInt(1, 500)} ${randomElement(streets)}`,
          ship_city: user.city || randomElement(districts),
          ship_province: user.province || randomElement(cities),
          ship_country: 'VN',
          created_at: orderDate,
          order_items: {
            create: orderItems
          }
        }
      });
      orderCount++;
    } catch (e) {
      // Skip errors
    }
  }
  console.log(`✅ Created ${orderCount} orders with items`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
