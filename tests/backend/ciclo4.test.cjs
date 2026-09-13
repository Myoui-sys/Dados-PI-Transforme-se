const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startApp, stopApp } = require("../support/app-under-test.cjs");

const originalPath = path.resolve(__dirname, "../../db.json");
const original = fs.readFileSync(originalPath);
const fixture = JSON.parse(original);
const copyPath = path.resolve(__dirname, "../tmp/app-under-test/db.json");

let app;
let cookie;
let otherCookie;

function banco() {
    return JSON.parse(fs.readFileSync(copyPath, "utf8"));
}

async function api(route, method = "GET", body, session = cookie) {
    return fetch(app.baseUrl + route, {
        method,
        headers: {
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...(session ? { Cookie: session } : {})
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
}

async function login(email) {
    const response = await api("/login", "POST", {
        emailDigitado: email,
        senhaDigitada: "123456"
    }, null);
    assert.equal(await response.text(), "Login realizado com sucesso!");
    return response.headers.get("set-cookie").split(";")[0];
}

before(async () => {
    app = await startApp();
    cookie = await login("sabrina@gmail.com");
    otherCookie = await login("carlos@gmail.com");
});

after(async () => {
    await stopApp(app);
    assert.deepEqual(fs.readFileSync(originalPath), original, "O db.json original deve permanecer inalterado");
});

for (const route of ["/home", "/financeiro", "/suporte", "/obrigacoes", "/visaoGeral"]) {
    test(`C4 página - ${route} entrega HTML não vazio`, async () => {
        const response = await api(route, "GET", undefined, null);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type"), /text\/html/);
        assert.match(await response.text(), /<html/i);
    });
}

test("C4 regressão C3-01 - plano atual responde após correção da importação", async () => {
    const response = await api("/api/planos/atual");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id_plano, fixture.usuarios["sabrina@gmail.com"].id_plano);
});

for (const [method, route, body] of [
    ["GET", "/api/financeiro/resumo?mes=9&ano=2026"],
    ["GET", "/api/financeiro/movimentacoes"],
    ["POST", "/api/financeiro/movimentacoes", { descricao: "QA", valor: 10, tipo: "entrada", data: "2026-09-13" }],
    ["DELETE", "/api/financeiro/movimentacoes/1"]
]) {
    test(`C4 financeiro - ${method} ${route} bloqueia visitante`, async () => {
        const antes = fs.readFileSync(copyPath);
        const response = await api(route, method, body, null);
        assert.equal(response.status, 401);
        assert.equal((await response.json()).erro, "Não autenticado");
        assert.deepEqual(fs.readFileSync(copyPath), antes);
    });
}

test("C4 financeiro - resumo calcula entradas, saídas, lucro e percentuais", async () => {
    const movimentos = Object.values(fixture.movimentacoes).filter(item =>
        item.id_usuario === 1 && item.data.startsWith("2026-09-")
    );
    const entrada = movimentos.filter(x => x.tipo === "entrada").reduce((soma, x) => soma + x.valor, 0);
    const saida = movimentos.filter(x => x.tipo === "saida").reduce((soma, x) => soma + x.valor, 0);
    const total = entrada + saida;
    const response = await api("/api/financeiro/resumo?mes=9&ano=2026");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        mes: 9,
        ano: 2026,
        entrada,
        saida,
        lucro: entrada - saida,
        total_movimentado: total,
        percentual_entradas: Number(((entrada / total) * 100).toFixed(2)),
        percentual_saidas: Number(((saida / total) * 100).toFixed(2))
    });
});

test("C4 integração Home - resumo fornece comparação com o mês anterior", async () => {
    const response = await api("/api/financeiro/resumo?mes=9&ano=2026");
    assert.equal(response.status, 200);
    const resumo = await response.json();
    assert.equal(typeof resumo.comparacao_mes_anterior, "object");
    assert.equal(typeof resumo.comparacao_mes_anterior.entrada, "number");
    assert.equal(typeof resumo.comparacao_mes_anterior.saida, "number");
});

test("C4 financeiro - resumo isola movimentações de outro usuário", async () => {
    const response = await api("/api/financeiro/resumo?mes=9&ano=2026", "GET", undefined, otherCookie);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        mes: 9, ano: 2026, entrada: 0, saida: 0, lucro: 0,
        total_movimentado: 0, percentual_entradas: 0, percentual_saidas: 0
    });
});

for (const route of [
    "/api/financeiro/resumo?mes=13&ano=2026",
    "/api/financeiro/resumo?mes=9&ano=abc"
]) {
    test(`C4 financeiro - resumo rejeita filtro inválido ${route}`, async () => {
        const response = await api(route);
        assert.equal(response.status, 400);
    });
}

