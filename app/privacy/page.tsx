import { Layout } from "@/components/layout"

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>1. Coleta e Uso de Dados</h2>
          <p>
            O Radar21 coleta apenas as informações necessárias para a realização da pesquisa
            sobre competências de liderança. Todas as respostas são anônimas e os dados são apresentados
            apenas de forma agregada.
          </p>

          <h2>2. Anonimização de Dados</h2>
          <p>
            Garantimos que todas as respostas individuais permaneçam anônimas. Nem a liderança nem a
            organização têm acesso às respostas individuais dos participantes.
          </p>

          <h2>3. Armazenamento e Segurança</h2>
          <p>
            Os dados coletados são armazenados de forma segura e utilizados exclusivamente para fins
            de pesquisa acadêmica. Implementamos medidas técnicas e organizacionais apropriadas para
            proteger seus dados.
          </p>

          <h2>4. Uso Acadêmico</h2>
          <p>
            Os dados coletados serão utilizados em pesquisa acadêmica conduzida no Centro de Informática
            da UFPE, sempre mantendo o anonimato dos participantes e organizações.
          </p>

          <h2>5. Seus Direitos</h2>
          <p>
            Você tem o direito de solicitar acesso, correção ou exclusão dos seus dados pessoais.
            Para exercer esses direitos, entre em contato conosco através do email fornecido.
          </p>
        </div>
      </div>
    </Layout>
  )
} 