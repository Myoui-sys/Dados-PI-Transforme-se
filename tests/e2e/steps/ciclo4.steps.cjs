const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const fixture = require("../../../db.json");

const dbPath = path.resolve(__dirname, "../../tmp/app-under-test/db.json");
const lerBanco = () => JSON.parse(fs.readFileSync(dbPath, "utf8"));

async function entrar(world, email = "sabrina@gmail.com") {
    const response = await world.page.request.post(`${world.baseUrl}/login`, {
        data: { emailDigitado: email, senhaDigitada: "123456" }
    });
    assert.equal(await response.text(), "Login realizado com sucesso!");
}

Given("que estou autenticado para o ciclo quatro", async function() {
    await entrar(this);
});

When("consulto meu plano atual no ciclo quatro", async function() {
    this.ciclo4Response = await this.page.request.get(`${this.baseUrl}/api/planos/atual`);
});

Then("a consulta do ciclo quatro deve responder com status {int}", function(status) {
    assert.equal(this.ciclo4Response.status(), status);
});

Then("devo receber um plano válido", async function() {
    const plano = await this.ciclo4Response.json();
    assert.ok(Object.values(fixture.planos).some(item => item.id_plano === plano.id_plano));
});

Given("criei uma tarefa para testar edição inválida", async function() {
    const response = await this.page.request.post(`${this.baseUrl}/tarefas`, {
        data: { titulo: "Tarefa original ciclo 4" }
    });
    this.itemOriginal = (await response.json()).tarefa;
    this.itemTipo = "tarefas";
});

When("edito a tarefa com título novo e status inválido", async function() {
    this.ciclo4Response = await this.page.request.put(`${this.baseUrl}/tarefas/${this.itemOriginal.id}`, {
        data: { titulo: "Título que não deve permanecer", status: "invalido" }
    });
});

Then("a tarefa deve permanecer totalmente inalterada", async function() {
    const lista = await (await this.page.request.get(`${this.baseUrl}/api/tarefas`)).json();
    assert.deepEqual(lista.find(item => item.id === this.itemOriginal.id), this.itemOriginal);
});

Given("criei um evento para testar edição inválida", async function() {
    const response = await this.page.request.post(`${this.baseUrl}/eventos`, {
        data: { titulo: "Evento original ciclo 4", data: "2026-09-13" }
    });
    this.itemOriginal = (await response.json()).evento;
});

When("edito o evento com data nova e título vazio", async function() {
    this.ciclo4Response = await this.page.request.put(`${this.baseUrl}/eventos/${this.itemOriginal.id}`, {
        data: { data: "2026-12-01", titulo: "" }
    });
});

Then("o evento deve permanecer totalmente inalterado", async function() {
    const lista = await (await this.page.request.get(`${this.baseUrl}/api/eventos`)).json();
    assert.deepEqual(lista.find(item => item.id === this.itemOriginal.id), this.itemOriginal);
});

When("crio um evento com a data inexistente {string}", async function(data) {
    this.ciclo4Response = await this.page.request.post(`${this.baseUrl}/eventos`, {
        data: { titulo: "Evento com data impossível", data }
    });
});

When("consulto o resumo financeiro de setembro de 2026", async function() {
    this.ciclo4Response = await this.page.request.get(`${this.baseUrl}/api/financeiro/resumo?mes=9&ano=2026`);
});

Then("o resumo deve apresentar entradas, saídas e lucro corretos", async function() {
    const movimentos = Object.values(fixture.movimentacoes).filter(item => item.id_usuario === 1 && item.data.startsWith("2026-09-"));
    const entrada = movimentos.filter(x => x.tipo === "entrada").reduce((soma, x) => soma + x.valor, 0);
    const saida = movimentos.filter(x => x.tipo === "saida").reduce((soma, x) => soma + x.valor, 0);
    const resumo = await this.ciclo4Response.json();
    assert.equal(resumo.entrada, entrada);
    assert.equal(resumo.saida, saida);
    assert.equal(resumo.lucro, entrada - saida);
});

When("abro a página inicial monitorando erros", async function() {
    this.errosConsole = [];
    this.page.on("console", mensagem => {
        if (mensagem.type() === "error") this.errosConsole.push(mensagem.text());
    });
    this.page.on("pageerror", erro => this.errosConsole.push(erro.message));
    await this.page.goto(`${this.baseUrl}/home`);
    await this.page.locator("#nome-usuario").waitFor();
    await this.page.waitForTimeout(300);
});

Then("devo visualizar o nome do usuário na página inicial", async function() {
    assert.equal((await this.page.locator("#nome-usuario").textContent()).trim(), "Sabrina Barros");
});

Then("a página inicial não deve registrar erro ao carregar o resumo", function() {
    const errosResumo = this.errosConsole.filter(mensagem => mensagem.includes("Erro ao carregar resumo"));
    assert.deepEqual(errosResumo, []);
});

When("registro uma entrada financeira válida", async function() {
    this.ciclo4Response = await this.page.request.post(`${this.baseUrl}/api/financeiro/movimentacoes`, {
        data: { descricao: "Entrada BDD ciclo 4", valor: 99.9, tipo: "entrada", data: "2026-09-13" }
    });
    this.movimentacao = (await this.ciclo4Response.json()).movimentacao;
});

