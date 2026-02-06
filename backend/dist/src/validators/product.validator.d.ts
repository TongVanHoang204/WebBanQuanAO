import { z } from 'zod';
export declare const createProductSchema: z.ZodObject<{
    category_id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    brand_id: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    sku: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    base_price: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>;
    compare_at_price: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
    is_active: z.ZodDefault<z.ZodBoolean>;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        variant_sku: z.ZodOptional<z.ZodString>;
        sku: z.ZodOptional<z.ZodString>;
        price: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>;
        compare_at_price: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
        cost: z.ZodOptional<z.ZodNumber>;
        stock_qty: z.ZodDefault<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
        is_active: z.ZodDefault<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        weight: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        is_active: boolean;
        price: number;
        stock_qty: number;
        sku?: string | undefined;
        compare_at_price?: number | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        options?: Record<string, string> | undefined;
    }, {
        price: string | number;
        sku?: string | undefined;
        compare_at_price?: string | number | undefined;
        is_active?: boolean | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        stock_qty?: string | number | undefined;
        options?: Record<string, string> | undefined;
    }>, "many">>;
    attributes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        values: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        values: string[];
    }, {
        name: string;
        values: string[];
    }>, "many">>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt_text: z.ZodOptional<z.ZodString>;
        is_primary: z.ZodDefault<z.ZodBoolean>;
        sort_order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        sort_order: number;
        is_primary: boolean;
        alt_text?: string | undefined;
    }, {
        url: string;
        sort_order?: number | undefined;
        is_primary?: boolean | undefined;
        alt_text?: string | undefined;
    }>, "many">>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    meta_keywords: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodString>;
    weight: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
    length: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
    width: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
    height: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
}, "strip", z.ZodTypeAny, {
    sku: string;
    name: string;
    slug: string;
    base_price: number;
    is_active: boolean;
    category_id?: string | number | undefined;
    description?: string | undefined;
    compare_at_price?: number | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    meta_keywords?: string | undefined;
    weight?: number | undefined;
    length?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    brand_id?: string | number | undefined;
    tags?: string | undefined;
    variants?: {
        is_active: boolean;
        price: number;
        stock_qty: number;
        sku?: string | undefined;
        compare_at_price?: number | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        options?: Record<string, string> | undefined;
    }[] | undefined;
    attributes?: {
        name: string;
        values: string[];
    }[] | undefined;
    images?: {
        url: string;
        sort_order: number;
        is_primary: boolean;
        alt_text?: string | undefined;
    }[] | undefined;
}, {
    sku: string;
    name: string;
    slug: string;
    base_price: string | number;
    category_id?: string | number | undefined;
    description?: string | undefined;
    compare_at_price?: string | number | undefined;
    is_active?: boolean | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    meta_keywords?: string | undefined;
    weight?: string | number | undefined;
    length?: string | number | undefined;
    width?: string | number | undefined;
    height?: string | number | undefined;
    brand_id?: string | number | undefined;
    tags?: string | undefined;
    variants?: {
        price: string | number;
        sku?: string | undefined;
        compare_at_price?: string | number | undefined;
        is_active?: boolean | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        stock_qty?: string | number | undefined;
        options?: Record<string, string> | undefined;
    }[] | undefined;
    attributes?: {
        name: string;
        values: string[];
    }[] | undefined;
    images?: {
        url: string;
        sort_order?: number | undefined;
        is_primary?: boolean | undefined;
        alt_text?: string | undefined;
    }[] | undefined;
}>;
export declare const updateProductSchema: z.ZodObject<{
    category_id: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    brand_id: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    base_price: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
    compare_at_price: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    attributes: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        values: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        values: string[];
    }, {
        name: string;
        values: string[];
    }>, "many">>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_keywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    weight: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>>;
    length: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>>;
    width: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>>;
    height: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>>;
} & {
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        variant_sku: z.ZodOptional<z.ZodString>;
        sku: z.ZodOptional<z.ZodString>;
        price: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>;
        compare_at_price: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
        cost: z.ZodOptional<z.ZodNumber>;
        stock_qty: z.ZodDefault<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, number, string | number>>;
        is_active: z.ZodDefault<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        weight: z.ZodOptional<z.ZodNumber>;
    } & {
        id: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        is_active: boolean;
        price: number;
        stock_qty: number;
        id?: number | undefined;
        sku?: string | undefined;
        compare_at_price?: number | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        options?: Record<string, string> | undefined;
    }, {
        price: string | number;
        id?: number | undefined;
        sku?: string | undefined;
        compare_at_price?: string | number | undefined;
        is_active?: boolean | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        stock_qty?: string | number | undefined;
        options?: Record<string, string> | undefined;
    }>, "many">>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt_text: z.ZodOptional<z.ZodString>;
        is_primary: z.ZodDefault<z.ZodBoolean>;
        sort_order: z.ZodDefault<z.ZodNumber>;
    } & {
        id: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        sort_order: number;
        is_primary: boolean;
        id?: number | undefined;
        alt_text?: string | undefined;
    }, {
        url: string;
        id?: number | undefined;
        sort_order?: number | undefined;
        is_primary?: boolean | undefined;
        alt_text?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    category_id?: string | number | undefined;
    sku?: string | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    base_price?: number | undefined;
    compare_at_price?: number | undefined;
    is_active?: boolean | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    meta_keywords?: string | undefined;
    weight?: number | undefined;
    length?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    brand_id?: string | number | undefined;
    tags?: string | undefined;
    variants?: {
        is_active: boolean;
        price: number;
        stock_qty: number;
        id?: number | undefined;
        sku?: string | undefined;
        compare_at_price?: number | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        options?: Record<string, string> | undefined;
    }[] | undefined;
    attributes?: {
        name: string;
        values: string[];
    }[] | undefined;
    images?: {
        url: string;
        sort_order: number;
        is_primary: boolean;
        id?: number | undefined;
        alt_text?: string | undefined;
    }[] | undefined;
}, {
    category_id?: string | number | undefined;
    sku?: string | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    base_price?: string | number | undefined;
    compare_at_price?: string | number | undefined;
    is_active?: boolean | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    meta_keywords?: string | undefined;
    weight?: string | number | undefined;
    length?: string | number | undefined;
    width?: string | number | undefined;
    height?: string | number | undefined;
    brand_id?: string | number | undefined;
    tags?: string | undefined;
    variants?: {
        price: string | number;
        id?: number | undefined;
        sku?: string | undefined;
        compare_at_price?: string | number | undefined;
        is_active?: boolean | undefined;
        weight?: number | undefined;
        variant_sku?: string | undefined;
        cost?: number | undefined;
        stock_qty?: string | number | undefined;
        options?: Record<string, string> | undefined;
    }[] | undefined;
    attributes?: {
        name: string;
        values: string[];
    }[] | undefined;
    images?: {
        url: string;
        id?: number | undefined;
        sort_order?: number | undefined;
        is_primary?: boolean | undefined;
        alt_text?: string | undefined;
    }[] | undefined;
}>;
export declare const productQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodEnum<["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"]>>;
    min_price: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    max_price: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    sort: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
    page: number;
    limit: number;
    category?: string | undefined;
    search?: string | undefined;
    min_price?: number | undefined;
    max_price?: number | undefined;
}, {
    category?: string | undefined;
    search?: string | undefined;
    sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "name_desc" | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    min_price?: string | undefined;
    max_price?: string | undefined;
}>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
//# sourceMappingURL=product.validator.d.ts.map