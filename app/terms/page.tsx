import { Layout } from "@/components/layout"

export default function TermsOfService() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao utilizar o Radar21, você concorda com estes termos de uso e com nossa
            política de privacidade.
          </p>

          <h2>2. Uso da Plataforma</h2>
          <p>
            A plataforma destina-se exclusivamente à avaliação de competências de liderança para
            fins de pesquisa acadêmica e desenvolvimento organizacional.
          </p>

          <h2>3. Responsabilidades</h2>
          <p>
            Os usuários são responsáveis pela veracidade das informações fornecidas e pelo uso
            adequado da plataforma.
          </p>

          <h2>4. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo e metodologia do Radar21 são protegidos por direitos
            autorais e pertencem aos pesquisadores e ao CIn-UFPE.
          </p>

          <h2>5. Limitação de Responsabilidade</h2>
          <p>
            A plataforma é fornecida "como está", sem garantias de qualquer tipo. Não nos
            responsabilizamos por decisões tomadas com base nos resultados obtidos.
          </p>
        </div>
      </div>
    </Layout>
  )
} 