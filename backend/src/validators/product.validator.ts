import { z } from 'zod';

const attributeSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1))
});

const variantSchema = z.object({
  variant_sku: z.string().max(120).optional(), // Optional if auto-generated
  sku: z.string().max(120).optional(), // Frontend calls it 'sku'
  price: z.union([z.string(), z.number()]).transform(val => Number(val)),
  compare_at_price: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
  cost: z.number().nonnegative().optional(),
  stock_qty: z.union([z.string(), z.number()]).transform(val => Number(val)).default(0),
  is_active: z.boolean().default(true),
  options: z.record(z.string()).optional(), // { "Color": "Red" }
  weight: z.number().optional()
});

const imageSchema = z.object({
  url: z.string().min(1).max(1000),
  alt_text: z.string().max(255).optional(),
  is_primary: z.boolean().default(false),
  sort_order: z.number().int().nonnegative().default(0)
});

export const createProductSchema = z.object({
  category_id: z.union([z.string(), z.number()]).optional(),
  brand_id: z.union([z.string(), z.number()]).optional(),
  sku: z.string().min(1, 'SKU is required').max(80),
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(270),
  description: z.string().optional(),
  base_price: z.union([z.string(), z.number()]).transform(val => Number(val)),
  compare_at_price: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
  is_active: z.boolean().default(true),
  variants: z.array(variantSchema).optional(),
  attributes: z.array(attributeSchema).optional(),
  images: z.array(imageSchema).optional(),
  
  // SEO
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  tags: z.string().optional(),
  
  // Shipping (Optional now)
  weight: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
  length: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
  width: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
  height: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  variants: z.array(variantSchema.extend({ id: z.number().int().positive().optional() })).optional(),
  images: z.array(imageSchema.extend({ id: z.number().int().positive().optional() })).optional()
});

export const productQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc']).default('newest'),
  min_price: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  max_price: z.string().transform(Number).pipe(z.number().nonnegative()).optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
