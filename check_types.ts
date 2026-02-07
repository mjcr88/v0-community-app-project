import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Checking path_length Type ---');
  const { data, error } = await supabase
    .from('locations')
    .select('path_length, elevation_gain')
    .not('path_length', 'is', null)
    .limit(1);

  if (error) {
    console.error('Error fetching one location:', error);
  } else if (data && data.length > 0) {
    console.log('Sample Data:', data[0]);
    console.log('Type of path_length:', typeof data[0].path_length);
    console.log('Type of elevation_gain:', typeof data[0].elevation_gain);
  } else {
    console.log('No data found with path_length');
  }

  console.log('\n--- Checking Implicit Join Query ---');
  try {
    const { data: joinData, error: joinError } = await supabase
      .from('locations')
      .select('id, neighborhoods:neighborhood_id(id, name)')
      .limit(1);

    if (joinError) {
      console.error('Implicit Join Error:', joinError);
    } else {
      console.log('Implicit Join Success. Data:', joinData);
    }
  } catch (e) {
    console.error('Exception during join:', e);
  }
}

check();
