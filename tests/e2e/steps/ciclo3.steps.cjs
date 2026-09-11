const { When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const fixture = require('../../../db.json');
When('abro a tela de assinaturas sem entrar', async function() {
    await this.page.goto(this.baseUrl + '/assinaturas');
});
When('abro a tela de assinaturas', async function() {
    await this.page.goto(this.baseUrl + '/assinaturas');
});
Then('vejo os planos em ordem de preço e o aviso de login', async function() {
    await this.page.locator('.cardPlano').first().waitFor();
    assert.equal(await this.page.locator('#mensagemLogin').isVisible(), true);
    const planos = Object.values(fixture.planos).sort((a, b) => a.preco - b.preco);
    assert.deepEqual(await this.page.locator('.cardPlano h3').allTextContents(), planos.map(p => p.nome));
    assert.deepEqual(await this.page.locator('.preco').allTextContents(), planos.map(p => p.preco === 0 ? 'R$ 0/mês' : 'R$ ' + p.preco.toFixed(2).replace('.', ',') + '/mês'));
});
Then('vejo meu plano atual e posso assinar o Premium', async function() {
    await this.page.locator('.badge.atual').waitFor({ timeout: 5000 });
    assert.equal(await this.page.locator('.btnAssinar:disabled').count(), 1);
    await this.page.locator('.btnAssinar[data-id-plano="2"]').click();
    await this.page.locator('.btnAssinar[data-id-plano="2"]:disabled').waitFor();
    const r = await this.page.request.get(this.baseUrl + '/api/planos/atual');
    assert.equal(r.status(), 200); assert.equal((await r.json()).id_plano, 2);
});
When('abro o catálogo de cursos do ciclo três', async function() {
    await this.page.goto(this.baseUrl + '/cursos');
});
Then('todas as imagens dos cursos têm largura de 200 pixels', async function() {
    const images = this.page.locator('#lista-de-cursos .card-curso__imagem');
    await images.first().waitFor();
    assert.equal(await images.count(), Object.keys(fixture.cursos).length);
    assert.ok((await images.evaluateAll(items => items.map(i => i.width))).every(w => w === 200));
});
