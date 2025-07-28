const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Public client using the 'anon' key
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client using the 'service_role' key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Export both clients
module.exports = { supabase, supabaseAdmin };