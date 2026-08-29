# Plano de QA automatizado

Este pacote de testes foi criado para validar o sistema sem alterar a lógica da aplicação.

## Como executar

Instale temporariamente as ferramentas de teste, sem gravar no `package.json`:

```bash
npm install --no-save --package-lock=false @cucumber/cucumber playwright
```

Execute os testes unitários:

```bash
node --test tests/unit/*.test.cjs
```

Execute os cenários BDD/Gherkin com Cucumber e Playwright:

```bash
npx cucumber-js
```

## Estratégia

- Testes unitários: validam regras pequenas, contratos de dados e pontos críticos dos scripts.
- Testes de sistema: validam cadastro, login e listagem de cursos pelo navegador com Playwright.
- Cenários pulados: documentam integrações ainda ausentes para não bloquear a entrega.
- Cenários rejeitados: falham de propósito quando revelam problema de lógica ou segurança.

## Proteção do banco

Os testes BDD sobem uma cópia temporária da aplicação em `tests/tmp/app-under-test`.
Assim, cadastros feitos durante os testes não alteram o `db.json` real do projeto.
