"use client";

import { ReactNode } from "react";
import { OrgHeader } from "./org-header";

export function OrgLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <OrgHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            © 2024 Radar21. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/cookies"
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              Cookies
            </a>
            <a
              href="/privacy"
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              Privacidade
            </a>
            <a
              href="/terms"
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              Termos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
