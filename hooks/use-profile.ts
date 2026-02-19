"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/lib/types/database.types"

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
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isUser: profile?.role === 'user' 
  }
}
