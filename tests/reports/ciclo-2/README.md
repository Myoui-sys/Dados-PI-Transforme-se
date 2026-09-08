# Relatório de QA do ciclo de teste 2

Data das execuções: 08/09/2026. Branch: `feature-testes_automatizadosclico2`.

Esta segunda rodada verificou as correções recebidas e ampliou os testes de cursos e perfil. Inclui a execução inicial HTTP, a inclusão dos cenários e steps BDD e sua separação por grupos. Essas etapas pertencem ao mesmo ciclo.

## Resultados consolidados

| Camada | Selecionados | Passaram | Falharam | Ignorados |
| --- | ---: | ---: | ---: | ---: |
| Unitários e contratos | 27 | 21 | 1 | 5 |
| HTTP de cursos | 3 | 3 | 0 | 0 |
| HTTP de perfil | 9 | 6 | 3 | 0 |
| BDD aprovados | 19 | 19 | 0 | 0 |
| BDD reprovados | 3 | 0 | 3 | 0 |
| BDD ignorados | 1 | 0 | 0 | 1 |
| Total das camadas | 62 | 49 | 7 | 6 |

Os totais combinam a execução Node registrada e os grupos BDD posteriores; não foram executados simultaneamente. As três falhas de perfil foram reproduzidas em HTTP Node e BDD. As sete reprovações representam quatro problemas distintos, não sete.

A execução BDD padrão seleciona 22 cenários e exclui saldos. Os 23 acima incluem saldos executado separadamente no grupo ignorados. Os três passos que pararam após falhas pertencem aos cenários reprovados e não aumentam o número de cenários ignorados.

Os cenários separados por resultado estão listados ao final deste arquivo.

## O que passou

As correções de cadastro passaram: validação de campos, recusa de e-mail inválido, bloqueio de duplicidade por maiúsculas e gravação do endereço em minúsculas. O cadastro na interface redirecionou para login.

Cursos passou na consulta pública e autenticada do catálogo e na verificação de ausência de escrita durante a consulta.

Perfil passou na consulta autenticada, bloqueio sem sessão, edição e persistência, manutenção do identificador e senha, preservação dos outros usuários, recusa de e-mail duplicado e troca válida de e-mail com atualização da sessão e do login.

## O que falhou

| Caso | Situação | Esperado | Obtido |
| --- | --- | --- | --- |
| C2-P01 | Consultar perfil após login com maiúsculas e espaços | 200 e dados do perfil | 404 |
| C2-P02 | Editar perfil sem e-mail | 400 e nenhuma escrita | 500; sem escrita confirmada no teste HTTP |
| C2-P03 | Editar perfil com e-mail inválido | 400 e preservação dos dados | 200 |
| C2-F01 | Definir largura da imagem no script de cursos | Propriedade width | Propriedade widht |

C2-P01 decorre da sessão guardar o e-mail original, embora o login procure a versão normalizada. C2-P02 ocorre ao chamar trim em um campo ausente. C2-P03 não possui validação de formato antes da alteração. C2-F01 é da interface, não do endpoint de cursos.

## O que foi ignorado

Por solicitação de escopo: teste Node de senha no console e quatro testes de tarefas (autenticação, listagem, criação/exclusão e autorização da exclusão). Saldos continuou como cenário BDD pendente. Ignorar não significa corrigir nem aprovar.

Os códigos atuais 400 para PUT de perfil sem sessão e 401 para duplicidade foram aceitos nas verificações de bloqueio. A padronização desses códigos permanece como melhoria não bloqueante nesta rodada.

## Cenários e passos criados

- `tests/e2e/features/cursos-api.feature`: 3 cenários do backend de cursos.
- `tests/e2e/features/perfil-api.feature`: 9 cenários do backend de perfil.
- `tests/e2e/steps/backend-api.steps.cjs`: passos que executam os pedidos e verificações.

Cada cenário de perfil utiliza um usuário exclusivo na cópia temporária. Testes Node e Cucumber continuam como camadas independentes.

## Como repetir

Na raiz do projeto, executar um comando por vez:

```bash
node --test --test-reporter=tap tests/unit/*.test.cjs tests/backend/*.test.cjs
node node_modules/@cucumber/cucumber/bin/cucumber.js --profile aprovados
node node_modules/@cucumber/cucumber/bin/cucumber.js --profile reprovados
node node_modules/@cucumber/cucumber/bin/cucumber.js --profile ignorados
```

HTTP e Cucumber usam a mesma cópia temporária e porta. Não executar simultaneamente. O banco original foi preservado na rodada HTTP registrada; nenhum código da aplicação foi alterado nesta documentação.

## Evidências e documentos

- [Word detalhado](relatorio-detalhado.docx).
- [Evidências compactadas](evidencias.zip): os cinco arquivos JSON e TAP originais, sem alterações.
- [Visão dos dois ciclos e guia de execução](../README.md).

## Aprovados — 19 cenários

### Cadastro de usuário

- Cadastrar um novo usuário pela interface
- Impedir cadastro com e-mail já cadastrado
- Rejeitar cadastro incompleto enviado diretamente para a API

### Consulta do catálogo no backend de cursos

- Consultar o catálogo sem autenticação
- Consultar o catálogo com autenticação
- Preservar os dados ao consultar cursos

### Listagem de cursos

- Exibir cursos cadastrados no banco

### Login de usuário

- Login com credenciais válidas
- Login com e-mail inexistente
- Login com senha incorreta

### Consulta e edição do perfil no backend

- Bloquear consulta de perfil sem autenticação
- Consultar os campos do próprio perfil sem expor senha
- Bloquear edição de perfil sem autenticação
- Atualizar campos, sessão e persistência do próprio perfil
- Impedir troca para e-mail de outro usuário
- Trocar e-mail com normalização e atualizar a identidade de login

### Rotas públicas amigáveis

- Acessar rota amigável de cadastro
- Acessar rota amigável de login
- Acessar rota amigável de cursos

## Reprovados — 3 cenários

| Cenário de perfil | Esperado | Obtido |
| --- | --- | --- |
| Consultar perfil após login com maiúsculas e espaços | 200 | 404 |
| Rejeitar edição sem e-mail | 400 | 500 |
| Rejeitar edição com e-mail inválido | 400 | 200 |

## Ignorados por escopo

- BDD: Consultar saldos pela API — marcado @pendente e @ignorado; excluído da execução padrão.
- Node: teste de senha no console — skip solicitado.
- Node: autenticação de tarefas — skip solicitado.
- Node: listagem de tarefas por usuário — skip solicitado.
- Node: criação e exclusão de tarefa pelo proprietário — skip solicitado.
- Node: bloqueio de exclusão de tarefa de outra pessoa — skip solicitado.

Os cinco skips Node não são cenários Gherkin. Saldos não entrou nos 22 cenários da execução BDD padrão.

## Passos pulados após falha — 3

- Consulta após login com maiúsculas/espaços: verificação dos campos públicos do perfil.
- Edição sem e-mail: verificação de banco inalterado.
- Edição com e-mail inválido: verificação de banco inalterado.

Esses passos pertencem aos três cenários reprovados. Não são cenários ignorados: o Cucumber interrompeu cada cenário depois da primeira falha.
