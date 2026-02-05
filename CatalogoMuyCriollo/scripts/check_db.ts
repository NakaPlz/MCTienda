import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`Total Products in DB: ${count}`);
    if (error) console.error(error);

    const { data } = await supabase.from('products').select('name').order('name');
    console.log('Sample Products:', data?.map(d => d.name).slice(0, 10));
}

check();
