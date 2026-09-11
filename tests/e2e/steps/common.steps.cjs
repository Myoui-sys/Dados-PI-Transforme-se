const assert = require("node:assert/strict");
const { Given, Then } = require("@cucumber/cucumber");

Given("que estou na página de cadastro", async function() {
    await this.page.goto(`${this.baseUrl}/cadastro`);
});

Given("que estou na página de login", async function() {
    await this.page.goto(`${this.baseUrl}/login`);
});

Given("que estou na página de cursos", async function() {
    await this.page.goto(`${this.baseUrl}/cursos`);
});

Given("que a integração de {string} ainda não está disponível", function(nomeDaIntegracao) {
    this.motivoDoPulo = `Integração de ${nomeDaIntegracao} sem rota/API implementada no back-end atual.`;
    return "skipped";
});

Then("o cenário fica documentado como pendente para integração futura", function() {
});

Given("acesso a rota pública {string}", async function(rota) {
    this.respostaDaRota = await this.page.goto(`${this.baseUrl}${rota}`);
});

Then("a resposta HTTP deve ser 200", function() {
    assert.equal(this.respostaDaRota.status(), 200);
});
