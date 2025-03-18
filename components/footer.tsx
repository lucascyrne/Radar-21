import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { Section } from "./craft";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Coluna 1 - Sobre */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Radar21</h3>
            <p className="text-sm text-muted-foreground">
              <Balancer>
                Plataforma de avaliação de competências de liderança para a Indústria 4.0,
                desenvolvida como parte de pesquisa acadêmica no CIn-UFPE.
              </Balancer>
            </p>
          </div>

          {/* Coluna 2 - Links Rápidos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Links Rápidos</h3>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <Link href="/team-setup" className="hover:text-primary transition-colors">
                Começar Avaliação
              </Link>
              <Link href="/about" className="hover:text-primary transition-colors">
                Sobre a Pesquisa
              </Link>
              <a 
                href="http://www.cin.ufpe.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                CIn-UFPE
              </a>
            </nav>
          </div>

          {/* Coluna 3 - Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Legal</h3>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">
                Política de Cookies
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Radar21. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
