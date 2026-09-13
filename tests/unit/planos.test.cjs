const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('../../db.json');
const { pegarPlanoDoUsuario, usuarioTemAcesso, exigirFeature } = require('../../public/scripts/planos.js');
for (const id of [1, 2, 3]) test(`C3 regras - plano ${id} respeita todas as permissões`, () => {
    const db = structuredClone(fixture); db.usuarios['qa@teste.com'] = { id_usuario: 999, id_plano: id };
    assert.deepEqual(pegarPlanoDoUsuario(db, 999), db.planos[id]);
    for (const [feature, permitido] of Object.entries(db.planos[id].features)) assert.equal(usuarioTemAcesso(db, 999, feature), permitido);
    assert.equal(usuarioTemAcesso(db, 999, 'inexistente'), false);
});
for (const id of [undefined, 999]) test(`C3 regras - plano ausente ou inválido ${id} usa Gratuito`, () => {
    const db = structuredClone(fixture); db.usuarios.qa = { id_usuario: 999, id_plano: id };
    assert.deepEqual(pegarPlanoDoUsuario(db, 999), db.planos[1]);
    assert.deepEqual(pegarPlanoDoUsuario(db, -1), db.planos[1]);
});
for (const [plano, expected] of [[null, 401], [1, 403], [3, 200]]) test(`C3 regras - middleware com plano ${plano} retorna ${expected}`, () => {
    const db = structuredClone(fixture); db.usuarios.qa = { id_usuario: 999, id_plano: plano };
    let next = 0;
    const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    exigirFeature(db, 'suporte_prioritario')({ session: plano ? { usuario: { id_usuario: 999 } } : {} }, res, () => next++);
    assert.equal(res.code, expected); assert.equal(next, expected === 200 ? 1 : 0);
    if (expected !== 200) assert.ok(res.body.erro);
});
