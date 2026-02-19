export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import DetalleBitacoraClient from "@/components/DetalleBitacoraClient"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DetalleIniciativaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: iniciativa } = await supabase
    .from("iniciativas")
    .select("*")
    .eq("id", id)
    .single()

  if (!iniciativa) notFound()

  const { data: registros } = await supabase
    .from("bitacora_registros")
    .select("*")
    .eq("iniciativa_id", id)
    .order("fecha", { ascending: false })

  return <DetalleBitacoraClient iniciativa={iniciativa} registros={registros ?? []} />
}