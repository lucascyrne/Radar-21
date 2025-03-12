# Radar21 - Avaliação de Competências de Liderança 4.0

## Sobre o Projeto

O Radar21 é uma aplicação web desenvolvida para avaliar e comparar competências de liderança no contexto da Indústria 4.0. A plataforma permite que equipes realizem autoavaliações e recebam feedback visual através de gráficos radar, comparando suas respostas individuais com a média da equipe.

### Pesquisadores

- **Edmilson Rodrigues do Nascimento Junior**  
  Email: ernj@cin.ufpe.br  
  [Lattes](http://lattes.cnpq.br/2041701030190884), [LinkedIn](https://www.linkedin.com/in/edmilsonrodrigues/)

- **Orientador: Alex Sandro Gomes, PhD.**

## Funcionalidades Principais

- **Autenticação**: Login/Signup com email/senha e integração com Google
- **Gestão de Equipes**: Criação e gerenciamento de equipes
- **Perfil de Usuário**: Cadastro de informações pessoais e profissionais
- **Questionário**: Avaliação de 12 competências de liderança em escala Likert
- **Questões Abertas**: Perguntas qualitativas sobre ambiente de trabalho e formação
- **Visualização de Resultados**: Gráficos radar comparativos e tabelas de análise
- **Compartilhamento**: Exportação e compartilhamento de resultados

## Estrutura da Aplicação

### Tecnologias Utilizadas

- **Frontend**: Next.js, React, TypeScript
- **Estilização**: TailwindCSS
- **Autenticação e Banco de Dados**: Supabase
- **Hospedagem**: Vercel
- **Visualização de Dados**: Biblioteca de gráficos radar personalizada

### Estrutura de Diretórios

```
radar21-front/
├── app/                    # Páginas e rotas da aplicação (Next.js App Router)
│   ├── api/                # Endpoints da API
│   ├── auth/               # Páginas de autenticação
│   ├── logout/             # Funcionalidade de logout
│   ├── open-questions/     # Página de questões abertas
│   ├── profile/            # Página de perfil do usuário
│   ├── results/            # Visualização de resultados
│   ├── survey/             # Questionário principal
│   ├── team-setup/         # Configuração de equipes
│   ├── globals.css         # Estilos globais
│   ├── layout.tsx          # Layout principal da aplicação
│   └── page.tsx            # Página inicial
│
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Componentes de interface
│   ├── team/               # Componentes relacionados a equipes
│   ├── radar-chart.tsx     # Componente de gráfico radar
│   ├── header.tsx          # Cabeçalho da aplicação
│   ├── email-template.tsx  # Template para emails
│   └── theme-provider.tsx  # Provedor de tema
│
├── resources/              # Recursos e utilitários
│   ├── auth/               # Funções de autenticação
│   ├── email/              # Funções relacionadas a emails
│   ├── supabase/           # Configuração e funções do Supabase
│   ├── survey/             # Lógica relacionada ao questionário
│   └── team/               # Lógica de gerenciamento de equipes
│
└── public/                 # Arquivos estáticos
```

## Integração com Supabase

O Radar21 utiliza o Supabase como backend-as-a-service para:

- **Autenticação**: Gerenciamento de usuários, login com email/senha e OAuth com Google
- **Banco de Dados**: Armazenamento de dados de usuários, equipes e respostas aos questionários
- **Armazenamento**: Armazenamento de arquivos e imagens
- **Funções Edge**: Processamento de dados e lógica de negócios

## Implantação

A aplicação está implantada na Vercel, oferecendo:

- **CI/CD**: Integração e implantação contínuas
- **Escalabilidade**: Adaptação automática à demanda
- **Monitoramento**: Análise de desempenho e erros
- **Domínio Personalizado**: Acesso através de URL amigável

## Fluxo do Usuário

1. **Cadastro e Login**: Criação de conta ou login com credenciais existentes
2. **Configuração de Equipe**: Criação de equipe ou entrada em equipe existente
3. **Perfil**: Preenchimento de informações pessoais e profissionais
4. **Questionário**: Resposta às 12 perguntas sobre competências de liderança
5. **Questões Abertas**: Resposta às perguntas qualitativas
6. **Resultados**: Visualização do gráfico radar e comparação com a equipe
7. **Compartilhamento**: Exportação ou compartilhamento dos resultados

## Para Desenvolvedores

### Requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

### Configuração Local

1. Clone o repositório
2. Instale as dependências: `npm install` ou `yarn`
3. Configure as variáveis de ambiente (veja `.env.example`)
4. Execute o servidor de desenvolvimento: `npm run dev` ou `yarn dev`

### Contribuição

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Faça commit das suas alterações: `git commit -m 'Adiciona nova funcionalidade'`
4. Envie para o repositório: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## Contato

Para mais informações, entre em contato com Edmilson Rodrigues: ernj@cin.ufpe.br