test("C4 financeiro - lista filtra proprietário, tipo e ordena por data", async () => {
    const response = await api("/api/financeiro/movimentacoes?mes=9&ano=2026&tipo=entrada");
    assert.equal(response.status, 200);
    const lista = await response.json();
    assert.ok(lista.length > 0);
    assert.ok(lista.every(item => item.id_usuario === 1 && item.tipo === "entrada" && item.data.startsWith("2026-09-")));
    assert.deepEqual(lista.map(item => item.data), [...lista].map(item => item.data).sort().reverse());
});

test("C4 financeiro - lista rejeita tipo inválido", async () => {
    const response = await api("/api/financeiro/movimentacoes?tipo=credito");
    assert.equal(response.status, 400);
});

test("C4 financeiro - cria e exclui movimentação própria com persistência", async () => {
    const response = await api("/api/financeiro/movimentacoes", "POST", {
        descricao: "  Venda ciclo 4  ", valor: "125.50", tipo: "entrada", data: "2026-09-13"
    });
    assert.equal(response.status, 201);
    const criada = (await response.json()).movimentacao;
    assert.equal(criada.descricao, "Venda ciclo 4");
    assert.equal(criada.valor, 125.5);
    assert.equal(criada.id_usuario, 1);
    assert.deepEqual(banco().movimentacoes[criada.id], criada);

    const exclusao = await api(`/api/financeiro/movimentacoes/${criada.id}`, "DELETE");
    assert.equal(exclusao.status, 200);
    assert.equal(banco().movimentacoes[criada.id], undefined);
});

for (const body of [
    { descricao: "", valor: 10, tipo: "entrada", data: "2026-09-13" },
    { descricao: "QA", valor: 0, tipo: "entrada", data: "2026-09-13" },
    { descricao: "QA", valor: 10, tipo: "credito", data: "2026-09-13" },
    { descricao: "QA", valor: 10, tipo: "entrada", data: "13/09/2026" }
]) {
    test(`C4 financeiro - rejeita movimentação inválida ${JSON.stringify(body)}`, async () => {
        const antes = fs.readFileSync(copyPath);
        const response = await api("/api/financeiro/movimentacoes", "POST", body);
        assert.equal(response.status, 400);
        assert.deepEqual(fs.readFileSync(copyPath), antes);
    });
}

test("C4 financeiro - rejeita data inexistente no calendário", async () => {
    const antes = fs.readFileSync(copyPath);
    const response = await api("/api/financeiro/movimentacoes", "POST", {
        descricao: "Data impossível", valor: 10, tipo: "entrada", data: "2026-02-30"
    });
    assert.equal(response.status, 400);
    assert.deepEqual(fs.readFileSync(copyPath), antes);
});

test("C4 financeiro - descrição não textual retorna erro de validação", async () => {
    const antes = fs.readFileSync(copyPath);
    const response = await api("/api/financeiro/movimentacoes", "POST", {
        descricao: { texto: "QA" }, valor: 10, tipo: "entrada", data: "2026-09-13"
    });
    assert.equal(response.status, 400);
    assert.deepEqual(fs.readFileSync(copyPath), antes);
});

test("C4 financeiro - outro usuário não pode excluir movimentação alheia", async () => {
    const criada = (await (await api("/api/financeiro/movimentacoes", "POST", {
        descricao: "Protegida", valor: 10, tipo: "saida", data: "2026-09-13"
    })).json()).movimentacao;
    const antes = fs.readFileSync(copyPath);
    const response = await api(`/api/financeiro/movimentacoes/${criada.id}`, "DELETE", undefined, otherCookie);
    assert.equal(response.status, 403);
    assert.deepEqual(fs.readFileSync(copyPath), antes);
});

test("C4 financeiro - excluir identificador inexistente retorna 404", async () => {
    const response = await api("/api/financeiro/movimentacoes/999999", "DELETE");
    assert.equal(response.status, 404);
});

test("C4 Meu MEI - consulta de negócio exige autenticação", async () => {
    const response = await api("/api/negocio", "GET", undefined, null);
    assert.equal(response.status, 401);
});

test("C4 Meu MEI - usuário sem negócio recebe estrutura vazia", async () => {
    const response = await api("/api/negocio");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        nome_usuario: fixture.usuarios["sabrina@gmail.com"].nome,
        cnpj: "", nome_negocio: "", situacao: ""
    });
});

test("C4 Meu MEI - salva e consulta negócio do usuário", async () => {
    const dados = { cnpj: "12.345.678/0001-90", nome_negocio: "QA Integrador", situacao: "MEI Ativo" };
    const response = await api("/api/negocio", "PUT", dados);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { sucesso: true });
    assert.deepEqual(banco().negocios[1], dados);
    const consulta = await api("/api/negocio");
    assert.deepEqual(await consulta.json(), { nome_usuario: fixture.usuarios["sabrina@gmail.com"].nome, ...dados });
});

