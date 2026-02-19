"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/lib/types/database.types"

/**
 * Hook personalizado para obtener y gestionar el perfil del usuario actual.
 * Retorna el perfil, estado de carga y helpers para verificar roles.
 */
export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function getProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single()

                    if (!error && data) {
                        setProfile(data)
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
            } finally {
                setLoading(false)
            }
        }
        getProfile()
    }, [])

    return {
        /** Datos del perfil del usuario (id, email, role, etc) */
        profile,
        /** Indica si se están cargando los datos */
        loading,
        /** Helper: true si el usuario es administrador */
        isAdmin: profile?.role === 'admin',
        /** Helper: true si el usuario es usuario estándar */
        isUser: profile?.role === 'user'
    }
}
