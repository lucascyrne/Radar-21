I want to create a simple system to apply a survey and give feedback to the respondents comparing his answers and his team's answers as a radar graph. There should be a  Login/Signup functionality with password and with Google login. Below there is the content and the pages for the system in Markdown. Each new H1 title is a new page. Each H2 title is a new section of the page, or the section is marked between HTML tags.

This is the sitemap and flow: 

- Home
- Team Setup
- Profile
- Survey (Questions 1 to 12 in the Markdown table)
- Open Questions (Questions 13 and 14 in the Markdown table)
- Radar (In the end, I want the user to be able to download his radar graph.)

The Design and UI of the project should be clean and minimalistic.

# Home

## Hero Section

<h1>A era da Indústria 4.0 requer novas competências </h1>
<h3>Você e sua equipe estão preparados? </h3>

<button> Descubra </button>

### New Section: Features

    Feature 1: 
    <H3> Indústria 4.0 <H3>
    <p> Quarta Revolução Industrial ou Indústria 4.0 é um neologismo que descreve o rápido avanço tecnológico no século XXI.</p>
    
    Feature 2: 
    <H3> As Competências de Liderança </H3>
    <p>São as habilidades (Skills) que os indivíduos têm que ter para se adaptar às mudanças </p>
    
    Feature 3: 
    <H3> O Modelo de Referência </H3>
    <p> Desenvolvido por Calado e Souza (2024), é uma forma de mensurar o nível de adequação dos indivíduos e equipes às demandas da indústria 4.0 </p>

### New Section: Steps

1. Cadastre-se e convide sua equipe. 
2. Preencha seu perfil e responda as 14 perguntas do Radar da Liderança 4.0 .
3. Você ganha o gráfico das competências de Liderança 4.0 de sua equipe. 
4. Pode entender onde vai bem, pontos de melhoria e como se compara com a indústria.
5. Compartilhe seu resultado pelo WhatsApp ou LinkedIn

### Sobre os pesquisadores

