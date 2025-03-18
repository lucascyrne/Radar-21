import type { ReactNode } from "react"
import { Header } from "./header"
import Footer from "./footer"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <Header />
      <main className="flex-1 py-12">{children}</main>
      <Footer />
    </div>
  )
}

