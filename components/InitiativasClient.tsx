"use client"

import { useState } from "react"
import { Iniciativa, EtapaType, ETAPAS } from "@/lib/types/database.types"
import Link from "next/link"
import { Plus, Search, ChevronRight, Calendar, Tag, TrendingUp, Filter, Trash2, Loader2, AlertCircle, AlertTriangle, X } from "lucide-react"
import NuevaIniciativaModal from "@/components/NuevaIniciativaModal"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "@/hooks/use-profile"

const etapaColor: Record<string, string> = {
    "Identificación de oportunidad": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    "Diseño Integral": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    "Implementación de piloto": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    "Escalamiento y mejora continua": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
}

export default function InitiativasClient({ iniciativas }: { iniciativas: Iniciativa[] }) {
    const { isAdmin, loading: profileLoading } = useProfile()
    const [filter, setFilter] = useState<string>("Todas")
    const [search, setSearch] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [items, setItems] = useState<Iniciativa[]>(iniciativas)

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [initToDelete, setInitToDelete] = useState<{ id: string, nombre: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const supabase = createClient()

    const filtered = items.filter(i => {
        const matchEtapa = filter === "Todas" || i.etapa === filter
        const q = (search || "").toLowerCase()
        const nombre = (i.nombre || "").toLowerCase()
        const codigo = (i.codigo || "").toLowerCase()
        const matchSearch = !q || nombre.includes(q) || codigo.includes(q)
        return matchEtapa && matchSearch
    })

    // Open the custom modal
    const promptDelete = (id: string, nombre: string) => {
        setInitToDelete({ id, nombre })
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!initToDelete) return
        setIsDeleting(true)

        // 1. Delete associated logs
        await supabase.from("bitacora_registros").delete().eq("iniciativa_id", initToDelete.id)

        // 2. Delete the initiative
        const { error } = await supabase.from("iniciativas").delete().eq("id", initToDelete.id)

        if (error) {
            alert("Error al eliminar: " + error.message)
        } else {
            setItems(prev => prev.filter(i => i.id !== initToDelete.id))
            setDeleteModalOpen(false)
        }
        setIsDeleting(false)
        setInitToDelete(null)
    }

    const stats = {
        total: items.length,
        activas: items.filter(i => i.etapa !== "Escalamiento y mejora continua").length,
        finalizadas: items.filter(i => i.etapa === "Escalamiento y mejora continua").length,
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Iniciativas</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Visión general del portafolio de proyectos</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-md shadow-primary-500/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Nueva Iniciativa
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Iniciativas", value: stats.total, icon: TrendingUp, color: "text-primary-600 dark:text-primary-400", bg: "bg-primary-50 dark:bg-primary-900/20" },
                    { label: "En Progreso", value: stats.activas, icon: Tag, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
                    { label: "Escaladas/Finalizadas", value: stats.finalizadas, icon: Calendar, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${s.bg}`}>
                            <s.icon className={`w-6 h-6 ${s.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, código..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                    <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
                    {["Todas", ...ETAPAS].map(e => (
                        <button
                            key={e}
                            onClick={() => setFilter(e)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${filter === e
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="font-semibold text-lg text-slate-900 dark:text-white">No se encontraron resultados</p>
                        <p className="text-sm mt-1">
                            Prueba ajustando los filtros {isAdmin && "o crea una nueva iniciativa"}.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="text-left px-6 py-4">Código</th>
                                    <th className="text-left px-6 py-4">Iniciativa</th>
                                    <th className="text-left px-6 py-4">Etapa Actual</th>
                                    <th className="text-left px-6 py-4">Fecha Creación</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map(ini => (
                                    <tr key={ini.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-primary-600 dark:text-primary-400 text-xs font-bold bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md border border-primary-100 dark:border-primary-800/50">
                                                {ini.codigo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900 dark:text-white font-medium text-sm">{ini.nombre}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${etapaColor[ini.etapa ?? ""] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                {ini.etapa}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {ini.created_at ? new Date(ini.created_at).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/iniciativas/${ini.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition"
                                            >
                                                Ver Bitácora <ChevronRight className="w-4 h-4" />
                                            </Link>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => promptDelete(ini.id, ini.nombre)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Eliminar iniciativa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <NuevaIniciativaModal
                    onClose={() => setShowModal(false)}
                    onCreated={ini => setItems(prev => [ini, ...prev])}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModalOpen && initToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">¿Eliminar Iniciativa?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Estás a punto de eliminar <strong>"{initToDelete.nombre}"</strong>. Esta acción borrará también todos sus registros. <br /><span className="font-semibold text-red-500">No se puede deshacer.</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
