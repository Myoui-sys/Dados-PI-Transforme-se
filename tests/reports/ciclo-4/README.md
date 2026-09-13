# Relatório de QA automatizado — ciclo 4

**Projeto:** Transforme-se  
**Branch:** `feature-testes_automatizadosciclo4`  
**Base funcional:** `main` no commit `54b851c`, incorporada à branch do ciclo 4  
**Data da execução:** 13/09/2026

## Parecer executivo

O ciclo 4 está **rejeitado para aprovação completa**. Foram executados os testes antigos e os novos cenários de finanças, Home, Meu MEI, obrigações e suporte. A consulta do plano atual, que falhava no ciclo 3, foi corrigida e passou. Três problemas do ciclo 3 continuam ativos e cinco problemas adicionais foram encontrados, totalizando **oito defeitos distintos**.

Os números abaixo contam execuções. Um mesmo defeito pode aparecer em Node e BDD, por isso 14 falhas de execução representam oito defeitos únicos.

| Camada | Selecionados | Passaram | Falharam | Pulados |
| --- | ---: | ---: | ---: | ---: |
| Node, regras e HTTP | 145 | 134 | 8 | 3 |
| BDD, API e navegador | 40 | 34 | 6 | 0 |
| **Total executado** | **185** | **168** | **14** | **3** |

Além dos 3 skips Node, há 3 cenários Gherkin marcados como `@pendente`. O perfil do ciclo 4 os exclui da execução porque as funcionalidades ainda não estão completas.

## Como interpretar

- **PASSOU:** o sistema fez o que o teste esperava naquele caso.
- **REJEITADO:** o resultado real foi diferente do esperado e precisa de correção.
- **PULADO ou PENDENTE:** o teste não foi executado porque falta implementação ou integração. Não significa que passou.
- **Node:** verifica funções, regras e rotas diretamente, sem depender da interface.
- **BDD com Cucumber e Gherkin:** descreve o comportamento em português com Dado, Quando e Então.
- **Playwright:** abre páginas no navegador e também ajuda a conferir integrações reais entre tela e servidor.

## Situação dos problemas do ciclo 3

| Referência | Situação no ciclo 4 | Evidência |
| --- | --- | --- |
| C3-01 — consulta do plano atual retornava 500 | **CORRIGIDO** | `/api/planos/atual` respondeu corretamente em Node e BDD. |
| C3-04 — edição inválida alterava tarefa em memória | **NÃO CORRIGIDO** | O servidor devolve 400, mas o título já foi trocado. |
| C3-05 — edição inválida alterava evento em memória | **NÃO CORRIGIDO** | O servidor devolve 400, mas a data já foi trocada. |
| C3-06 — calendário aceitava 30 de fevereiro | **NÃO CORRIGIDO** | A API ainda aceita `2026-02-30`. |

As correções anteriores de cadastro, normalização de e-mail, perfil e imagens continuam aprovadas. O redirecionamento atual do login para `/home` foi incorporado ao teste e passou.

## Funcionalidades aprovadas

### Regressões e autenticação

- Cadastro obrigatório e bloqueio de e-mail duplicado continuam funcionando.
- Login válido, sessão, logout e acesso protegido continuam funcionando.
- Consulta do plano atual voltou a funcionar para usuário autenticado.
- Rotas e regras antigas de cursos, perfil, planos, tarefas e eventos continuam cobertas.

### Financeiro

- A página `/financeiro` entrega HTML.
- Rotas protegidas bloqueiam visitantes.
- O resumo mensal calcula entradas, saídas, lucro e percentuais.
- O resumo separa os dados por usuário e rejeita mês ou ano inválido.
- A listagem filtra por proprietário e tipo e ordena por data.
- Uma movimentação válida pode ser criada e excluída com persistência.
- Valor zero, descrição vazia, tipo inválido e data fora do formato são rejeitados.
- Um usuário não pode excluir movimentação de outro usuário.
- O formulário financeiro foi exercitado no navegador com dados válidos.

