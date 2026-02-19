"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Iniciativa, ETAPAS, EtapaType } from "@/lib/types/database.types"
import { X, Loader2, BookPlus } from "lucide-react"

export default function NuevaIniciativaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (ini: Iniciativa) => void
}) {
  const [codigo, setCodigo] = useState("")
  const [nombre, setNombre] = useState("")
  const [etapa, setEtapa] = useState<EtapaType>("Identificación de oportunidad")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("No autenticado"); setLoading(false); return }

    const { data, error: err } = await supabase
      .from("iniciativas")
      .insert({ codigo: codigo.trim().toUpperCase(), nombre: nombre.trim(), etapa, owner_id: user.id })
      .select()
      .single()

    if (err) setError(err.message)
    else { onCreated(data); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <BookPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-slate-900 dark:text-white font-semibold">Nueva Iniciativa</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Codigo del Proyecto</label>
            <input
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              required
              placeholder="Ej: PRJ-2024-001"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase text-sm font-mono transition-shadow shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre de la Iniciativa</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              placeholder="Desarrollo de nueva plataforma..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-shadow shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Etapa Inicial</label>
            <div className="relative">
              <select
                value={etapa}
                onChange={e => setEtapa(e.target.value as EtapaType)}
                className="w-full appearance-none bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-sm"
              >
                {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm font-medium">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm shadow-primary-500/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear Iniciativa
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}