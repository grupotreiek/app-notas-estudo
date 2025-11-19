import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validação das variáveis de ambiente
const isValidUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

const isValidKey = (key: string) => {
  return key.length > 20 // Chaves Supabase são longas
}

// Criar cliente apenas se as credenciais forem válidas
let supabase: ReturnType<typeof createClient>

if (isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey)) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Cliente mock para evitar erros em desenvolvimento
  console.warn('⚠️ Supabase não configurado corretamente. Configure as variáveis de ambiente.')
  
  // Criar um cliente mock que não faz nada
  supabase = {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      update: () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      delete: () => ({ data: null, error: { message: 'Supabase não configurado' } }),
    }),
  } as any
}

export { supabase }
