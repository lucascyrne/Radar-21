import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, BarChart2, Users, Brain, Shield, Lock } from "lucide-react"
import { Layout } from "@/components/layout"
import { AuroraText } from "@/components/magicui/aurora-text"

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - Redesenhada com gradiente e animação sutil */}
      <section className="relative overflow-hidden py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/20 -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl flex flex-col items-center gap-1">
            <AuroraText
              colors={["#1E40AF", "#3B82F6", "#1E3A8A"]}
              speed={0.4}
              className="leading-tight font-extrabold text-center"
            >
              A era da IA e da
            </AuroraText>
            <AuroraText
              colors={["#3B82F6", "#1E3A8A", "#1E40AF"]}
              speed={0.4}
              className="leading-tight font-extrabold text-center"
            >
              Indústria 4.0
            </AuroraText>
            <AuroraText
              colors={["#1E3A8A", "#1E40AF", "#3B82F6"]}
              speed={0.4}
              className="leading-tight font-extrabold text-center text-4xl sm:text-5xl md:text-6xl"
            >
              requer novas competências
            </AuroraText>
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Descubra se você e sua equipe têm as competências e atitudes certas, e onde podem melhorar.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 py-6 hover:scale-105 transition-transform">
                Comece Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Cards mais visuais */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Por que usar o Radar da Liderança?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="mb-6 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Visual mais limpo */}
      <section className="py-24 bg-secondary/30 rounded-3xl">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Como Funciona</h2>
          <div className="max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} 
                   className="flex items-center gap-6 mb-8 p-6 bg-background/50 rounded-xl hover:bg-background/80 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">{index + 1}</span>
                </div>
                <p className="text-lg">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section - Nova seção */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Compromisso com a Privacidade</h2>
          <div className="max-w-3xl mx-auto bg-primary/5 rounded-2xl p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-6">
                  <div className="mb-4 text-primary">
                    <Shield className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Respostas Anônimas</h3>
                  <p className="text-muted-foreground">
                    Todas as respostas são completamente anônimas. Nem a liderança nem a organização podem identificar respostas individuais.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-6">
                  <div className="mb-4 text-primary">
                    <Lock className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Dados Agregados</h3>
                  <p className="text-muted-foreground">
                    Os resultados são apresentados apenas de forma agregada, garantindo a confidencialidade das avaliações individuais.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Saiba mais sobre nossa {" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  política de privacidade
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Researchers Section - Mais profissional */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Pesquisadores</h2>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {researchers.map((researcher, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-3">{researcher.name}</h3>
                  <p className="text-muted-foreground mb-4">{researcher.role}</p>
                  {researcher.email && (
                    <p className="text-muted-foreground mb-4">{researcher.email}</p>
                  )}
                  {researcher.links && (
                    <div className="flex gap-4">
                      {researcher.links.map((link, i) => (
                        <Link
                          key={i}
                          href={link.url}
                          target="_blank"
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}

const features = [
  {
    icon: <BarChart2 className="w-10 h-10" />,
    title: "Avaliação Precisa",
    description: "Metodologia baseada em pesquisa científica para medir competências essenciais da Indústria 4.0"
  },
  {
    icon: <Users className="w-10 h-10" />,
    title: "Análise em Equipe",
    description: "Compare resultados entre membros e identifique pontos fortes e oportunidades de desenvolvimento"
  },
  {
    icon: <Brain className="w-10 h-10" />,
    title: "Insights Acionáveis",
    description: "Receba recomendações personalizadas para desenvolver as competências necessárias"
  }
]

const steps = [
  "Cadastre-se gratuitamente e convide sua equipe para participar",
  "Responda o questionário do Radar 21",
  "Visualize os resultados em um gráfico radar interativo",
  "Compare as competências de sua equipe",
  "Receba recomendações personalizadas de desenvolvimento"
]

const researchers = [
  {
    name: "Edmilson Rodrigues do Nascimento Junior",
    role: "Pesquisador Principal",
    email: "ernj@cin.ufpe.br",
    links: [
      { label: "Lattes", url: "http://lattes.cnpq.br/2041701030190884" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/edmilsonrodrigues/" }
    ]
  },
  {
    name: "Alex Sandro Gomes, Phd.",
    role: "Orientador"
  }
]

