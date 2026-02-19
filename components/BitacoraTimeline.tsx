"use client"

import { BitacoraRegistro } from "@/lib/types/database.types"
import { Clock, Paperclip, FileText } from "lucide-react"

export default function BitacoraTimeline({ registros }: { registros: BitacoraRegistro[] }) {
  if (registros.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-slate-500">
        <Clock className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-medium">Sin registros aun</p>
        <p className="text-sm mt-1">Agrega el primer entry de bitacora abajo</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />

      <div className="space-y-0">
        {registros.map((reg, idx) => (
          <div key={reg.id} className="relative flex gap-5 pb-8 last:pb-0">
            {/* Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  #{String(registros.length - idx).padStart(3, "0")}
                </span>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {reg.fecha
                    ? new Date(reg.fecha).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{reg.descripcion}</p>
              {reg.adjunto_url && (
                <a
                  href={reg.adjunto_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition"
                >
                  <Paperclip className="w-3 h-3" />
                  Ver adjunto
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}