"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BitacoraRegistro } from "@/lib/types/database.types"
import { PlusCircle, Loader2, FileText } from "lucide-react"
import FileUpload from "./FileUpload"

interface NuevoRegistroFormProps {
    iniciativaId: string
    /** Callback al crear un registro exitosamente */
    onCreated: (reg: BitacoraRegistro) => void
}

/**
 * Formulario para agregar un nuevo registro a la bitácora de una iniciativa.
 * Permite ingresar texto y adjuntar archivos opcionalmente.
 */
export default function NuevoRegistroForm({ iniciativaId, onCreated }: NuevoRegistroFormProps) {
    const [descripcion, setDescripcion] = useState("")
    /** URL del archivo adjunto (si se subió uno) */
    const [adjuntoUrl, setAdjuntoUrl] = useState<string | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    /**
     * Maneja el envío del formulario.
     * Crea un registro en la tabla 'bitacora_registros'.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!descripcion.trim()) return
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
            .from("bitacora_registros")
            .insert({
                iniciativa_id: iniciativaId,
                descripcion: descripcion.trim(),
                adjunto_url: adjuntoUrl,
            })
            .select()
            .single()

        if (err) setError(err.message)
        else {
            onCreated(data)
            setDescripcion("")
            setAdjuntoUrl(null)
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Nuevo Registro</h3>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Descripcion
                </label>
                <textarea
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe lo ocurrido, avances, decisiones tomadas..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Adjunto (opcional)</label>
                <FileUpload onUploaded={url => setAdjuntoUrl(url)} />
                {adjuntoUrl && (
                    <p className="text-xs text-emerald-400 truncate">Adjunto listo: {adjuntoUrl.split("/").pop()}</p>
                )}
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <button
                type="submit"
                disabled={loading || !descripcion.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Registro
            </button>
        </form>
    )
}
