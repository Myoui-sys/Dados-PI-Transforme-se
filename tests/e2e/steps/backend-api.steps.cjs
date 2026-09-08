const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const dbPath = path.resolve(__dirname, "../../tmp/app-under-test/db.json");
const fixture = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../db.json"), "utf8"));
const lerBanco = () => JSON.parse(fs.readFileSync(dbPath, "utf8"));

async function entrar(world, email, senha = "123456") {
    const response = await world.page.request.post(`${world.baseUrl}/login`, {
        data: { emailDigitado: email, senhaDigitada: senha }
    });
    assert.equal(response.status(), 200);
    assert.equal(await response.text(), "Login realizado com sucesso!");
}

async function editar(world, data) {
    world.perfilEnviado = data;
    world.backendResponse = await world.page.request.put(`${world.baseUrl}/api/perfil`, { data });
}

async function consultar(world, rota) {
    const response = await world.page.request.get(`${world.baseUrl}${rota}`);
    assert.equal(response.status(), 200);
    return response.json();
}

Given("que estou autenticado na API de cursos", async function() {
    await entrar(this, "sabrina@gmail.com");
});

Given("que registrei o estado atual do banco de teste", function() {
    this.bancoAntes = fs.readFileSync(dbPath);
});

When("consulto o catálogo pela API", async function() {
    this.backendResponse = await this.page.request.get(`${this.baseUrl}/api/cursos`);
});

Then("a API deve responder com status {int}", function(status) {
    assert.equal(this.backendResponse.status(), status);
});

Then("devo receber o catálogo completo em JSON", async function() {
    assert.match(this.backendResponse.headers()["content-type"], /application\/json/);
    assert.deepEqual(await this.backendResponse.json(), fixture.cursos);
});

Then("o banco de teste deve permanecer inalterado", function() {
    assert.ok(this.bancoAntes, "O cenário deve registrar o banco antes da operação");
    assert.deepEqual(fs.readFileSync(dbPath), this.bancoAntes);
});

Given("que existe um usuário exclusivo para este cenário de perfil", async function() {
    // Cada cenário altera apenas seu próprio usuário na cópia temporária.
    const email = `qa.bdd.${randomUUID()}@teste.com`;
    const cadastro = await this.page.request.post(`${this.baseUrl}/cadastro`, {
        data: { nome: "QA Perfil", sobrenome: "BDD", email, senha: "123456" }
    });
    assert.equal(cadastro.status(), 200);
    assert.equal((await cadastro.json()).sucesso, true);
    this.perfilOriginal = { nome: "QA Perfil", email, pronome: "", numero: "", cnpj: "", sobre: "" };
    await entrar(this, email);
    await editar(this, this.perfilOriginal);
    assert.equal(this.backendResponse.status(), 200);
    assert.equal((await this.backendResponse.json()).sucesso, true);
    this.usuariosAntes = lerBanco().usuarios;
    this.perfilValido = {
        nome: "QA Perfil Atualizado", email, pronome: "Ela/dela",
        numero: "85999990000", cnpj: "12345678000190", sobre: "Perfil do cenário BDD"
    };
    await this.page.context().clearCookies();
});

Given("que estou autenticado com o usuário do cenário", async function() {
    await entrar(this, this.perfilOriginal.email);
});

Given("que entrei na API com meu e-mail em maiúsculas e espaços", async function() {
    await entrar(this, ` ${this.perfilOriginal.email.toUpperCase()} `);
});

When("consulto meu perfil pela API", async function() {
    this.backendResponse = await this.page.request.get(`${this.baseUrl}/api/perfil`);
});

When("envio uma edição válida de perfil pela API", async function() {
    await editar(this, this.perfilValido);
});

When("tento alterar meu e-mail para {string}", async function(email) {
    await editar(this, { ...this.perfilValido, email });
});

When("altero meu e-mail para um novo endereço com maiúsculas e espaços", async function() {
    this.novoEmail = `qa.novo.${randomUUID()}@teste.com`;
    await editar(this, { ...this.perfilValido, email: ` ${this.novoEmail.toUpperCase()} ` });
});

When("envio uma edição de perfil sem e-mail", async function() {
    const { email, ...data } = this.perfilValido;
    await editar(this, data);
});

Then("a API deve informar o erro {string}", async function(erro) {
    assert.equal((await this.backendResponse.json()).erro, erro);
});

Then("devo receber somente os campos públicos do meu perfil", async function() {
    assert.deepEqual(await this.backendResponse.json(), this.perfilOriginal);
});

Then("a API deve bloquear a edição não autenticada", function() {
    assert.ok([400, 401, 403].includes(this.backendResponse.status()));
});

Then("a API deve bloquear o e-mail duplicado", function() {
    assert.ok([400, 401, 409].includes(this.backendResponse.status()));
});

Then("a edição do perfil deve ser confirmada", async function() {
    assert.deepEqual(await this.backendResponse.json(), { sucesso: true });
});

Then("os novos campos devem aparecer na consulta, na sessão e no banco", async function() {
    assert.deepEqual(await consultar(this, "/api/perfil"), this.perfilValido);
    const sessao = await consultar(this, "/api/usuario-logado");
    assert.equal(sessao.nome, this.perfilValido.nome);
    assert.equal(sessao.email, this.perfilValido.email);
    const { email, ...campos } = this.perfilValido;
    const usuario = lerBanco().usuarios[email];
    for (const [campo, valor] of Object.entries(campos)) assert.equal(usuario[campo], valor);
});

Then("o identificador, a senha e os outros usuários devem ser preservados", function() {
    const email = this.perfilOriginal.email;
    const usuarios = lerBanco().usuarios;
    assert.equal(usuarios[email].id_usuario, this.usuariosAntes[email].id_usuario);
    assert.equal(usuarios[email].senha, this.usuariosAntes[email].senha);
    const { [email]: atual, ...outrosAtuais } = usuarios;
    const { [email]: anterior, ...outrosAnteriores } = this.usuariosAntes;
    assert.deepEqual(outrosAtuais, outrosAnteriores);
});

Then("a sessão deve manter meu e-mail original", async function() {
    assert.equal((await consultar(this, "/api/usuario-logado")).email, this.perfilOriginal.email);
});

Then("o e-mail normalizado deve substituir a chave antiga no banco e na sessão", async function() {
    const usuarios = lerBanco().usuarios;
    assert.equal(usuarios[this.perfilOriginal.email], undefined);
    assert.equal(usuarios[this.novoEmail].id_usuario, this.usuariosAntes[this.perfilOriginal.email].id_usuario);
    assert.equal((await consultar(this, "/api/usuario-logado")).email, this.novoEmail);
    assert.deepEqual(await consultar(this, "/api/perfil"), { ...this.perfilValido, email: this.novoEmail });
});

Then("devo conseguir entrar com o novo e-mail e não com o antigo", async function() {
    await this.page.context().clearCookies();
    await entrar(this, this.novoEmail);
    await this.page.context().clearCookies();
    const response = await this.page.request.post(`${this.baseUrl}/login`, {
        data: { emailDigitado: this.perfilOriginal.email, senhaDigitada: "123456" }
    });
    assert.equal(await response.text(), "Email inválido");
    const sessao = await this.page.request.get(`${this.baseUrl}/api/usuario-logado`);
    assert.equal(sessao.status(), 401);
});
