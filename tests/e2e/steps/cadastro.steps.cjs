const { When, Then } = require("@cucumber/cucumber");
const assert = require("node:assert/strict");

When("preencho o cadastro com nome {string}, sobrenome {string}, email {string} e senha {string}", async function(nome, sobrenome, email, senha) {
    await this.page.locator('input[name="nome"]').fill(nome);
    await this.page.locator('input[name="sobrenome"]').fill(sobrenome);
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="senha"]').fill(senha);
});

When("envio o formulário de cadastro", async function() {
    await this.page.locator('button[type="submit"]').click();
});

When("envio um cadastro incompleto diretamente para a API", async function() {
    this.apiResponse = await this.page.request.post(`${this.baseUrl}/cadastro`, {
        data: {
            nome: "QA sem dados obrigatórios"
        }
    });
    this.apiBody = await this.apiResponse.json();
});

Then("devo ver a mensagem de cadastro {string}", async function(mensagemEsperada) {
    await assertMensagem(this.page.locator("#mensagem"), mensagemEsperada);
});

Then("a API de cadastro deve rejeitar a solicitação", async function() {
    assert.equal(this.apiResponse.status(), 400);
    assert.deepEqual(this.apiBody.errors.map(erro => erro.path).sort(), ["email", "senha", "sobrenome"]);
});

Then("devo ser redirecionado para a página de login", async function() {
    await this.page.waitForURL("**/login", { timeout: 5000 });
    assert.match(this.page.url(), /\/login$/);
});

async function assertMensagem(locator, mensagemEsperada) {
    await locator.waitFor({ state: "visible", timeout: 5000 });
    const mensagemAtual = await locator.textContent();
    assert.equal(mensagemAtual.trim(), mensagemEsperada);
}
