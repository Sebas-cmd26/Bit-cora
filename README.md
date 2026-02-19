# Bitácora de Iniciativas - Enterprise Edition

Sistema de gestión y seguimiento de iniciativas empresariales, diseñado con un enfoque en la experiencia de usuario (UX), diseño premium y colaboración en tiempo real.

![Dashboard Preview](/public/dashboard-preview.png)

## 🚀 Características Principales

*   **Gestión de Iniciativas:** Creación, edición y seguimiento de iniciativas a través de diferentes etapas (Identificación, Diseño, Piloto, Escalamiento).
*   **Bitácora de Avance:** Registro detallado de actividades con fechas y descripciones.
*   **Adjuntos:** Carga de archivos y evidencias (imágenes, documentos) para cada registro de la bitácora.
*   **Colaboración en Equipo:**
    *   Roles de usuario: Admin (creador) y Miembros.
    *   Gestión de permisos basada en RLS (Row Level Security).
    *   Invitación de usuarios por correo electrónico.
*   **Diseño Premium (UI/UX):**
    *   Modo Oscuro (Dark Mode) totalmente integrado.
    *   Animaciones fluidas y transiciones "Apple-like".
    *   Interfaz limpia usando Glassmorphism y componentes estilizados.
*   **Seguridad:** Autenticación robusta y protección de rutas.

## 🛠️ Tecnologías

Este proyecto está construido con un stack moderno y escalable:

*   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router, React Server Components).
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/).
*   **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime).
*   **Lenguaje:** TypeScript.

## 📦 Instalación y Configuración

Sigue estos pasos para levantar el proyecto localmente:

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/bitacora-app.git
cd bitacora-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto y agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Configurar Base de Datos (Supabase)
El proyecto requiere las siguientes tablas y configuraciones en Supabase:

*   **Tablas:** `iniciativas`, `bitacora_registros`, `initiative_members`, `profiles`.
*   **Storage:** Bucket público llamado `adjuntos-bitacora`.
*   **Triggers:** Trigger par crear perfil de usuario automáticamente al registrarse (`handle_new_user`).

*(Puedes encontrar los scripts SQL de migración en la carpeta `brain/migrations` si están disponibles, o consultar la documentación interna).*

### 5. Ejecutar servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📂 Estructura del Proyecto

*   `/app`: Rutas y páginas de Next.js (App Router).
*   `/components`: Componentes reutilizables de React (Modales, Tablas, UI Kit).
*   `/lib`: Utilidades, tipos de TypeScript y cliente de Supabase.
*   `/hooks`: Hooks personalizados (ej. `useProfile`).
*   `/public`: Archivos estáticos.

## 🤝 Contribución

1.  Haz un Fork del proyecto.
2.  Crea una rama para tu feature (`git checkout -b feature/nueva-feature`).
3.  Haz Commit de tus cambios (`git commit -m 'feat: agrega nueva feature'`).
4.  Haz Push a la rama (`git push origin feature/nueva-feature`).
5.  Abre un Pull Request.

## 📄 Licencia

Este proyecto es propiedad privada y para uso interno.
