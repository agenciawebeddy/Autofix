import { createClient } from '@supabase/supabase-js';

// Configuration from user prompt
const supabaseUrl = 'https://yvmayvtvpdwhijvmakwk.supabase.co';
const supabaseKey = 'sb_publishable_Gr9aF5oh6nUMID8Qr_D-Bg_GOh4L6yT';

export const supabase = createClient(supabaseUrl, supabaseKey);