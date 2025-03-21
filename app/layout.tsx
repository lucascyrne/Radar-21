import { Inter } from "next/font/google"
import "@/app/globals.css"
import type { Metadata } from "next"
import { AuthProvider } from '@/resources/auth/auth-provider'
import { SurveyProvider } from "@/resources/survey/survey-provider"
import { TeamProvider } from "@/resources/team/team-provider"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { InviteProvider } from "@/resources/invite/invite-provider"

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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZT0F9FYDT2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZT0F9FYDT2');
          `}
        </Script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Radar21 - Avaliação de Competências para Indústria 4.0</title>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <TeamProvider>
            <SurveyProvider>
              <InviteProvider>
                {children}
                <Toaster />
              </InviteProvider>
            </SurveyProvider>
          </TeamProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import './globals.css'
