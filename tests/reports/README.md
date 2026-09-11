# Relatórios de QA

## Ciclo atual — 3

O [relatório do ciclo 3](ciclo-3/README.md) registra as novas funcionalidades e a confirmação das correções anteriores: **125 verificações, 112 aprovações, 6 falhas e 7 skips**. Inclui os comandos atuais e as evidências. Os dados abaixo descrevem o histórico dos ciclos 1 e 2; seus comandos e classificações refletem aquela época.

## Histórico dos dois primeiros ciclos

Foram realizados **dois ciclos de teste** no projeto Transforme-se. O primeiro identificou problemas no funcionamento inicial. O segundo verificou as correções recebidas e ampliou a avaliação do backend de cursos e perfil. As repetições e a separação em grupos fazem parte do ciclo 2; não são ciclos novos.

Este relatório ajuda a equipe a entender o que foi verificado, o que melhorou e o que ainda precisa de correção. Os resultados são os registrados nas execuções de cada ciclo; esta organização dos documentos não representa uma nova execução.

## Organização

- [Ciclo 1](ciclo-1/README.md): relatório, resultados e [Word histórico](ciclo-1/relatorio-detalhado.docx).
- [Ciclo 2](ciclo-2/README.md): relatório, cenários por resultado, [Word atualizado](ciclo-2/relatorio-detalhado.docx) e [evidências compactadas](ciclo-2/evidencias.zip).

Cada ciclo tem um único Markdown. Este arquivo reúne a visão geral, as explicações e os comandos de execução. Os documentos Word foram preservados; caminhos antigos citados dentro deles se referem à organização anterior.

## O que significa um ciclo de teste

Um ciclo é uma rodada organizada de verificação: escolher o que será avaliado, executar as verificações, comparar o resultado com o esperado e registrar o que aconteceu. Depois que chegam correções, os testes podem ser repetidos para conferir se o problema foi resolvido e se outras partes continuam funcionando. Essa conferência de comportamentos anteriores é chamada de teste de regressão.

## Ciclo de teste 1

Realizado em **29/08/2026**, na branch `feature-testes_automatizados`. Foram avaliados cadastro, login, cursos e integrações pendentes.

Foram 27 verificações selecionadas: **20 passaram, 5 falharam e 2 foram puladas**. As cinco falhas apontaram quatro problemas, pois o cadastro incompleto falhou em duas formas de teste. Os problemas eram cadastro sem dados obrigatórios, duplicidade de e-mail com maiúsculas, senha no console e propriedade incorreta da largura das imagens. Tarefas e saldos ficaram pendentes naquele momento.

## Ciclo de teste 2

Registrado em **08/09/2026**, na branch `feature-testes_automatizadosclico2`. Foram verificadas as correções de cadastro e adicionados testes diretos das APIs e cenários escritos em português para cursos e perfil.

Na consolidação das camadas e dos grupos BDD, foram **62 verificações selecionadas: 49 passaram, 7 falharam e 6 foram ignoradas**. Esse total combina a execução Node registrada com os grupos BDD executados depois; não é uma única execução simultânea. Há comportamentos verificados em mais de uma camada.

| Ciclo e camada | Selecionados | Passaram | Falharam | Ignorados |
| --- | ---: | ---: | ---: | ---: |
| Ciclo 1 — Node | 15 | 11 | 4 | 0 |
| Ciclo 1 — BDD | 12 | 9 | 1 | 2 |
| Ciclo 2 — Node, incluindo APIs | 39 | 30 | 4 | 5 |
| Ciclo 2 — BDD, incluindo saldos separado | 23 | 19 | 3 | 1 |

Os três cenários BDD reprovados são os mesmos problemas de perfil encontrados nos testes HTTP. Portanto, as sete falhas do ciclo 2 correspondem a quatro problemas identificados: três no perfil e um no script de imagens. Não se deve interpretar sete falhas como sete problemas diferentes.

## O que melhorou e o que continua pendente

