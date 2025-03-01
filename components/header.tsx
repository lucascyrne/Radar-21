import Link from "next/link"
import { Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Radar 4.0</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/auth">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth?tab=signup">
              <Button>Signup</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