### Meu MEI e obrigações

- As páginas `/obrigacoes` e `/visaoGeral` agora existem e entregam conteúdo.
- A API de negócio exige autenticação, retorna estrutura vazia para usuário novo, salva dados válidos e rejeita cadastro incompleto.
- O catálogo de obrigações corresponde ao `db.json`.
- Alterações de obrigação exigem login, rejeitam status inválido e persistem status válido.
- A interface exibiu os cartões de obrigações no navegador.

### Suporte

- A página `/suporte` entrega HTML.
- Categorias e perguntas podem ser listadas e filtradas.
- A busca válida ignora diferença entre maiúsculas e minúsculas.
- Tickets exigem autenticação, podem ser criados e ficam isolados por usuário.
- Tickets incompletos são rejeitados.
- Categorias e perguntas foram exibidas na interface.

## Defeitos rejeitados

### C4-01 — edição rejeitada altera a tarefa

**Esperado:** validar todos os campos e, se algum for inválido, devolver 400 sem mudar a tarefa.  
**Obtido:** o título é alterado antes da validação do status. O pedido retorna 400, mas uma consulta seguinte encontra o título novo.  
**Por que acontece:** `server.js:694-704` modifica o objeto; somente depois, em `server.js:706-710`, valida o status.  
**Impacto:** uma operação informada como rejeitada muda dados em memória e pode ser gravada por uma operação posterior.  
**Correção lógica:** validar o pedido inteiro primeiro e aplicar todas as mudanças somente se tudo estiver correto.  
**Teste:** `tests/backend/ciclo3.test.cjs:121` e cenário BDD `tests/e2e/features/ciclo4.feature:16`.

### C4-02 — edição rejeitada altera o evento

**Esperado:** título em branco deve provocar 400 e preservar o evento inteiro.  
**Obtido:** a data é aplicada antes de o título ser rejeitado.  
**Por que acontece:** `server.js:948-954` altera a data; `server.js:956-960` valida o título depois.  
**Impacto:** um compromisso pode mudar de dia mesmo quando a tela ou API informa falha.  
**Correção lógica:** validar data, título e descrição antes de modificar o evento.  
**Teste:** `tests/backend/ciclo3.test.cjs:121` e cenário BDD `tests/e2e/features/ciclo4.feature:24`.

### C4-03 — evento aceita uma data que não existe

**Esperado:** `2026-02-30` deve retornar 400.  
**Obtido:** a criação retorna sucesso e aceita o dia inexistente.  
**Por que acontece:** `server.js:883` confere apenas se o texto tem o formato AAAA-MM-DD.  
**Impacto:** o calendário pode armazenar compromissos impossíveis.  
**Correção lógica:** depois de conferir o formato, confirmar que ano, mês e dia formam uma data real, incluindo ano bissexto.  
**Teste:** `tests/backend/ciclo3.test.cjs:136` e cenário BDD `tests/e2e/features/ciclo4.feature:32`.

### C4-04 — a Home espera um dado que a API não envia

**Esperado:** o resumo financeiro deve incluir `comparacao_mes_anterior` ou a Home deve tratar sua ausência.  
**Obtido:** a API responde 200 sem esse campo e a página registra `TypeError` ao tentar ler `entrada`.  
**Por que acontece:** a resposta em `server.js:290-302` não contém a comparação; `public/scripts/home.js:110-125` tenta usá-la obrigatoriamente.  
**Impacto:** os indicadores de variação da Home não carregam corretamente.  
**Correção lógica:** alinhar o contrato entre as duas partes. A API pode calcular e devolver a comparação; a tela também deve apresentar um estado seguro quando o campo estiver ausente.  
**Teste:** `tests/backend/ciclo4.test.cjs:102` e cenário BDD `tests/e2e/features/ciclo4.feature:45`.

### C4-05 — financeiro aceita uma data que não existe