test("C4 Meu MEI - rejeita negócio incompleto sem persistir", async () => {
    const antes = fs.readFileSync(copyPath);
    const response = await api("/api/negocio", "PUT", { cnpj: "", nome_negocio: "QA", situacao: "MEI Ativo" });
    assert.equal(response.status, 400);
    assert.deepEqual(fs.readFileSync(copyPath), antes);
});

test("C4 obrigações - catálogo público corresponde ao db.json", async () => {
    const response = await api("/api/obrigacoes", "GET", undefined, null);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), fixture.obrigacoes);
});

test("C4 obrigações - alteração exige autenticação", async () => {
    const response = await api("/api/obrigacoes/1", "PUT", { status: "Concluida" }, null);
    assert.equal(response.status, 401);
});

test("C4 obrigações - rejeita status inválido sem persistir", async () => {
    const antes = fs.readFileSync(copyPath);
    const response = await api("/api/obrigacoes/1", "PUT", { status: "Cancelada" });
    assert.equal(response.status, 400);
    assert.deepEqual(fs.readFileSync(copyPath), antes);
});

test("C4 obrigações - atualiza status válido com persistência", async () => {
    const response = await api("/api/obrigacoes/1", "PUT", { status: "Concluida" });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).obrigacao.status, "Concluida");
    assert.equal(banco().obrigacoes[1].status, "Concluida");
});

test("C4 ajuda - lista categorias e filtra perguntas", async () => {
    const categorias = await api("/api/ajuda/categorias", "GET", undefined, null);
    assert.equal(categorias.status, 200);
    assert.deepEqual(await categorias.json(), Object.values(fixture.categoriasAjuda));

    const perguntas = await api("/api/ajuda/perguntas?categoria=2", "GET", undefined, null);
    assert.equal(perguntas.status, 200);
    assert.ok((await perguntas.json()).every(item => item.id_categoria === 2));
});

test("C4 ajuda - busca encontra termo sem diferenciar maiúsculas", async () => {
    const response = await api("/api/ajuda/busca?q=FINANCEIRO", "GET", undefined, null);
    assert.equal(response.status, 200);
    const perguntas = await response.json();
    assert.ok(perguntas.length > 0);
    assert.ok(perguntas.every(item => `${item.pergunta} ${item.resposta}`.toLowerCase().includes("financeiro")));
});

test("C4 ajuda - busca composta apenas por espaços deve ser rejeitada", async () => {
    const response = await api("/api/ajuda/busca?q=%20%20%20", "GET", undefined, null);
    assert.equal(response.status, 400);
});

for (const [method, body] of [
    ["GET", undefined],
    ["POST", { assunto: "QA", mensagem: "Teste" }]
]) {
    test(`C4 ajuda - ${method} tickets bloqueia visitante`, async () => {
        const response = await api("/api/ajuda/tickets", method, body, null);
        assert.equal(response.status, 401);
    });
}

test("C4 ajuda - cria ticket e lista somente para o proprietário", async () => {
    const response = await api("/api/ajuda/tickets", "POST", {
        assunto: "Dúvida do ciclo 4", mensagem: "Como utilizar o financeiro?"
    });
    assert.equal(response.status, 200);
    const ticket = (await response.json()).ticket;
    assert.equal(ticket.id_usuario, 1);
    assert.equal(ticket.status, "aberto");
    assert.deepEqual(banco().tickets[ticket.id], ticket);

    const meus = await (await api("/api/ajuda/tickets")).json();
    const outros = await (await api("/api/ajuda/tickets", "GET", undefined, otherCookie)).json();
    assert.ok(meus.some(item => item.id === ticket.id));
    assert.ok(!outros.some(item => item.id === ticket.id));
});

for (const body of [
    { assunto: "", mensagem: "Mensagem" },
    { assunto: "Assunto", mensagem: " " }
]) {
    test(`C4 ajuda - rejeita ticket incompleto ${JSON.stringify(body)}`, async () => {
        const antes = fs.readFileSync(copyPath);
        const response = await api("/api/ajuda/tickets", "POST", body);
        assert.equal(response.status, 400);
        assert.deepEqual(fs.readFileSync(copyPath), antes);
    });
}

test("C4 integração pendente - guias não possui coleção no banco", {
    skip: "A página existe, mas db.json não contém a coleção guias; integrar antes de validar /api/guias"
}, () => {});

test("C4 integração pendente - calendário definitivo está vazio", {
    skip: "public/Atividades/Calendário/index.html está vazio; a API de eventos foi testada separadamente"
}, () => {});

test("C4 integração pendente - lembretes ainda não foi implementado", {
    skip: "public/Atividades/Lembretes/index.html está vazio e não há API de lembretes"
}, () => {});
