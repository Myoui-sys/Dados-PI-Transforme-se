const { When, Then } = require("@cucumber/cucumber");
const assert = require("node:assert/strict");

When("faço login com email {string} e senha {string}", async function(email, senha) {
    await this.page.locator('input[name="emailDigitado"]').fill(email);
    await this.page.locator('input[name="senhaDigitada"]').fill(senha);
    await this.page.locator('button[type="submit"]').click();
});

Then("devo ser redirecionado para a página de cursos", async function() {
    await this.page.waitForURL("**/cursos", { timeout: 5000 });
    assert.match(this.page.url(), /\/cursos$/);
});

Then("devo ver a mensagem de login {string}", async function(mensagemEsperada) {
    const mensagem = this.page.locator("#loginMensagem");
    await mensagem.waitFor({ state: "visible", timeout: 5000 });
    assert.equal((await mensagem.textContent()).trim(), mensagemEsperada);
});

Then("a sessão deve identificar o usuário {string} com email {string}", async function(nome, email) {
    const cookies = await this.page.context().cookies(this.baseUrl);
    const cookieHeader = cookies.map(function(cookie) {
        return `${cookie.name}=${cookie.value}`;
    }).join("; ");

    const response = await this.page.request.get(`${this.baseUrl}/api/usuario-logado`, {
        headers: {
            Cookie: cookieHeader
        }
    });
    const usuario = await response.json();

    assert.equal(response.status(), 200);
    assert.equal(usuario.nome, nome);
    assert.equal(usuario.email, email);
});
