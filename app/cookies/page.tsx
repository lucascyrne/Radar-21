import { Layout } from "@/components/layout"

export default function CookiePolicy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Cookies</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>1. O que são Cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você
            visita nossa plataforma.
          </p>

          <h2>2. Como Utilizamos os Cookies</h2>
          <p>
            Utilizamos cookies essenciais para o funcionamento da plataforma, incluindo:
          </p>
          <ul>
            <li>Autenticação e manutenção da sessão</li>
            <li>Armazenamento de preferências básicas</li>
            <li>Garantia da segurança da plataforma</li>
          </ul>

          <h2>3. Cookies Necessários</h2>
          <p>
            Alguns cookies são estritamente necessários para o funcionamento da plataforma e não
            podem ser desativados.
          </p>

          <h2>4. Sua Escolha</h2>
          <p>
            Você pode configurar seu navegador para bloquear cookies, mas isso pode afetar o
            funcionamento da plataforma.
          </p>
        </div>
      </div>
    </Layout>
  )
} 