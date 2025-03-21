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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 12h-4l-3 9L9 3l-3 9H2'/></svg>"
          type="image/svg+xml"
        />
      </head>
      <body className={inter.className}>
        <div suppressHydrationWarning>
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
        </div>
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
      </body>
    </html>
  )
}

import './globals.css'
