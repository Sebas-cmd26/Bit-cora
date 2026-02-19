import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database.types"

/**
 * Crea una instancia del cliente de Supabase para el navegador (Client Component).
 * Utiliza las variables de entorno públicas.
 */
export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
