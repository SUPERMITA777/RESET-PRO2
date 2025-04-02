import { createClient } from "@supabase/supabase-js"

// Creamos un cliente de Supabase para el lado del servidor
const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// Cliente para usar en componentes del lado del servidor o en Server Actions
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

