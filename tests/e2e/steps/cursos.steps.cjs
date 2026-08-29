const { Then } = require("@cucumber/cucumber");
const assert = require("node:assert/strict");

Then("devo visualizar {int} cursos listados", async function(quantidadeEsperada) {
    const cards = this.page.locator(".card-curso");
    await cards.first().waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await cards.count(), quantidadeEsperada);
});

Then("devo visualizar o curso {string} com descrição {string}", async function(titulo, descricao) {
    const card = this.page.locator(".card-curso").filter({
        hasText: titulo
    });

    await card.first().waitFor({ state: "visible", timeout: 5000 });
    await assertTexto(card.locator(".card-curso__titulo"), titulo);
    await assertTexto(card.locator(".card-curso__descricao"), descricao);
});

async function assertTexto(locator, textoEsperado) {
    assert.equal((await locator.first().textContent()).trim(), textoEsperado);
}
