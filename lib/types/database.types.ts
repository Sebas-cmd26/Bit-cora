export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            bitacora_registros: {
                Row: {
                    adjunto_url: string | null
                    descripcion: string
                    fecha: string | null
                    id: string
                    iniciativa_id: string
                }
                Insert: {
                    adjunto_url?: string | null
                    descripcion: string
                    fecha?: string | null
                    id?: string
                    iniciativa_id: string
                }
                Update: {
                    adjunto_url?: string | null
                    descripcion?: string
                    fecha?: string | null
                    id?: string
                    iniciativa_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bitacora_registros_iniciativa_id_fkey"
                        columns: ["iniciativa_id"]
                        isOneToOne: false
                        referencedRelation: "iniciativas"
                        referencedColumns: ["id"]
                    },
                ]
            }
            iniciativas: {
                Row: {
                    codigo: string
                    created_at: string | null
                    etapa: string | null
                    id: string
                    nombre: string
                    owner_id: string
                }
                Insert: {
                    codigo: string
                    created_at?: string | null
                    etapa?: string | null
                    id?: string
                    nombre: string
                    owner_id: string
                }
                Update: {
                    codigo?: string
                    created_at?: string | null
                    etapa?: string | null
                    id?: string
                    nombre?: string
                    owner_id?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    role: "admin" | "user"
                    created_at: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    role?: "admin" | "user"
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    role?: "admin" | "user"
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            initiative_members: {
                Row: {
                    id: string
                    iniciativa_id: string
                    user_id: string
                    added_at: string | null
                }
                Insert: {
                    id?: string
                    iniciativa_id: string
                    user_id: string
                    added_at?: string | null
                }
                Update: {
                    id?: string
                    iniciativa_id?: string
                    user_id?: string
                    added_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "initiative_members_iniciativa_id_fkey"
                        columns: ["iniciativa_id"]
                        referencedRelation: "iniciativas"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "initiative_members_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: { [_ in never]: never }
        Functions: { [_ in never]: never }
        Enums: { [_ in never]: never }
        CompositeTypes: { [_ in never]: never }
    }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"]
export type Inserts<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"]
export type Updates<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"]

export type Iniciativa = Tables<"iniciativas">
export type BitacoraRegistro = Tables<"bitacora_registros">
export type Profile = Tables<"profiles">
export type InitiativeMember = Tables<"initiative_members">

export type EtapaType = "Identificación de oportunidad" | "Diseño Integral" | "Implementación de piloto" | "Escalamiento y mejora continua"
export const ETAPAS: EtapaType[] = ["Identificación de oportunidad", "Diseño Integral", "Implementación de piloto", "Escalamiento y mejora continua"]
