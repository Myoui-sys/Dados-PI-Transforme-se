const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startApp, stopApp } = require('../support/app-under-test.cjs');
const originalPath = path.resolve(__dirname, '../../db.json');
const original = fs.readFileSync(originalPath);
const fixture = JSON.parse(original);
const copyPath = path.resolve(__dirname, '../tmp/app-under-test/db.json');
let app, cookie, otherCookie;
const banco = () => JSON.parse(fs.readFileSync(copyPath));
async function api(route, method = 'GET', body, session = cookie) {
    return fetch(app.baseUrl + route, { method, headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(session ? { Cookie: session } : {})
    }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
}
before(async () => {
    app = await startApp();
    async function login(email) {
        const r = await api('/login', 'POST', { emailDigitado: email, senhaDigitada: '123456' }, null);
        assert.equal(await r.text(), 'Login realizado com sucesso!');
        return r.headers.get('set-cookie').split(';')[0];
    }
    cookie = await login('sabrina@gmail.com');
    otherCookie = await login('carlos@gmail.com');
});
after(async () => { await stopApp(app); assert.deepEqual(fs.readFileSync(originalPath), original); });

for (const route of ['/assinaturas', '/mentorias', '/configuracoes', '/obrigacoes', '/guias', '/visaoGeral']) {
    test(`C3 rotas - ${route} entrega HTML`, async () => {
        const r = await api(route); assert.equal(r.status, 200);
        assert.match(r.headers.get('content-type'), /text\/html/);
        assert.match(await r.text(), /<html/i);
    });
}
test('C3 mentorias - catálogo associa cada mentoria ao professor', async () => {
    const r = await api('/api/mentorias'); assert.equal(r.status, 200);
    const expected = Object.fromEntries(Object.entries(fixture.mentorias).map(([id, m]) => [id, {
        ...m, mentor: fixture.professores[m.id_professor]?.nome || 'Mentor não encontrado'
    }]));
    assert.deepEqual(await r.json(), expected);
});
test('C3 planos - catálogo público completo sem escrita', async () => {
    const antes = fs.readFileSync(copyPath);
    const r = await api('/api/planos', 'GET', undefined, null);
    assert.equal(r.status, 200); assert.deepEqual(await r.json(), fixture.planos);
    assert.deepEqual(fs.readFileSync(copyPath), antes);
});
for (const [route, method, body] of [
    ['/api/planos/atual', 'GET'], ['/api/planos/assinar', 'POST', { id_plano: 2 }],
    ['/api/eventos', 'GET'], ['/eventos', 'POST', { data: '2026-09-11', titulo: 'QA' }],
    ['/eventos/1', 'PUT', { titulo: 'QA' }], ['/eventos/1', 'DELETE'],
    ['/api/tarefas', 'GET'], ['/tarefas', 'POST', { titulo: 'QA' }],
    ['/tarefas/1', 'PUT', { titulo: 'QA' }], ['/tarefas/1', 'DELETE']
]) test(`C3 autenticação - ${method} ${route} bloqueia visitante`, async () => {
    const antes = fs.readFileSync(copyPath);
    const r = await api(route, method, body, null);
    assert.equal(r.status, 401); assert.ok((await r.json()).erro);
    assert.deepEqual(fs.readFileSync(copyPath), antes);
});
for (const id of [1, 2, 3]) test(`C3 planos - assinar plano ${id} persiste e preserva outros usuários`, async () => {
    const antes = banco();
    const r = await api('/api/planos/assinar', 'POST', { id_plano: id });
    assert.equal(r.status, 200); assert.deepEqual(await r.json(), { sucesso: true, plano: fixture.planos[id] });
    const expected = structuredClone(antes); expected.usuarios['sabrina@gmail.com'].id_plano = id;
    assert.deepEqual(banco(), expected);
});
for (const id of [999, null, 'invalido']) test(`C3 planos - rejeita plano ${id}`, async () => {
    const antes = fs.readFileSync(copyPath);
    const r = await api('/api/planos/assinar', 'POST', { id_plano: id });
    assert.equal(r.status, 400); assert.deepEqual(fs.readFileSync(copyPath), antes);
});
test('C3 planos - consulta autenticada retorna plano assinado', async () => {
    const r = await api('/api/planos/atual'); assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), fixture.planos[3]);
});
test('C3 planos - novo usuário recebe plano gratuito', async () => {
    const email = 'ciclo3.plano@teste.com';
    const cadastro = await api('/cadastro', 'POST', { nome: 'QA', sobrenome: 'Ciclo3', email, senha: '123456' }, null);
    assert.equal((await cadastro.json()).sucesso, true);
    const login = await api('/login', 'POST', { emailDigitado: email, senhaDigitada: '123456' }, null);
    const r = await api('/api/planos/atual', 'GET', undefined, login.headers.get('set-cookie').split(';')[0]);
    assert.equal(r.status, 200); assert.deepEqual(await r.json(), fixture.planos[1]);
});

