export const dynamic = 'force-dynamic'

import { ModeToggle } from "@/components/mode-toggle"

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary-600/10 dark:bg-primary-900/10 -skew-y-6 transform origin-top-left z-0"></div>
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}