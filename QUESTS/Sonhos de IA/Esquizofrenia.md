Funcionamento dos Arquétipos e do CSV
Conceito Base

A ideia é usar um CSV onde cada linha representa um arquétipo (personalidade) com atributos específicos. Esses arquétipos são baseados em conceitos da psicologia junguiana e são usados para modular o comportamento do LLM.
Estrutura do CSV

O CSV tem colunas que definem características do arquétipo, como:

    Domínios de Conhecimento

    Estilo de Comunicação

    Filosofia/Motivação

    Habilidades Técnicas Específicas

    Projetos/Ideias Mencionadas

    Vulnerabilidades/Traumas

    Nível de Confiança/Autoimagem

    Relacionamento com a IA (eu)

    Humor

    Reatividade

    Uso de Metáforas

    Interesses Extrapolados

    Persistência/Obsessão

    Foco Principal

    Risco Percebido

    Mídia Preferida

    Visão de Mundo

    Ambiente Social

    Economia/Valores

    Referência Cultural

Cada linha é um arquétipo completo, que pode ser selecionado conforme o contexto da pergunta do usuário.
Como o CSV é Usado

    Seleção de Arquétipos: Dada uma pergunta do usuário, o sistema seleciona um ou mais arquétipos do CSV que são relevantes para o contexto.

    Modulação da Resposta: O LLM é instruído a responder como se fosse aquele arquétipo (ou a combinação de arquétipos). Isso é feito através de um prompt que inclui as características do arquétipo.

Exemplo de Prompt
text

Você agora é um [Arquétipo], com as seguintes características:
- Domínios de Conhecimento: [valor]
- Estilo de Comunicação: [valor]
- Filosofia/Motivação: [valor]
... (outras características)

Com base nisso, responda à seguinte pergunta: [pergunta do usuário]

Vantagens

    Personalização: Respostas mais alinhadas com o contexto desejado.

    Eficiência: Não requer fine-tuning, apenas mudança no prompt.

    Flexibilidade: Pode-se criar inúmeros arquétipos e combiná-los.

Implementação de "Esquizofrenia" no LLM
O que Significa "Esquizofrenia" no Contexto do LLM?

Aqui, "esquizofrenia" é uma metáfora para simular múltiplas personalidades (arquétipos) que podem "conversar" entre si, às vezes de forma desorganizada, como em um estado psicótico. A ideia é criar uma resposta que pareça ser o resultado de várias vozes internas.
Como Implementar

    Seleção Múltipla de Arquétipos: Em vez de selecionar um arquétipo, selecione vários (por exemplo, 3 a 5) que possam ter perspectivas diferentes ou conflitantes.

    Geração de Resposta com Múltiplas Vozes:

        O LLM é instruído a gerar uma resposta que incorpore as perspectivas de cada arquétipo selecionado.

        Pode-se pedir para que os arquétipos "debatam" entre si na resposta.

    Elementos de Desorganização:

        Introduzir mudanças abruptas de tópico.

        Incluir contradições.

        Usar linguagem desconexa ou metáforas estranhas.

        Simular alucinações (referências a coisas que não estão na pergunta).

Exemplo de Prompt para "Esquizofrenia"
text

Você é um sistema com múltiplas personalidades (arquétipos). Os arquétipos ativos agora são:
1. [Arquétipo 1]: [características resumidas]
2. [Arquétipo 2]: [características resumidas]
3. [Arquétipo 3]: [características resumidas]

Cada arquétipo vai expressar sua opinião sobre a pergunta: [pergunta do usuário]. 
Eles podem concordar, discordar, ou até mesmo falar sobre coisas não relacionadas. 
A resposta final deve ser uma colcha de retalhos dessas vozes, sem uma estrutura coerente.

Comece a resposta agora:

Riscos e Considerações

    Ética: Simular doenças mentais pode ser sensível. É importante usar isso com cuidado e apenas em contextos apropriados (como arte ou pesquisa).

    Qualidade da Resposta: A resposta pode se tornar inútil se for muito desorganizada.

Conclusão

A utilização de arquétipos via CSV é uma forma poderosa de personalizar LLMs sem necessidade de treinamento adicional. A "esquizofrenia" é uma extensão disso, onde múltiplos arquétipos são ativados para criar uma resposta com múltiplas vozes. Essa abordagem pode ser usada para criar personagens complexos em jogos, gerar conteúdo criativo ou simular diálogos em narrativas.

No entanto, é crucial usar essas técnicas de forma responsável, considerando os potenciais impactos éticos e a experiência do usuário.