for (const tipo of ['tarefas', 'eventos']) {
    const base = tipo === 'tarefas' ? { titulo: 'QA ciclo 3' } : { titulo: 'QA ciclo 3', data: '2026-09-11' };
    const field = tipo === 'tarefas' ? 'tarefa' : 'evento';
    async function criar() {
        const r = await api('/' + tipo, 'POST', base); assert.equal(r.status, 200);
        return (await r.json())[field];
    }
    test(`C3 ${tipo} - criar, listar, editar e excluir com persistência`, async () => {
        const item = await criar(); assert.equal(item.id_usuario, 1); assert.equal(item.descricao, '');
        assert.deepEqual(banco()[tipo][item.id], item);
        const changes = { titulo: 'Editado QA', descricao: 'Descrição atualizada', ...(tipo === 'tarefas' ? { status: 'concluida' } : { data: '2026-10-12' }) };
        const edit = await api(`/${tipo}/${item.id}`, 'PUT', changes);
        assert.equal(edit.status, 200); assert.deepEqual((await edit.json())[field], { ...item, ...changes });
        assert.deepEqual(banco()[tipo][item.id], { ...item, ...changes });
        const list = await (await api('/api/' + tipo)).json();
        assert.ok(list.some(x => x.id === item.id)); assert.ok(list.every(x => x.id_usuario === 1));
        const del = await api(`/${tipo}/${item.id}`, 'DELETE'); assert.equal(del.status, 200);
        assert.equal(banco()[tipo][item.id], undefined);
        assert.ok(!(await (await api('/api/' + tipo)).json()).some(x => x.id === item.id));
    });
    for (const method of ['PUT', 'DELETE']) test(`C3 ${tipo} - ${method} bloqueia outro proprietário`, async () => {
        const item = await criar(); const antes = fs.readFileSync(copyPath);
        const r = await api(`/${tipo}/${item.id}`, method, method === 'PUT' ? { titulo: 'Indevido' } : undefined, otherCookie);
        assert.equal(r.status, 403); assert.deepEqual(fs.readFileSync(copyPath), antes);
    });
    for (const method of ['PUT', 'DELETE']) test(`C3 ${tipo} - ${method} inexistente retorna 404`, async () => {
        const antes = fs.readFileSync(copyPath);
        const r = await api(`/${tipo}/999999`, method, method === 'PUT' ? base : undefined);
        assert.equal(r.status, 404); assert.deepEqual(fs.readFileSync(copyPath), antes);
    });
    test(`C3 ${tipo} - criação sem título não persiste`, async () => {
        const antes = fs.readFileSync(copyPath); const r = await api('/' + tipo, 'POST', { ...base, titulo: '' });
        assert.equal(r.status, 400); assert.deepEqual(fs.readFileSync(copyPath), antes);
    });
    test(`C3 ${tipo} - edição inválida não altera memória nem disco`, async () => {
        const item = await criar(); const antes = fs.readFileSync(copyPath);
        const body = tipo === 'tarefas' ? { titulo: 'Não deve mudar', status: 'invalido' } : { data: '2026-12-01', titulo: ' ' };
        const r = await api(`/${tipo}/${item.id}`, 'PUT', body);
        assert.equal(r.status, 400); assert.deepEqual(fs.readFileSync(copyPath), antes);
        const atual = (await (await api('/api/' + tipo)).json()).find(x => x.id === item.id);
        try { assert.deepEqual(atual, item); }
        finally { await api(`/${tipo}/${item.id}`, 'DELETE'); }
    });
}
test('C3 calendário - filtro por mês e ano e isolamento do usuário', async () => {
    const r = await api('/api/eventos?mes=9&ano=2026'); assert.equal(r.status, 200);
    const expected = Object.values(banco().eventos).filter(e => e.id_usuario === 1 && e.data.startsWith('2026-09-'));
    assert.ok(expected.length); assert.deepEqual(await r.json(), expected);
});
for (const data of ['11/09/2026', '', '2026-02-30']) test(`C3 calendário - rejeita data inválida ${JSON.stringify(data)}`, async () => {
    const antes = fs.readFileSync(copyPath);
    const r = await api('/eventos', 'POST', { data, titulo: 'Data inválida' });
    assert.equal(r.status, 400); assert.deepEqual(fs.readFileSync(copyPath), antes);
});
for (const email of [null, 123, {}, [], '', ' ', 'sem-arroba', 'a@b', 'a b@teste.com']) {
    test(`C3 regressão perfil - rejeita e-mail ${JSON.stringify(email)} e mantém sessão`, async () => {
        const antes = fs.readFileSync(copyPath);
        const r = await api('/api/perfil', 'PUT', { nome: 'Não alterar', email });
        assert.equal(r.status, 400); assert.deepEqual(fs.readFileSync(copyPath), antes);
        const session = await (await api('/api/usuario-logado')).json(); assert.equal(session.email, 'sabrina@gmail.com');
    });
}
