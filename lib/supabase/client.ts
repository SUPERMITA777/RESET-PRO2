import { createClient } from "@supabase/supabase-js"

// Creamos un cliente de Supabase para el lado del cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Creamos un singleton para el cliente de Supabase
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Cliente para usar en componentes del lado del cliente
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient()
  }
  return supabaseClient
}

