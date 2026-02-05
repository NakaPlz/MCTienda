import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local');
    console.error('Please add your SUPABASE_SERVICE_ROLE_KEY to .env.local to run this admin script.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CSV_PATH = path.join(process.cwd(), 'productos_mc_1-1-2026.csv');

// Interfaces
interface CsvRow {
    ID: string;
    Tipo: string;
    SKU: string;
    Nombre: string;
    Categoria: string;
    Precio: string;
    Costo: string;
    Stock: string;
    'Alerta Stock': string;
    Descripcion: string;
    'Imagen URL': string;
    Activo: string;
}

interface ProductGroup {
    baseName: string;
    price: number;
    description: string;
    categoryKeyword: string; // To infer category
    brandKeyword: string;    // To infer brand
    images: Set<string>;
    variants: VariantItem[];
}

interface VariantItem {
    sku: string;
    stock: number;
    attributes: Record<string, string>;
    imageUrl: string;
}

// Helpers for Inference
const BRANDS_KEYWORDS = ['Lagomarsino', 'Mission', 'MuyCriollo', 'Vento'];
const CATEGORY_MAP: Record<string, string> = {
    'Cuchillo': 'Cuchillería',
    'Cuchilla': 'Cuchillería',
    'Sombrero': 'Sombreros',
    'Gorra': 'Sombreros',
    'Boina': 'Sombreros',
    'Tabla': 'Accesorios',
    'Caja': 'Accesorios',
    'Delantal': 'Indumentaria',
    'Faldon': 'Indumentaria',
};

async function main() {
    console.log('🚀 Starting CSV Import...');

    // 1. Read CSV
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV File not found at: ${CSV_PATH}`);
        process.exit(1);
    }
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records: CsvRow[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });
    console.log(`📊 Found ${records.length} rows.`);

    // 2. Fetch or Create Categories and Brands maps
    const { data: dbCategories } = await supabase.from('categories').select('id, name');
    const { data: dbBrands } = await supabase.from('brands').select('id, name');

    let categoryMap = new Map<string, string>(); // Name -> ID
    dbCategories?.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

    let brandMap = new Map<string, string>(); // Name -> ID
    dbBrands?.forEach(b => brandMap.set(b.name.toLowerCase(), b.id));

    // Helper to get/create ID
    async function getCategoryId(keyword: string): Promise<string | null> {
        const name = CATEGORY_MAP[keyword] || 'Varios';
        const lowerName = name.toLowerCase();
        if (categoryMap.has(lowerName)) return categoryMap.get(lowerName)!;

        // Create
        const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { data, error } = await supabase.from('categories').insert({ name, slug }).select().single();
        if (error || !data) {
            console.error('Error creating category:', name, error);
            return null;
        }
        categoryMap.set(lowerName, data.id);
        return data.id;
    }

    async function getBrandId(name: string): Promise<string | null> {
        const lowerName = name.toLowerCase();
        if (brandMap.has(lowerName)) return brandMap.get(lowerName)!;

        // Create
        const { data, error } = await supabase.from('brands').insert({ name }).select().single();
        if (error || !data) {
            console.error('Error creating brand:', name, error);
            return null;
        }
        brandMap.set(lowerName, data.id);
        return data.id;
    }

    // 3. Group Products
    const groups = new Map<string, ProductGroup>();

    for (const row of records) {
        // Parse Name: "Base Name - Variant Info"
        // Example: "Sombrero Lagomarsino Pampa - Tostado / XL"
        // Regex: Search for " - " as separator.
        const separatorIndex = row.Nombre.indexOf(' - ');
        let baseName = row.Nombre;
        let variantStr = '';

        if (separatorIndex !== -1) {
            baseName = row.Nombre.substring(0, separatorIndex).trim();
            variantStr = row.Nombre.substring(separatorIndex + 3).trim();
        } else {
            // No separator, check if it looks like a base product
            // Assume no variants or trivial variant
        }

        if (!groups.has(baseName)) {
            // Infer Keywords
            let catKey = 'Varios';
            for (const key of Object.keys(CATEGORY_MAP)) {
                if (baseName.includes(key)) {
                    catKey = key;
                    break;
                }
            }
            let brandKey = 'Genérica';
            for (const key of BRANDS_KEYWORDS) {
                if (baseName.includes(key)) {
                    brandKey = key;
                    break;
                }
            }

            groups.set(baseName, {
                baseName,
                price: parseFloat(row.Precio) || 0,
                description: row.Descripcion,
                categoryKeyword: catKey,
                brandKeyword: brandKey,
                images: new Set(),
                variants: []
            });
        }

        const group = groups.get(baseName)!;
        if (row['Imagen URL']) group.images.add(row['Imagen URL']);

        // Parse Attributes
        // variantStr = "Tostado / XL" or "Principal" or "Caqui"
        const attrs: Record<string, string> = {};
        if (variantStr && variantStr !== 'Principal') {
            if (variantStr.includes('/')) {
                const parts = variantStr.split('/').map(s => s.trim());
                if (parts[0]) attrs['Color'] = parts[0];
                if (parts[1]) attrs['Talle'] = parts[1];
            } else {
                // Single variant, guess type
                // If it matches common sizes S, M, L, XL -> Talle
                // Else -> Color/Variante
                if (['S', 'M', 'L', 'XL', 'XXL', 'XS'].includes(variantStr)) {
                    attrs['Talle'] = variantStr;
                } else {
                    // Try to differentiate Color vs Style? hard. default to "Variante" or "Color"
                    attrs['Variante'] = variantStr;
                }
            }
        } else {
            attrs['Tipo'] = 'Único';
        }

        group.variants.push({
            sku: row.SKU || '',
            stock: parseInt(row.Stock) || 0,
            attributes: attrs,
            imageUrl: row['Imagen URL']
        });
    }

    console.log(`📦 Identified ${groups.size} unique products.`);

    // 4. Process Groups & Insert
    for (const group of groups.values()) {
        console.log(`Processing: ${group.baseName}...`);

        // Check if exists (by name)
        const { data: existing } = await supabase.from('products').select('id').eq('name', group.baseName).single();
        let productId = existing?.id;

        if (!productId) {
            const catId = await getCategoryId(group.categoryKeyword);
            const brandId = await getBrandId(group.brandKeyword);
            // Calculate total stock
            const totalStock = group.variants.reduce((acc, v) => acc + v.stock, 0);

            const { data: newProd, error } = await supabase.from('products').insert({
                name: group.baseName,
                description: group.description,
                price: group.price,
                category_id: catId,
                brand_id: brandId,
                active: true,
                stock: totalStock // Initial total stock
            }).select('id').single();

            if (error) {
                console.error(`Failed to insert product ${group.baseName}`, error);
                continue;
            }
            productId = newProd.id;
        } else {
            console.log(`Product ${group.baseName} already exists, skipping creation (will check variants).`);
            // Optional: Update stock?
        }

        // Insert Images
        // Naive: just insert all unique URLs found. 
        // In a real scenario, we might want to check duplicates or order them.
        let displayOrder = 0;
        for (const url of group.images) {
            // Check if image exists?
            // Simply insert
            await supabase.from('product_images').insert({
                product_id: productId,
                url: url,
                display_order: displayOrder++
            });
        }

        // Insert Combinations (and Vectors of Variants)
        // We need to populate `product_variants` (definitions) AND `product_combinations` (stock matrix).
        // 1. Identify all unique Attribute Keys and Values for this product
        const attrKeys = new Set<string>();
        group.variants.forEach(v => Object.keys(v.attributes).forEach(k => attrKeys.add(k)));

        // Create Variant Definitions (for the UI selectors)
        for (const key of attrKeys) {
            const values = new Set<string>();
            group.variants.forEach(v => {
                if (v.attributes[key]) values.add(v.attributes[key]);
            });

            // Insert into product_variants
            // Note: table schema is (id, product_id, type, value)
            for (const val of values) {
                // Check exist
                const { data: exVar } = await supabase.from('product_variants')
                    .select('id')
                    .eq('product_id', productId)
                    .eq('type', key)
                    .eq('value', val)
                    .single();

                if (!exVar) {
                    await supabase.from('product_variants').insert({
                        product_id: productId,
                        type: key,
                        value: val
                    });
                }
            }
        }

        // Create Combinations (Stock Matrix)
        for (const v of group.variants) {
            // Check exist
            // We use the JSON containment operator @> to find if this specific combination of attributes exists
            const { data: exComb } = await supabase.from('product_combinations')
                .select('id')
                .eq('product_id', productId)
                .contains('attributes', v.attributes)
                .single();
            // Note: .contains might match a superset. We want exact? 
            // For now, assume if it contains these attributes it's likely the one.
            // Actually, we should probably delete all previous combinations if we are re-importing? 
            // Or just insert/update.

            if (exComb) {
                await supabase.from('product_combinations').update({
                    stock: v.stock,
                    // sku: v.sku // if we had a sku column in combinations
                }).eq('id', exComb.id);
            } else {
                await supabase.from('product_combinations').insert({
                    product_id: productId,
                    attributes: v.attributes,
                    stock: v.stock
                });
            }
        }
    }

    console.log('✅ Import Completed!');
}

main().catch(e => console.error(e));
