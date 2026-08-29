# Relatório de QA automatizado

Projeto: Transforme-se  
Branch: `feature-testes_automatizados`  
Data: 2026-08-29  
Escopo: cadastro, login, cursos e integrações ainda pendentes

## Ferramentas utilizadas

- Playwright para teste de sistema no navegador.
- Cucumber com Gherkin para escrita dos cenários BDD.
- `node:test` para testes unitários e contratos simples.

## Comandos executados

```bash
npm install --no-save --package-lock=false @cucumber/cucumber playwright
node --test tests/unit/*.test.cjs
npx cucumber-js
```

## Resultado geral

### Testes unitários

Total: 15  
Passaram: 11  
Pulados: 0  
Rejeitados: 4

### Testes BDD / sistema

Total: 12 cenários  
Passaram: 9  
Pulados: 2  
Rejeitados: 1

## Testes que passaram

### Unitários

- `db.json` possui as coleções principais.
- Cursos possuem campos obrigatórios para renderização.
- Imagens referenciadas pelos cursos existem em `public/images/cursos`.
- Cursos referenciam professores existentes.
- `cadastro.js` envia dados para `POST /cadastro` em JSON.
- `login.js` envia credenciais para `POST /login` em JSON.
- `POST /login` autentica credenciais válidas e cria sessão.
- `POST /login` rejeita e-mail inexistente.
- `POST /login` rejeita senha incorreta.
- `POST /cadastro` cria usuário novo com próximo id.
- `POST /cadastro` rejeita e-mail duplicado quando o e-mail é exatamente igual.

### BDD / sistema

- Cadastro de novo usuário pela interface.
- Bloqueio de cadastro com e-mail já cadastrado pela interface.
- Listagem dos 2 cursos cadastrados no banco.
- Login com credenciais válidas, criação de sessão e redirecionamento para cursos.
- Login com e-mail inexistente.
- Login com senha incorreta.
- Rota pública `/cadastro` responde HTTP 200.
- Rota pública `/login` responde HTTP 200.
- Rota pública `/cursos` responde HTTP 200.

## Testes pulados

- Consultar tarefas pela API.
  - Justificativa: não há rota `/api/tarefas` implementada no `server.js`.
  - Observação: `public/pages/tarefas.html` aponta para `logic/to_do_list/listar_tarefas.js`, arquivo que não existe na estrutura atual.

- Consultar saldos pela API.
  - Justificativa: não há rota `/api/saldos` implementada no `server.js`.
  - Observação: existe coleção `saldos` no `db.json`, mas ainda não existe endpoint para consumo pelo front-end.

## Testes rejeitados

### 1. Cadastro incompleto via API é aceito

Status: rejeitado  
Tipo: back-end / regra de negócio  
Evidência: o cenário BDD esperava `{ sucesso: false }`, mas a API retornou `{ sucesso: true }`.

Ponto provável: `server.js`, rota `POST /cadastro`, após ler `nome`, `sobrenome`, `email` e `senha` do body não há validação de campos obrigatórios antes de gravar no banco.

Risco: um usuário pode ser salvo com dados ausentes, inclusive com chave `undefined` caso o e-mail não seja enviado.

Recomendação: validar `nome`, `sobrenome`, `email` e `senha` no back-end antes de gravar. Retornar HTTP 400 e uma mensagem padronizada quando faltar campo obrigatório.

### 2. E-mail duplicado com letras maiúsculas não é rejeitado

Status: rejeitado  
Tipo: back-end / consistência de cadastro  
Evidência: o teste unitário enviou `SABRINA@GMAIL.COM` e o back-end tratou como e-mail novo.

Ponto provável: `server.js`, verificação direta `db.usuarios[email]`.

Risco: o mesmo usuário pode ser cadastrado mais de uma vez mudando apenas maiúsculas/minúsculas.

Recomendação: normalizar e-mail com `trim().toLowerCase()` no cadastro e no login.

### 3. Login registra usuário completo no console

Status: rejeitado  
Tipo: segurança / privacidade  
Evidência: o teste unitário encontrou a senha no conteúdo logado pelo `console.log(usuario)`.

Ponto provável: `server.js`, rota `POST /login`.

Risco: vazamento de senha em logs.

Recomendação: remover o log ou registrar apenas dados não sensíveis, como e-mail normalizado e resultado da autenticação.

### 4. `cursos.js` usa propriedade incorreta para largura da imagem

Status: rejeitado  
Tipo: front-end / renderização  
Evidência: o teste unitário esperava `imagem.width = 200`, mas encontrou `imagem.widht = 200`.

Ponto provável: `public/scripts/cursos.js`.

Risco: largura da imagem não é aplicada, causando layout inconsistente.

Recomendação: corrigir para `imagem.width = 200` ou controlar dimensão via CSS.

## Melhorias recomendadas para a lógica

- Padronizar respostas JSON no back-end, inclusive erros de login e cadastro.
- Usar códigos HTTP adequados: 400 para dados inválidos, 401 para login inválido e 409 para e-mail já cadastrado.
- Separar criação do app Express do `app.listen`, permitindo testes sem precisar subir processo externo.
- Permitir configuração de porta por `process.env.PORT`.
- Injetar caminho do banco em ambiente de teste, evitando tocar no `db.json` real.
- Não armazenar senha em texto puro; usar hash de senha quando o projeto evoluir.
- Criar endpoints para `tarefas` e `saldos` antes de ativar os cenários pulados.
- Adicionar scripts oficiais quando a equipe aprovar: `test:unit`, `test:e2e` e `test`.

## Observação sobre isolamento

Os testes BDD executam uma cópia temporária da aplicação em `tests/tmp/app-under-test`.
O arquivo `db.json` real do projeto não é alterado durante a execução dos cenários.
