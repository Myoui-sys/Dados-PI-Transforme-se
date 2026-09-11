# Relatório de QA — ciclo 3

Execução: 11/09/2026. Branch: `feature-testes_automatizadosciclo3`. Código avaliado: `0d6adff`, incluindo as atualizações de `upstream/main` até `e33e94b`.

Foram adicionadas **64 verificações automatizadas**: 53 HTTP, 8 unitárias de regras de planos e 3 cenários BDD de interface. Os testes anteriores de cadastro, login, cursos e perfil foram executados novamente. Os passos de navegação foram adaptados às novas rotas após a reorganização de pastas.

## Resultado final

| Camada | Total | Passaram | Falharam | Ignorados |
| --- | ---: | ---: | ---: | ---: |
| Node: unitários, contratos e HTTP | 100 | 88 | 5 | 7 |
| BDD: API e navegador | 25 | 24 | 1 | 0 |
| Total de verificações | 125 | 112 | 6 | 7 |

São verificações de camadas diferentes, com sobreposição de cobertura. As seis falhas representam quatro problemas distintos. Dois testes de páginas ainda não implementadas foram reclassificados como pulados após revisão de escopo. Os resultados acima são da última execução de cada camada, realizadas sequencialmente. Rodadas intermediárias de ajuste da infraestrutura não entram nos totais.

## Correções do ciclo 2 confirmadas

| Caso anterior | Verificação no ciclo 3 | Resultado |
| --- | --- | --- |
| C2-P01 | Login com maiúsculas e espaços mantém identidade normalizada e permite consultar perfil | Passou em Node e BDD |
| C2-P02 | Edição sem e-mail retorna 400 sem alterar banco | Passou em HTTP e BDD |
| C2-P03 | E-mail inválido é recusado sem persistência | Passou em HTTP e BDD |
| C2-F01 | Imagens usam `width = 200` | Passou no teste do script e no navegador |

Também foram adicionados nove casos de e-mail de perfil: nulo, número, objeto, lista, vazio, espaços e três formatos inválidos. Todos retornaram 400, preservaram o banco e mantiveram a identidade da sessão.

## Novidades cobertas

- Planos: catálogo público sem escrita, assinatura de Gratuito/Premium/Premium Deluxe, preservação dos outros usuários, plano inválido, consulta do plano atual e plano padrão de novo usuário.
- Regras de planos: permissões dos três planos, recurso desconhecido, retorno ao Gratuito e middleware com visitante, usuário sem acesso e usuário autorizado. A aprovação do middleware isolado não comprova sua integração nas rotas.
- Interface de assinaturas: catálogo para visitante, aviso de login, ordenação e preços; fluxo autenticado de plano atual e troca de assinatura.
- Tarefas e eventos: autenticação, criação, listagem por proprietário, edição, exclusão, persistência, bloqueio de outro usuário, identificador inexistente e campos obrigatórios.
- Calendário: filtro de mês/ano, formato de data e data inexistente, além de ausência de alteração parcial em pedido rejeitado.
- Mentorias: catálogo com nome do professor associado.
- Rotas: assinaturas, mentorias, configurações, obrigações, guias e visão geral do MeuMEI.

## Problemas encontrados

| ID | Como reproduzir | Esperado | Obtido |
| --- | --- | --- | --- |
| C3-01 | Fazer login e consultar `/api/planos/atual`, inclusive com usuário recém-cadastrado | 200 com o plano atual ou Gratuito | 500. `server.js` usa `pegarPlanoDoUsuario` sem importá-la. A tela autenticada não exibe os cards, impedindo a troca pelo navegador. Dois testes HTTP e um BDD falham pelo mesmo problema. |
| C3-04 | Editar tarefa enviando título válido junto com status inválido | 400 e tarefa inteiramente preservada | 400 e disco inalterado no momento, mas o título muda em memória e aparece na consulta seguinte. |
| C3-05 | Editar evento enviando data válida junto com título em branco | 400 e evento inteiramente preservado | 400 e disco inalterado no momento, mas a data muda em memória e aparece na consulta seguinte. |
| C3-06 | Criar evento com data `2026-02-30` | 400 sem persistir | 200: aceita e grava uma data inexistente. |

As expectativas dos testes foram mantidas para que essas falhas continuem visíveis até a correção da aplicação. O código de produção não foi alterado.

## Limites e itens ignorados

Obrigações e Visão Geral do MeuMEI serão reativadas quando suas páginas forem entregues. Os arquivos de Calendário e Lembretes em `public/Atividades` também estão vazios; a rota `/tarefas` usa caminhos de scripts ainda não integrados. Não há cenários ativos de navegador desses fluxos na seleção atual. Existem páginas auxiliares de tarefas e calendário em `public/pages`; a ausência de integração nas telas definitivas não impede testar as APIs já implementadas.

Assinaturas já tem HTML e script consumindo a API. O erro 500 do plano atual é do backend, por isso permanece como falha ativa, assim como os erros de validação de tarefas e eventos.

Há sete skips Node: os testes de `/obrigacoes` e `/visaoGeral`, pulados por frontend ainda não implementado, e os cinco skips históricos: um de senha no console e quatro unitários de tarefas. As operações de tarefas agora possuem cobertura HTTP ativa no ciclo 3; os skips antigos não indicam ausência dessa cobertura. O cenário de saldos continua pendente e excluído da execução padrão, sem entrar nos 125 selecionados.

O fluxo de troca de plano pela interface ficou bloqueado na exibição do plano atual; não foi aprovado. A assinatura pela API foi verificada separadamente. Calendário, tarefas, mentorias e novas rotas têm cobertura HTTP nesta rodada; não foi feita uma avaliação visual completa dessas telas nem uma auditoria de segurança.

## Executar novamente

Usar Node.js 24 e instalar as dependências com `npm ci`. O BDD usa Microsoft Edge local; se não estiver disponível, instalar o navegador do Playwright com `npx playwright install chromium`.

Executar **um comando por vez**, pois HTTP e BDD compartilham a porta 3137 e a cópia temporária:

```bash
npm run test:ciclo3
npm run test:bdd
```

Para selecionar apenas os três novos cenários de interface e os nove de perfil:

```bash
npm run test:bdd:ciclo3
```

Os comandos retornam falha enquanto os defeitos acima permanecerem. As APIs trabalham em uma cópia de `db.json`; as suítes HTTP verificam ao final que o banco original continua idêntico. Não executar o servidor de testes manualmente na mesma porta durante a rodada.

## Evidências

- [Word detalhado](relatorio-detalhado.docx): relatório na estrutura dos ciclos anteriores, com casos aprovados e análise de cada defeito.
- [Evidências anteriores à revisão de escopo](evidencias-antes-revisao-escopo.zip): registro preservado da classificação anterior.
- [Evidências compactadas](evidencias.zip): TAP, JSON BDD e resumo da execução.
- [Resultado Node completo](evidencias/node.tap): nomes de todos os casos, aprovações, falhas e skips.
- [Resultado BDD completo](evidencias/cucumber-report.json): cenários e passos com os resultados.
- [Resumo BDD](evidencias/bdd.txt): 25 cenários, 24 aprovados e uma falha.

As tags dos três cenários de perfil anteriormente reprovados foram atualizadas após a confirmação das correções. Relatórios dos ciclos 1 e 2 continuam como registro histórico. Tags são auxiliares de seleção; os resultados válidos são os produzidos pela execução.
