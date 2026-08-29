const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const db = JSON.parse(fs.readFileSync(path.join(projectRoot, "db.json"), "utf8"));

test("unitário - db.json possui coleções principais", () => {
    assert.ok(db.usuarios);
    assert.ok(db.cursos);
    assert.ok(db.professores);
    assert.ok(db.tarefas);
    assert.ok(db.saldos);
});

test("unitário - cursos possuem campos obrigatórios para renderização", () => {
    for (const curso of Object.values(db.cursos)) {
        assert.ok(curso.id_curso);
        assert.ok(curso.nome);
        assert.ok(curso.descricao);
        assert.ok(curso.carga_horaria);
        assert.ok(curso.preco);
        assert.ok(curso.imagem);
    }
});

test("unitário - imagens dos cursos existem na pasta pública", () => {
    for (const curso of Object.values(db.cursos)) {
        const caminhoImagem = path.join(projectRoot, "public", "images", "cursos", curso.imagem);
        assert.equal(fs.existsSync(caminhoImagem), true, `Imagem não encontrada: ${curso.imagem}`);
    }
});

test("unitário - cursos referenciam professores existentes", () => {
    for (const curso of Object.values(db.cursos)) {
        assert.ok(db.professores[String(curso.id_professor)], `Professor ${curso.id_professor} não existe`);
    }
});
