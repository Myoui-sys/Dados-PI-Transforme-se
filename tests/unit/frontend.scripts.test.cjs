const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");

test("unitário - cadastro.js envia os dados para POST /cadastro em JSON", () => {
    const script = fs.readFileSync(path.join(projectRoot, "public", "scripts", "cadastro.js"), "utf8");

    assert.match(script, /fetch\("\/cadastro"/);
    assert.match(script, /method:\s*"POST"/);
    assert.match(script, /"Content-Type":\s*"application\/json"/);
});

test("unitário - login.js envia credenciais para POST /login em JSON", () => {
    const script = fs.readFileSync(path.join(projectRoot, "public", "scripts", "login.js"), "utf8");

    assert.match(script, /fetch\("\/login"/);
    assert.match(script, /method:\s*"POST"/);
    assert.match(script, /emailDigitado/);
    assert.match(script, /senhaDigitada/);
});

test("rejeitado - cursos.js deve configurar a largura da imagem com a propriedade correta", () => {
    const script = fs.readFileSync(path.join(projectRoot, "public", "scripts", "cursos.js"), "utf8");

    assert.match(script, /imagem\.width\s*=\s*200/);
    assert.doesNotMatch(script, /imagem\.widht/);
});