**Esperado:** uma movimentação em `2026-02-30` deve retornar 400.  
**Obtido:** a API retorna 201 e cria a movimentação.  
**Por que acontece:** `server.js:446-450` verifica somente o formato do texto.  
**Impacto:** relatórios e filtros podem conter lançamentos em dias impossíveis.  
**Correção lógica:** usar a mesma validação de data real em calendário e financeiro.  
**Teste:** `tests/backend/ciclo4.test.cjs:174` e cenário BDD `tests/e2e/features/ciclo4.feature:65`.

### C4-06 — descrição com tipo errado causa erro interno

**Esperado:** descrição não textual deve retornar 400 como pedido inválido.  
**Obtido:** um objeto no lugar do texto causa 500.  
**Por que acontece:** `server.js:420` chama `trim()` antes de confirmar que a descrição é uma string.  
**Impacto:** entrada inválida derruba o tratamento normal da rota e expõe um erro interno evitável.  
**Correção lógica:** validar o tipo do valor antes de aplicar operações de texto.  
**Teste:** `tests/backend/ciclo4.test.cjs:183`.

### C4-07 — busca com espaços é tratada como válida

**Esperado:** uma busca contendo somente espaços deve retornar 400.  
**Obtido:** a API retorna 200 com lista vazia.  
**Por que acontece:** `server.js:1026` verifica apenas se `q` existe; uma sequência de espaços é considerada verdadeira.  
**Impacto:** o contrato da busca aceita um termo sem conteúdo e dificulta mensagens claras na interface.  
**Correção lógica:** retirar espaços das pontas e exigir pelo menos um caractere útil.  
**Teste:** `tests/backend/ciclo4.test.cjs:281` e cenário BDD `tests/e2e/features/ciclo4.feature:77`.

### C4-08 — login registra senha no console do servidor

**Esperado:** logs de autenticação não devem conter a senha.  
**Obtido:** o usuário completo, incluindo senha armazenada, é enviado ao console.  
**Por que acontece:** `server.js:559` executa `console.log(usuario)`.  
**Impacto:** a senha pode aparecer no terminal, em capturas de tela ou em serviços de log. É um risco mesmo em projeto acadêmico.  
**Correção lógica:** remover o log do objeto completo; quando necessário, registrar somente informação não sensível.  
**Teste:** `tests/unit/server.routes.test.cjs:287`.

## Cenários pendentes

| Item | Motivo do skip | Condição para ativar |
| --- | --- | --- |
| Guias | A rota consulta `db.guias`, mas a coleção não existe no `db.json`. | Definir e integrar a estrutura dos guias. |
| Calendário definitivo | `public/Atividades/Calendário/index.html` está vazio. A API de eventos foi testada separadamente. | Entregar a página e ligá-la à API. |
| Lembretes | `public/Atividades/Lembretes/index.html` está vazio e não há API correspondente. | Implementar tela, regra e persistência. |

## Como executar no terminal do VS Code

Na raiz do projeto, execute um comando por vez:

```powershell
npm.cmd ci
npm.cmd run test:ciclo4
npm.cmd run test:bdd
```

Para executar apenas os 15 cenários novos do ciclo 4:

```powershell
npm.cmd run test:bdd:ciclo4
```

Os comandos terminam com código de erro enquanto existirem testes rejeitados. Isso é esperado: o teste está avisando que o comportamento ainda não atende ao critério definido.

## Evidências

- `evidencias/node.tap`: resultado integral dos 145 testes Node.
- `evidencias/bdd.txt`: saída legível dos 40 cenários BDD.
- `evidencias/cucumber-report.json`: relatório estruturado da regressão BDD.
- `evidencias/cucumber-ciclo4.json`: relatório estruturado dos cenários novos.
- `evidencias.zip`: cópia compactada das evidências.
- `relatorio-detalhado.docx`: documento explicativo para apresentação à equipe.

Os testes usam uma cópia temporária do projeto e preservam o `db.json` original. Nenhum arquivo de lógica de produção foi alterado por esta rodada de QA.