Then("a movimentação deve aparecer na lista do usuário", async function() {
    const lista = await (await this.page.request.get(`${this.baseUrl}/api/financeiro/movimentacoes`)).json();
    assert.ok(lista.some(item => item.id === this.movimentacao.id && item.id_usuario === 1));
});

When("adiciono uma entrada pela página financeira", async function() {
    await this.page.goto(`${this.baseUrl}/financeiro`);
    await this.page.locator("#descricao").fill("Entrada pela interface ciclo 4");
    await this.page.locator("#valor").fill("88.90");
    await this.page.locator("#tipo").selectOption("entrada");
    await this.page.locator("#data").fill("2026-09-13");
    await this.page.locator('#form-movimentacao button[type="submit"]').click();
});

Then("devo ver a confirmação e a movimentação na tela", async function() {
    const mensagem = this.page.locator("#mensagem-financeiro");
    await mensagem.waitFor({ state: "visible" });
    await this.page.waitForFunction(() => document.getElementById("mensagem-financeiro")?.textContent.includes("sucesso"));
    assert.match((await mensagem.textContent()).trim(), /sucesso/i);
    await this.page.getByText("Entrada pela interface ciclo 4", { exact: true }).waitFor();
});

When("registro uma movimentação financeira na data {string}", async function(data) {
    this.ciclo4Response = await this.page.request.post(`${this.baseUrl}/api/financeiro/movimentacoes`, {
        data: { descricao: "Data impossível", valor: 10, tipo: "entrada", data }
    });
});

When("pesquiso {string} na Central de Ajuda pela API", async function(termo) {
    this.termoBusca = termo;
    this.ciclo4Response = await this.page.request.get(`${this.baseUrl}/api/ajuda/busca?q=${encodeURIComponent(termo)}`);
});

When("pesquiso somente espaços na Central de Ajuda pela API", async function() {
    this.ciclo4Response = await this.page.request.get(`${this.baseUrl}/api/ajuda/busca?q=%20%20%20`);
});

Then("devo receber perguntas relacionadas ao termo pesquisado", async function() {
    const perguntas = await this.ciclo4Response.json();
    assert.ok(perguntas.length > 0);
    assert.ok(perguntas.every(item => `${item.pergunta} ${item.resposta}`.toLowerCase().includes(this.termoBusca.toLowerCase())));
});

When("abro um ticket válido pela API", async function() {
    this.ciclo4Response = await this.page.request.post(`${this.baseUrl}/api/ajuda/tickets`, {
        data: { assunto: "Ticket BDD ciclo 4", mensagem: "Preciso de ajuda com o financeiro" }
    });
    this.ticket = (await this.ciclo4Response.json()).ticket;
});

Then("o ticket deve aparecer somente para o usuário autenticado", async function() {
    const meus = await (await this.page.request.get(`${this.baseUrl}/api/ajuda/tickets`)).json();
    assert.ok(meus.some(item => item.id === this.ticket.id));
    await this.page.context().clearCookies();
    await entrar(this, "carlos@gmail.com");
    const outros = await (await this.page.request.get(`${this.baseUrl}/api/ajuda/tickets`)).json();
    assert.ok(!outros.some(item => item.id === this.ticket.id));
});

When("salvo informações válidas do meu negócio", async function() {
    this.negocio = { cnpj: "12.345.678/0001-90", nome_negocio: "Negócio BDD", situacao: "MEI Ativo" };
    this.ciclo4Response = await this.page.request.put(`${this.baseUrl}/api/negocio`, { data: this.negocio });
});

Then("as informações do negócio devem ser persistidas", async function() {
    const consulta = await (await this.page.request.get(`${this.baseUrl}/api/negocio`)).json();
    assert.equal(consulta.cnpj, this.negocio.cnpj);
    assert.equal(consulta.nome_negocio, this.negocio.nome_negocio);
    assert.deepEqual(lerBanco().negocios[1], this.negocio);
});

When("abro a página de obrigações no ciclo quatro", async function() {
    await this.page.goto(`${this.baseUrl}/obrigacoes`);
});

Then("devo visualizar as obrigações cadastradas", async function() {
    const cards = this.page.locator("#lista-obrigacoes .card-obrigacao");
    await cards.first().waitFor();
    assert.equal(await cards.count(), Object.keys(fixture.obrigacoes).length);
});

When("abro a Central de Ajuda no ciclo quatro", async function() {
    await this.page.goto(`${this.baseUrl}/suporte`);
});

Then("devo visualizar categorias e perguntas frequentes", async function() {
    await this.page.locator("#listaCategorias .cardCategoria").first().waitFor();
    await this.page.locator("#listaPerguntas li").first().waitFor();
    assert.equal(await this.page.locator("#listaCategorias .cardCategoria").count(), Object.keys(fixture.categoriasAjuda).length);
    assert.equal(await this.page.locator("#listaPerguntas li").count(), Object.keys(fixture.perguntasFrequentes).length);
});
