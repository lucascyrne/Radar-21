"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Footer from "./footer";
import { Header } from "./header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {isMounted ? (
        <>
          <Header />
          <main className="flex-1 flex items-center justify-center">
            {children}
          </main>
          <Footer />
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
