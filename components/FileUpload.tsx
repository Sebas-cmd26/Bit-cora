"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react"

interface FileUploadProps {
    onUploaded: (url: string) => void
}

/**
 * Componente para subir archivos a Supabase Storage.
 * Muestra una zona de 'drag and drop' y una barra de progreso simulada.
 */
export default function FileUpload({ onUploaded }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploaded, setUploaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    /**
     * Prepara el archivo seleccionado para la subida.
     */
    const handleFile = (selected: File) => {
        setFile(selected)
        setUploaded(false)
        setProgress(0)
        setError(null)
    }

    /**
     * Sube el archivo al bucket de Supabase ('adjuntos-bitacora').
     * Simula una barra de progreso mientras se realiza la subida.
     */
    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError("No autenticado"); setUploading(false); return }

        const ext = file.name.split(".").pop()
        // Ruta única: user_id/timestamp.ext
        const path = `${user.id}/${Date.now()}.${ext}`

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 15, 85))
        }, 200)

        const { error: uploadError } = await supabase.storage
            .from("adjuntos-bitacora")
            .upload(path, file, { upsert: true })

        clearInterval(progressInterval)

        if (uploadError) {
            setError(uploadError.message)
            setUploading(false)
            setProgress(0)
            return
        }

        setProgress(100)
        const { data } = supabase.storage.from("adjuntos-bitacora").getPublicUrl(path)
        setUploaded(true)
        setUploading(false)
        onUploaded(data.publicUrl)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const dropped = e.dataTransfer.files[0]
        if (dropped) handleFile(dropped)
    }

    return (
        <div className="space-y-3">
            {!file ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition group"
                >
                    <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition" />
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition text-center">
                        Arrastra un archivo o <span className="text-indigo-400 underline">haz clic</span>
                    </p>
                    <p className="text-xs text-slate-600">PDF, imagen, Word, etc.</p>
                    <input ref={inputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <span className="text-sm text-white truncate">{file.name}</span>
                            <span className="text-xs text-slate-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        {!uploading && !uploaded && (
                            <button onClick={() => setFile(null)} className="text-slate-500 hover:text-red-400 transition">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        {uploaded && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>

                    {(uploading || uploaded) && (
                        <div className="space-y-1">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${uploaded ? "bg-emerald-500" : "bg-indigo-500"}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500">{uploaded ? "Subido correctamente" : `Subiendo... ${progress}%`}</p>
                        </div>
                    )}

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    {!uploading && !uploaded && (
                        <button
                            onClick={handleUpload}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 rounded-lg transition"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Subir archivo
                        </button>
                    )}
                    {uploading && (
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Subiendo...
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
