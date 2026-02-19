export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, LogOut, User } from "lucide-react"
import { signOut } from "@/lib/actions"
import { ModeToggle } from "@/components/mode-toggle"

/**
 * Layout del Dashboard.
 * Contiene la barra de navegación superior, información del usuario y botón de logout.
 * Protege las rutas hijas verificando la sesión del usuario.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:bg-primary-700 transition">
                            <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-lg leading-none">Bitacora</span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Enterprise Edition</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.email?.split("@")[0]}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Usuario</p>
                            </div>
                            <form action={signOut}>
                                <button
                                    type="submit"
                                    className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                    title="Cerrar Sesion"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col">
                {children}
            </main>
        </div>
    )
}
