"use client"

import { useState, useEffect } from "react"
import { Iniciativa, BitacoraRegistro, EtapaType, ETAPAS, InitiativeMember, Profile } from "@/lib/types/database.types"
import Link from "next/link"
import { ArrowLeft, BookOpen, Edit3, Check, X, Plus, Trash2, Paperclip, Calendar, User, Tag, Hash, ChevronDown, ListFilter, LayoutGrid, ChevronRight, Loader2, Users, Mail, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "@/hooks/use-profile"

const etapaColor: Record<string, string> = {
    "Identificación de oportunidad": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    "Diseño Integral": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    "Implementación de piloto": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    "Escalamiento y mejora continua": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
}

type EditRegistro = {
    fecha: string
    descripcion: string
    adjunto_url: string | null
}

type MemberWithProfile = InitiativeMember & { profiles: Profile }

export default function DetalleBitacoraClient({
    iniciativa: initialIniciativa,
    registros: initialRegistros,
}: {
    iniciativa: Iniciativa
    registros: BitacoraRegistro[]
}) {
    const { isAdmin } = useProfile()
    const supabase = createClient()

    const [iniciativa, setIniciativa] = useState(initialIniciativa)
    const [editingIniciativa, setEditingIniciativa] = useState(false)
    const [iForm, setIForm] = useState({ codigo: iniciativa.codigo, nombre: iniciativa.nombre, etapa: iniciativa.etapa ?? "Identificación de oportunidad" })
    const [iSaving, setISaving] = useState(false)

    const [registros, setRegistros] = useState<BitacoraRegistro[]>(initialRegistros)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<EditRegistro>({ fecha: "", descripcion: "", adjunto_url: null })
    const [newForm, setNewForm] = useState<EditRegistro>({ fecha: new Date().toISOString().split("T")[0], descripcion: "", adjunto_url: null })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Members State
    const [members, setMembers] = useState<MemberWithProfile[]>([])
    const [newMemberEmail, setNewMemberEmail] = useState("")
    const [inviting, setInviting] = useState(false)
    const [inviteError, setInviteError] = useState<string | null>(null)
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (iniciativa.id) {
            loadMembers()
        }
    }, [iniciativa.id])

    async function loadMembers() {
        const { data } = await supabase
            .from("initiative_members")
            .select("*, profiles(*)")
            .eq("iniciativa_id", iniciativa.id)

        if (data) {
            // Safe cast as Supabase types can be tricky with joins
            setMembers(data as unknown as MemberWithProfile[])
        }
    }

    const inviteMember = async () => {
        if (!newMemberEmail.trim()) return
        setInviting(true)
        setInviteError(null)
        setInviteSuccess(null)

        try {
            // 1. Find user by email
            const { data: userProfile, error: profileError } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", newMemberEmail.trim())
                .single()

            if (profileError || !userProfile) {
                throw new Error("Usuario no encontrado. Asegúrate de que esté registrado.")
            }

            // 2. Add to members
            const { error: memberError } = await supabase
                .from("initiative_members")
                .insert({
                    iniciativa_id: iniciativa.id,
                    user_id: userProfile.id
                })

            if (memberError) {
                if (memberError.code === '23505') throw new Error("El usuario ya es miembro.")
                throw memberError
            }

            setInviteSuccess("Usuario agregado correctamente.")
            setNewMemberEmail("")
            loadMembers()
        } catch (err: any) {
            setInviteError(err.message || "Error al invitar.")
        } finally {
            setInviting(false)
        }
    }

    const removeMember = async (memberId: string) => {
        if (!confirm("¿Quitar usuario del equipo?")) return
        await supabase.from("initiative_members").delete().eq("id", memberId)
        setMembers(prev => prev.filter(m => m.id !== memberId))
    }

    const saveIniciativa = async () => {
        if (!isAdmin) return
        setISaving(true)
        const { data, error } = await supabase
            .from("iniciativas")
            .update({ codigo: iForm.codigo, nombre: iForm.nombre, etapa: iForm.etapa })
            .eq("id", iniciativa.id)
            .select()
            .single()
        if (!error && data) setIniciativa(data)
        setISaving(false)
        setEditingIniciativa(false)
    }

    const handleUpload = async (file: File, target: "new" | "edit") => {
        setUploading(true)
        const ext = file.name.split(".").pop()
        const path = `${iniciativa.id}/${Date.now()}.${ext}`
        const { data, error } = await supabase.storage.from("adjuntos-bitacora").upload(path, file)
        if (!error && data) {
            const { data: urlData } = supabase.storage.from("adjuntos-bitacora").getPublicUrl(data.path)
            if (target === "new") setNewForm(f => ({ ...f, adjunto_url: urlData.publicUrl }))
            else setEditForm(f => ({ ...f, adjunto_url: urlData.publicUrl }))
        }
        setUploading(false)
    }

    const addRegistro = async () => {
        if (!newForm.descripcion.trim()) { setError("La descripcion es requerida"); return }
        setSaving(true); setError(null)
        const { data, error } = await supabase
            .from("bitacora_registros")
            .insert({ iniciativa_id: iniciativa.id, fecha: newForm.fecha || new Date().toISOString(), descripcion: newForm.descripcion, adjunto_url: newForm.adjunto_url })
            .select().single()
        if (!error && data) {
            setRegistros(prev => [data, ...prev])
            setNewForm({ fecha: new Date().toISOString().split("T")[0], descripcion: "", adjunto_url: null })

        } else setError(error?.message ?? "Error al guardar")
        setSaving(false)
    }

    const startEdit = (r: BitacoraRegistro) => {
        setEditingId(r.id)
        setEditForm({ fecha: r.fecha ? new Date(r.fecha).toISOString().split("T")[0] : new Date().toISOString().split("T")[0], descripcion: r.descripcion, adjunto_url: r.adjunto_url ?? null })
    }

    const saveEdit = async () => {
        if (!editingId || !isAdmin) return
        setSaving(true)
        const { data, error } = await supabase
            .from("bitacora_registros")
            .update({ fecha: editForm.fecha, descripcion: editForm.descripcion, adjunto_url: editForm.adjunto_url })
            .eq("id", editingId)
            .select().single()
        if (!error && data) setRegistros(prev => prev.map(r => r.id === editingId ? data : r))
        setSaving(false); setEditingId(null)
    }

    const deleteRegistro = async (id: string) => {
        if (!isAdmin) return
        if (!confirm("Eliminar este registro?")) return
        await supabase.from("bitacora_registros").delete().eq("id", id)
        setRegistros(prev => prev.filter(r => r.id !== id))
    }

    const fmt = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) : "-"

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Link href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition">Iniciativas</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="font-semibold text-slate-900 dark:text-white">{iniciativa.codigo}</span>
            </div>

            {/* Main Info Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {iniciativa.nombre}
                    </h1>
                    {isAdmin && (
                        !editingIniciativa ? (
                            <button onClick={() => { setIForm({ codigo: iniciativa.codigo, nombre: iniciativa.nombre, etapa: iniciativa.etapa ?? "Identificación de oportunidad" }); setEditingIniciativa(true) }}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition shadow-sm">
                                <Edit3 className="w-3.5 h-3.5" /> Editar Detalles
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={saveIniciativa} disabled={iSaving}
                                    className="flex items-center gap-1.5 text-xs text-white bg-green-600 hover:bg-green-500 rounded-lg px-3 py-1.5 transition shadow-sm">
                                    <Check className="w-3.5 h-3.5" /> Guardar
                                </button>
                                <button onClick={() => setEditingIniciativa(false)}
                                    className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg px-3 py-1.5 transition shadow-sm">
                                    <X className="w-3.5 h-3.5" /> Cancelar
                                </button>
                            </div>
                        )
                    )}
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Fields */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Código</label>
                        {!editingIniciativa ? (
                            <div className="font-mono text-primary-700 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-800/50 inline-block">
                                {iniciativa.codigo}
                            </div>
                        ) : (
                            <input value={iForm.codigo} onChange={e => setIForm(f => ({ ...f, codigo: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500" />
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Etapa Actual</label>
                        {!editingIniciativa ? (
                            <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${etapaColor[iniciativa.etapa ?? ""] ?? "bg-slate-100 border-slate-200 text-slate-600"}`}>
                                {iniciativa.etapa}
                            </span>
                        ) : (
                            <select value={iForm.etapa} onChange={e => setIForm(f => ({ ...f, etapa: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500">
                                {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Fecha Inicio</label>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {fmt(iniciativa.created_at)}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Project Owner</label>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                <User className="w-3 h-3" />
                            </div>
                            User ID: {iniciativa.owner_id?.slice(0, 4)}...
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Timeline Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ListFilter className="w-5 h-5 text-primary-600" /> Bitácora de Avances
                        </h2>
                        <div className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                            {registros.length} registros
                        </div>
                    </div>

                    {registros.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LayoutGrid className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="font-medium">No hay registros en la bitácora</p>
                            <p className="text-sm mt-1">Utiliza el formulario para agregar el primer avance.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-4">
                            {registros.map((r) => (
                                <div key={r.id} className="relative pl-8 group">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-950 bg-primary-600 ring-2 ring-transparent group-hover:ring-primary-100 dark:group-hover:ring-primary-900/50 transition-all"></div>

                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                        {editingId === r.id ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="date" value={editForm.fecha} onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))}
                                                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                    <input value={editForm.adjunto_url ?? ""} onChange={e => setEditForm(f => ({ ...f, adjunto_url: e.target.value || null }))}
                                                        placeholder="URL de adjunto"
                                                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                </div>
                                                <textarea value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                                                    rows={3}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                                                <div className="flex gap-2">
                                                    <button onClick={saveEdit} disabled={saving} className="px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition">Guardar</button>
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200 transition">Cancelar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" /> {fmt(r.fecha)}
                                                    </span>
                                                    {isAdmin && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEdit(r)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg transition"><Edit3 className="w-4 h-4" /></button>
                                                            <button onClick={() => deleteRegistro(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{r.descripcion}</p>
                                                {r.adjunto_url && (
                                                    <a href={r.adjunto_url} target="_blank" className="inline-flex items-center gap-2 mt-4 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-primary-600 hover:underline">
                                                        <Paperclip className="w-3.5 h-3.5" /> Ver archivo adjunto
                                                    </a>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">

                    {/* 1. Add Registro Form */}
                    <div className="sticky top-24">
                        <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 shadow-xl border border-slate-800 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <h3 className="text-lg font-bold mb-4 relative z-10 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary-400" /> Nuevo Registro
                            </h3>

                            <div className="space-y-4 relative z-10">
                                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs">{error}</div>}

                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Fecha</label>
                                    <input type="date" value={newForm.fecha} onChange={e => setNewForm(f => ({ ...f, fecha: e.target.value }))}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Detalle</label>
                                    <textarea
                                        value={newForm.descripcion}
                                        onChange={e => setNewForm(f => ({ ...f, descripcion: e.target.value }))}
                                        rows={5}
                                        placeholder="Describe el avance del proyecto..."
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all placeholder-slate-600" />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Adjunto (Documento/Imagen)</label>
                                    <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "new") }}
                                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-primary-400 hover:file:bg-slate-700 transition-all cursor-pointer" />
                                    {uploading && <p className="text-primary-400 text-xs mt-2 animate-pulse">Subiendo archivo...</p>}
                                    {newForm.adjunto_url && <p className="text-emerald-400 text-xs mt-2 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Archivo listo</p>}
                                </div>

                                <button onClick={addRegistro} disabled={saving || uploading}
                                    className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-900/50 flex items-center justify-center gap-2 mt-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Avance"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. Team Management (Admin Only) */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" /> Equipo de Trabajo
                            </h3>

                            <div className="space-y-4">
                                {/* Invite Form */}
                                <div className="flex gap-2">
                                    <input
                                        value={newMemberEmail}
                                        onChange={e => setNewMemberEmail(e.target.value)}
                                        placeholder="usuario@email.com"
                                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={inviteMember}
                                        disabled={inviting || !newMemberEmail.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    </button>
                                </div>

                                {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
                                {inviteSuccess && <p className="text-xs text-emerald-500">{inviteSuccess}</p>}

                                {/* Members List */}
                                <div className="space-y-2 mt-4">
                                    {members.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-2">No hay colaboradores aún.</p>
                                    ) : (
                                        members.map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                                                        {m.profiles.email?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={m.profiles.email || ""}>
                                                        {m.profiles.email}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removeMember(m.id)}
                                                    className="text-slate-400 hover:text-red-500 transition p-1"
                                                    title="Remover usuario"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
