import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedHouseholdItems() {
    console.log('Seeding "Household items" category...');

    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id');

    if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
        return;
    }

    console.log(`Found ${tenants.length} tenants.`);

    for (const tenant of tenants) {
        const { data: existing, error: checkError } = await supabase
            .from('exchange_categories')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('name', 'Household items')
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is no rows found
            console.error(`Error checking category for tenant ${tenant.id}:`, checkError);
            continue;
        }

        if (!existing) {
            console.log(`Adding "Household items" for tenant ${tenant.id}...`);
            const { error: insertError } = await supabase
                .from('exchange_categories')
                .insert({
                    tenant_id: tenant.id,
                    name: 'Household items',
                    description: 'Share furniture, appliances, and home decor',
                });

            if (insertError) {
                console.error(`Error inserting category for tenant ${tenant.id}:`, insertError);
            } else {
                console.log(`Success for tenant ${tenant.id}`);
            }
        } else {
            console.log(`"Household items" already exists for tenant ${tenant.id}`);
        }
    }
}

seedHouseholdItems();
