"use server"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Server Action para cerrar sesión.
 * Elimina la cookie de sesión y redirige al login.
 */
export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
}
