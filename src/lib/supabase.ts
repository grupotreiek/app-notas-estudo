// Supabase client desabilitado - aplicativo funciona 100% offline com localStorage
// Para reativar, configure as variáveis de ambiente e descomente o código abaixo

/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})
*/

// Cliente desabilitado - não use este arquivo
// Aplicativo funciona 100% com localStorage
export const supabase = null
