export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server"
import InitiativasClient from "@/components/InitiativasClient"

/**
 * Página principal del Dashboard.
 * Carga las iniciativas desde el servidor (SSR) y las pasa al cliente.
 */
export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: iniciativas } = await supabase
        .from("iniciativas")
        .select("*")
        .order("created_at", { ascending: false })

    return <InitiativasClient iniciativas={iniciativas ?? []} />
}