| Assunto | Evolução observada |
| --- | --- |
| Cadastro incompleto | Era aceito no ciclo 1; passou a ser rejeitado nos testes do ciclo 2. |
| E-mail duplicado com maiúsculas | Era aceito no ciclo 1; passou a ser bloqueado no ciclo 2. |
| Cadastro na tela | O teste do ciclo 2 confirmou o redirecionamento para login. |
| Backend de cursos | Os três novos testes diretos passaram; o catálogo foi retornado corretamente. |
| Perfil | Fluxos principais passaram, mas três situações falharam: consulta após login com maiúsculas/espaços, edição sem e-mail e edição com e-mail inválido. |
| Imagens dos cursos | O erro de escrita `widht` permaneceu no teste de frontend. Isso não significa que a API de cursos falhou. |
| Senha no console | O teste foi ignorado no ciclo 2 por solicitação de escopo; não foi registrado como corrigido. |
| Tarefas e saldos | Tarefas ficou com quatro testes Node ignorados por solicitação; saldos continuou pendente. |

## Como ler os resultados

- **Passou ou aprovado:** naquele caso, o sistema fez o que o teste esperava. Não garante que todo o sistema esteja sem defeitos.
- **Falhou ou reprovado:** o teste encontrou uma diferença entre o esperado e o que o sistema fez. Exemplo: uma edição sem e-mail deveria ser recusada de forma controlada, mas causou erro interno.
- **Ignorado ou skip:** a verificação não foi executada por decisão de escopo ou falta de integração. Não significa aprovação.
- **Passo pulado após falha:** o cenário começou, mas parou no primeiro problema. Os passos seguintes não rodaram. No ciclo 2 foram três passos assim; eles pertencem aos cenários reprovados e não são três cenários ignorados adicionais.

## Ferramentas e termos em linguagem simples

| Termo | Explicação |
| --- | --- |
| QA | Trabalho de verificar a qualidade e registrar evidências para a equipe decidir o que corrigir. |
| Cenário | Uma situação a verificar, como entrar com um usuário válido e consultar seu perfil. |
| Gherkin | Forma de escrever cenários em português com Dado, Quando e Então. |
| Step ou passo | A ação automática que corresponde a uma frase do cenário. |
| Cucumber | Ferramenta que liga as frases aos passos e organiza os resultados. |
| Playwright | Ferramenta que interage com o navegador e também envia pedidos diretamente à API. |
| Node e testes unitários | Executor usado para verificar regras pequenas e contratos; neste projeto também executa testes HTTP separados. |
| Frontend | A parte visível, como telas, botões, formulários e imagens. |
| Backend | A parte que processa pedidos e consulta ou grava dados. |
| API | O meio pelo qual a tela ou um teste pede dados ou ações ao backend. |
| Sessão | Informação usada pelo sistema para reconhecer quem está conectado. |
| Persistência | Gravar uma alteração no armazenamento, em vez de apenas mostrá-la momentaneamente na tela. |
| Evidência | Registro do que foi executado e do resultado, como os relatórios JSON e TAP. |

Exemplo: **Dado** que uma pessoa entrou no sistema, **Quando** ela consulta o perfil, **Então** deve receber seus dados. O cenário descreve essa regra; os steps fazem o login e a consulta e conferem a resposta.

Os números HTTP são respostas resumidas do servidor: **200** indica sucesso, **400** pedido inválido, **401** falta de autenticação válida, **404** recurso não encontrado e **500** erro interno. No perfil, apareceram 404 onde se esperava 200, 500 onde se esperava 400 e 200 para um e-mail inválido que deveria ser recusado com 400.

## Parecer

O ciclo 2 confirmou melhorias no cadastro e ampliou a cobertura. O backend de perfil ainda precisa das correções registradas; o defeito de imagens também continua ativo. O aumento do número de falhas não prova piora geral, pois a segunda rodada examinou mais situações. Os itens ignorados devem ser tratados como não avaliados nesta rodada.


## Como executar

Na raiz do projeto, instale as ferramentas se necessário:

```bash
npm install --no-save --package-lock=false @cucumber/cucumber playwright
```

Execute um comando por vez, pois HTTP e Cucumber compartilham a cópia temporária e a porta:

```bash
node --test tests/unit/*.test.cjs tests/backend/*.test.cjs
node node_modules/@cucumber/cucumber/bin/cucumber.js
```

Para separar os grupos BDD, use --profile aprovados, --profile reprovados ou --profile ignorados no comando do Cucumber. Para somente o backend, use --tags "@backend and not @pendente". As tags registram a rodada e devem ser revistas após correções.

As evidências anteriores estão preservadas no ZIP do ciclo 2. Novas execuções geram JSON em ciclo-2/evidencias. Os testes usam uma cópia temporária em tests/tmp/app-under-test.
