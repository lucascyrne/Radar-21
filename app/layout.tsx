import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { AuthProvider } from '@/resources/auth/auth-provider'
import { SurveyProvider } from "@/resources/survey/survey-provider"
import { TeamProvider } from "@/resources/team/team-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Radar21 - Avaliação de Competências de Liderança 4.0",
  description: "Plataforma para avaliação de competências de liderança 4.0 em equipes",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <InviteProvider>
            <TeamProvider>
              <SurveyProvider>
                {children}
              <Toaster />
            </SurveyProvider>
            </TeamProvider>
          </InviteProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import './globals.css'
import { InviteProvider } from "@/resources/invite/invite-provider"
