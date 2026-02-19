export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server"
import InitiativasClient from "@/components/InitiativasClient"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: iniciativas } = await supabase
    .from("iniciativas")
    .select("*")
    .order("created_at", { ascending: false })

  return <InitiativasClient iniciativas={iniciativas ?? []} />
}