<card>Edmilson Rodrigues do Nascimento Junior
<p></p>
Email: ernj@cin.ufpe.br 
[Lattes]([url](http://lattes.cnpq.br/2041701030190884)), [LinkedIn]([url](https://www.linkedin.com/in/edmilsonrodrigues/)
). </card>

<card> Orientador: Alex Sandro Gomes, Phd. </card>

# Minha Equipe

<Progress bar UI>
**  Minha Equipe**
    Meu Perfil
    Radar das Competências de Liderança 4.0
    Resultados
<Progress bar UI>

<main>
<Toggle> Criar Equipe | Entrar em Equipe </Toggle>
    
<h3> Dados Sobre a equipe: </h3> 

<Criar Equipe>
Nome da equipe:
Meu email: 
Meu papel é de: [Líder da equipe, colaborador na equipe]
Número de pessoas na equipe: 

    <button> Criar Equipe </button>
</Criar Equipe>
<h3>Convidar Equipe: </h3>


<Entrar em Equipe>
Nome da equipe: 
Email da pessoa que criou a equipe:
Meu email: 
    <button> Entrar Equipe </button>
</Entrar em Equipe>

<form>
<p> Customize e envie a mensagem abaixo para sua equipe nos seus canais.</p>
Mensagem: (Mensagem padrão: Oi. Tudo bem? Favor preencher essa ferramenta para que possamos saber como nossa equipe está em relação às competências de liderança 4.0. Lembre de selecionar "Entrar em Equipe" na página de equipe e inserir o meu email {INSERIR EMAIL do usuário} e o nome da equipe {Nome da equipe} )
<button> Copiar Mensagem </button>
</form>

| Equipe {Nome da equipe}                                      |
|Email | Status do convite (enviado, cadastrado ou respondido) |
| {email1@gmail.com}       |    Enviado                         | 

<button> Próxima Página </button>
</main>

# Meu Perfil

<Progress bar UI>
    Minha Equipe
    **Meu Perfil**
    Radar das Competências de Liderança 4.0
    Resultados
<Progress bar UI>

<main>

<h3> Dados sobre Meu Perfil <h3>
<form>
    Nome Completo: 
    Data de Nascimento: 
    Escolaridade: [2o Grau, Superior Incompleto, Superior Completo, Pós-Graduação Lato Senso, Mestrado, Doutorado]
    Mês/Ano de conclusão da graduação (se aplicável)

    Minha organização: (Nome)
    Site: (Insira o site) 
    Tipo: [Pública, Privada, 3o Setor]
    Porte: [Micro, Pequena, Média, Grande]
    Número de colaboradores:
    Cidade em que você trabalha: 
    Modelo de Trabalho: [Em pessoa, remoto, híbrido]

</form>
</main>

# Questionário de Competências da Liderança 4.0

<Progress bar UI>
    Minha Equipe
    Meu Perfil
    **Questionário das Competências de Liderança 4.0**
    Resultados
<Progress bar UI>
<main>
<form>

    | COMPETÊNCIA AVALIADA | PERGUNTA | TIPO DE PERGUNTA |
    | Abertura | (Q1) O ambiente de trabalho facilita o feedback positivo ou negativo de mão dupla entre o líder e os membros da equipe? | Escala Likert |
    | Agilidade | (Q2) No ambiente de trabalho, você age e reage rapidamente, assume riscos, considera diferentes cenários, experimenta ideias e aprende com as falhas? | Escala Likert |
    | Confiança | (Q3) No ambiente de trabalho, você acredita que a relação profissional entre o líder e a equipe é baseada na confiança mútua? | Escala Likert |
    | Empatia | (Q4) Nas relações profissionais, você compreende, tem empatia e considera a perspectiva e os sentimentos dos outros, e percebe que o mesmo é recíproco? | Escala Likert |
    | Articulação | (Q5) No ambiente de trabalho, as conexões entre as competências dos membros da equipe e as externas ao squad/projeto são potencializadas, maximizadas e bem utilizadas? | Escala Likert |
    | Adaptabilidade | (Q6) No ambiente de trabalho, você consegue se adaptar rapidamente e responder às adversidades que ocorrem em situações não planejadas? | Escala Likert |
    | Inovação | (Q7) O ambiente de trabalho favorece, estimula e desenvolve as competências necessárias para a busca da inovação nos indivíduos? | Escala Likert |
    | Comunicação | (Q8) No ambiente de trabalho, a comunicação é facilitada e ocorre de forma fluida, permitindo que você se comunique interna e externamente através de várias formas e canais? | Escala Likert |
    | Descentralização | (Q9) No ambiente de trabalho diário, a tomada de decisão é participativa e compartilhada entre a gestão e a equipe, em vez de concentrada em uma pessoa? | Escala Likert |
    | Auto-organização | (Q10) No ambiente de trabalho, a equipe se auto-organiza e se esforça coletivamente para resolver uma tarefa complexa ou um desafio inesperado? | Escala Likert |
    | Colaboração | (Q11) No ambiente de trabalho, os desafios são tratados de forma colaborativa, aproveitando efetivamente as competências individuais dos membros da equipe? | Escala Likert |
    | Resiliência | (Q12) No ambiente de trabalho, você considera que mantém uma atitude positiva, proativa e de aprendizado diante de obstáculos e fracassos? | Escala Likert |


</form>
</main>

# Open Questions

<Progress bar UI>
    Minha Equipe
    Meu Perfil
    **Questionário das Competências de Liderança 4.0**
    Resultados
<Progress bar UI>
    
    <form>
     | COMPETÊNCIA AVALIADA | PERGUNTA | TIPO DE PERGUNTA |
    | Ambiente de Trabalho | (Q13) Na sua opinião, o que poderia ser melhorado no ambiente de trabalho físico ou psicológico, ou nas relações profissionais dentro da equipe ou com a gestão? | Aberta |
    | Formação | (Q14) Na sua opinião, como a universidadede poderia ter lhe preparado melhor para os desafios profissionais que você enfrentou após a graduação? | Aberta |
</form>

# Resultados

<Progress bar UI>
    Minha Equipe
    Meu Perfil
    Questionário das Competências de Liderança 4.0
    **Resultados**
<Progress bar UI>

<main>
| Equipe {Nome da equipe}                                      |
|Email | Status do convite [enviado, cadastrado ou respondido] |
| {email1@gmail.com}       |    {Enviado}                         | 

<radar-graph>
![Captura de tela 2025-02-27 172344](https://github.com/user-attachments/assets/84adc2f1-2cda-44bc-8a74-37b5c21d1c66)

<button> Baixar gráfico </button>
<button> Compartilhar url único </button>
</radar-graph>
<table> 
    | Competência | Descrição | Meu Score | Média da equipe | Delta | 
    | Liderança | Capacidade de influentar outros | 4 | 3 | +1 |

</table>
</main>
