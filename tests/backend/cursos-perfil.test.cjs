const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startApp, stopApp } = require("../support/app-under-test.cjs");

let app;
const dbPath = path.resolve(__dirname, "../../db.json");
const fixture = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const original = fs.readFileSync(dbPath);
const copyDbPath = path.resolve(__dirname, "../tmp/app-under-test/db.json");

before(async () => { app = await startApp(); });
after(async () => {
    await stopApp(app);
    assert.deepEqual(fs.readFileSync(dbPath), original, "O banco original deve ser preservado");
});

async function api(route, { method = "GET", body, cookie } = {}) {
    return fetch(`${app.baseUrl}${route}`, {
        method,
        headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
    });
}

async function login(email = "sabrina@gmail.com") {
    const response = await api("/login", { method: "POST", body: { emailDigitado: email, senhaDigitada: "123456" } });
    assert.equal(await response.text(), "Login realizado com sucesso!");
    assert.ok(response.headers.get("set-cookie"));
    return response.headers.get("set-cookie").split(";")[0];
}

const perfil = {
    nome: "Sabrina QA", email: "sabrina@gmail.com", pronome: "Ela/dela",
    numero: "85999990000", cnpj: "12345678000190", sobre: "Perfil de teste"
};

test("API cursos - GET público retorna catálogo completo em JSON", async () => {
    const response = await api("/api/cursos");
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.deepEqual(await response.json(), fixture.cursos);
});

test("API cursos - sessão autenticada recebe o mesmo catálogo", async () => {
    const response = await api("/api/cursos", { cookie: await login() });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), fixture.cursos);
});

test("API cursos - consulta não altera os dados persistidos", async () => {
    const antes = fs.readFileSync(copyDbPath);
    const response = await api("/api/cursos");
    await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(fs.readFileSync(copyDbPath), antes);
});

test("API perfil - GET sem sessão retorna 401", async () => {
    const response = await api("/api/perfil");
    assert.equal(response.status, 401);
    assert.equal((await response.json()).erro, "Não autenticado");
});

test("API perfil - GET retorna campos do próprio usuário sem senha", async () => {
    const response = await api("/api/perfil", { cookie: await login() });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        nome: fixture.usuarios[perfil.email].nome, email: perfil.email,
        pronome: "", cnpj: "", sobre: "", numero: ""
    });
});

test("API perfil - PUT sem sessão bloqueia alteração", async () => {
    const antes = fs.readFileSync(copyDbPath);
    const response = await api("/api/perfil", { method: "PUT", body: perfil });
    assert.ok([400, 401, 403].includes(response.status));
    assert.equal((await response.json()).erro, "Não autenticado");
    assert.deepEqual(fs.readFileSync(copyDbPath), antes);
});

test("API perfil - PUT atualiza campos, sessão e persistência", async () => {
    const cookie = await login();
    const response = await api("/api/perfil", { method: "PUT", body: perfil, cookie });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { sucesso: true });
    const consulta = await api("/api/perfil", { cookie });
    assert.deepEqual(await consulta.json(), perfil);
    const sessao = await (await api("/api/usuario-logado", { cookie })).json();
    assert.equal(sessao.nome, perfil.nome);
    const db = JSON.parse(fs.readFileSync(copyDbPath));
    const { email, ...campos } = perfil;
    for (const [campo, valor] of Object.entries(campos)) assert.equal(db.usuarios[email][campo], valor);
    assert.equal(db.usuarios[email].id_usuario, fixture.usuarios[email].id_usuario);
    assert.equal(db.usuarios[email].senha, fixture.usuarios[email].senha);
    assert.deepEqual(db.usuarios["carlos@gmail.com"], fixture.usuarios["carlos@gmail.com"]);
});

test("API perfil - PUT recusa e-mail de outro usuário sem persistir", async () => {
    const cookie = await login();
    const antes = fs.readFileSync(copyDbPath);
    const response = await api("/api/perfil", { method: "PUT", body: { ...perfil, email: " CARLOS@GMAIL.COM " }, cookie });
    assert.ok([400, 401, 409].includes(response.status));
    assert.equal((await response.json()).erro, "Email já está sendo utilizado.");
    assert.deepEqual(fs.readFileSync(copyDbPath), antes);
    const sessao = await (await api("/api/usuario-logado", { cookie })).json();
    assert.equal(sessao.email, perfil.email);
});

test("API perfil - troca de e-mail normaliza chave, sessão e próximo login", async () => {
    const cookie = await login();
    const email = "perfil.ciclo2@teste.com";
    try {
        const response = await api("/api/perfil", { method: "PUT", body: { ...perfil, email: " PERFIL.CICLO2@TESTE.COM " }, cookie });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).sucesso, true);
        const db = JSON.parse(fs.readFileSync(copyDbPath));
        assert.equal(db.usuarios[perfil.email], undefined);
        assert.equal(db.usuarios[email].id_usuario, 1);
        const consulta = await api("/api/perfil", { cookie });
        assert.deepEqual(await consulta.json(), { ...perfil, email });
        await login(email);
        const antigo = await api("/login", { method: "POST", body: { emailDigitado: perfil.email, senhaDigitada: "123456" } });
        assert.equal(await antigo.text(), "Email inválido");
    } finally {
        const restore = await api("/api/perfil", { method: "PUT", body: perfil, cookie });
        assert.equal(restore.status, 200);
        await restore.json();
    }
});

test("API perfil - login com maiúsculas e espaços deve permitir consultar perfil", async () => {
    const response = await api("/api/perfil", { cookie: await login(" SABRINA@GMAIL.COM ") });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).email.trim().toLowerCase(), perfil.email);
});

test("API perfil - PUT sem e-mail deve retornar 400 sem alterar banco", async () => {
    const cookie = await login();
    const antes = fs.readFileSync(copyDbPath);
    const { email, ...body } = perfil;
    const response = await api("/api/perfil", { method: "PUT", body, cookie });
    await response.text();
    assert.deepEqual(fs.readFileSync(copyDbPath), antes);
    assert.equal(response.status, 400);
});

test("API perfil - PUT deve rejeitar e-mail inválido sem persistir", async () => {
    const cookie = await login();
    const antes = fs.readFileSync(copyDbPath);
    try {
        const response = await api("/api/perfil", { method: "PUT", body: { ...perfil, email: "email-invalido" }, cookie });
        await response.text();
        assert.equal(response.status, 400);
        assert.deepEqual(fs.readFileSync(copyDbPath), antes);
    } finally {
        const restore = await api("/api/perfil", { method: "PUT", body: perfil, cookie });
        assert.equal(restore.status, 200);
        await restore.json();
    }
});
