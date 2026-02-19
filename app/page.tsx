export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Página raíz (/).
 * Redirige automáticamente al dashboard si hay sesión activa,
 * o al login si no hay usuario autenticado.
 */
export default async function RootPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect("/dashboard")
    else redirect("/login")
}
