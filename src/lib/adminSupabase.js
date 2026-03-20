import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Este cliente utiliza la Service Role Key, por lo que BYPASSEA todas las RLS Policies.
// Usar EXCLUSIVAMENTE para acciones administrativas que no se puedan realizar con el cliente standard.
export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
