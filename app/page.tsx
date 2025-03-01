import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Layout } from "@/components/layout"

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          A era da Indústria 4.0 requer
          <br />
          novas competências
        </h1>
        <h3 className="mt-6 text-xl md:text-2xl text-muted-foreground">Você e sua equipe estão preparados?</h3>
        <div className="mt-10">
          <Link href="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Descubra Agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Entenda o Contexto</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Indústria 4.0</h3>
                <p className="text-muted-foreground">
                  A Quarta Revolução Industrial descreve o rápido avanço tecnológico no século XXI.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Competências de Liderança</h3>
                <p className="text-muted-foreground">
                  São as habilidades essenciais para se adaptar às mudanças da era digital.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Modelo de Referência</h3>
                <p className="text-muted-foreground">
                  Desenvolvido por Calado e Souza (2024), mede a adequação às demandas da Indústria 4.0.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              "Cadastre-se e convide sua equipe",
              "Responda as 14 perguntas do Radar da Liderança 4.0",
              "Receba o gráfico das competências de sua equipe",
              "Entenda seus pontos fortes e áreas de melhoria",
              "Compare-se com a indústria",
            ].map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-lg">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-secondary rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Sobre os Pesquisadores</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Edmilson Rodrigues do Nascimento Junior</h3>
                <p className="text-muted-foreground mb-2">Email: ernj@cin.ufpe.br</p>
                <div className="flex gap-2">
                  <Link
                    href="http://lattes.cnpq.br/2041701030190884"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Lattes
                  </Link>
                  <Link
                    href="https://www.linkedin.com/in/edmilsonrodrigues/"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    LinkedIn
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Orientador: Alex Sandro Gomes, Phd.</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  )
}

