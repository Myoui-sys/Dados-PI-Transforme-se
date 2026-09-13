const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..", "..");
const serverPath = path.join(projectRoot, "server.js");
const dbPath = path.join(projectRoot, "db.json");

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function carregarServidorComBanco(dbFixture = JSON.parse(fs.readFileSync(dbPath, "utf8"))) {
    let db = clone(dbFixture);
    const rotas = {
        get: new Map(),
        post: new Map(),
        put: new Map(),
        delete: new Map()
    };
    const escritas = [];
    const logs = [];

    const app = {
        use() {},
        get(rota, handler) {
            rotas.get.set(rota, handler);
        },
        post(rota, ...handlers) {
            rotas.post.set(rota, async (request, response) => {
                const cadeia = handlers.flat();
                for (const middleware of cadeia.slice(0, -1)) {
                    await middleware.run(request);
                }
                return cadeia.at(-1)(request, response);
            });
        },
        put(rota, handler) {
            rotas.put.set(rota, handler);
        },
        delete(rota, handler) {
            rotas.delete.set(rota, handler);
        },
        listen(porta, callback) {
            if (callback) {
                callback();
            }

            return { close() {} };
        }
    };

    function express() {
        return app;
    }

    express.urlencoded = function() {
        return function(_request, _response, next) {
            if (next) {
                next();
            }
        };
    };

    express.json = function() {
        return function(_request, _response, next) {
            if (next) {
                next();
            }
        };
    };

    express.static = function() {
        return function(_request, _response, next) {
            if (next) {
                next();
            }
        };
    };

    const sandbox = {
        __dirname: projectRoot,
        console: {
            log(...args) {
                logs.push(args);
            }
        },
        module: { exports: {} },
        exports: {},
        process,
        require(nomeDoModulo) {
            if (nomeDoModulo === "express") {
                return express;
            }

            if (nomeDoModulo === "express-session") {
                return function() {
                    return function(_request, _response, next) {
                        if (next) {
                            next();
                        }
                    };
                };
            }

            if (nomeDoModulo === "fs") {
                return {
                    readFileSync() {
                        return JSON.stringify(db);
                    },
                    writeFileSync(caminho, conteudo) {
                        escritas.push({ caminho, conteudo });
                        db = JSON.parse(conteudo);
                    }
                };
            }

            if (nomeDoModulo === "path") {
                return path;
            }

            if (nomeDoModulo === "stream/consumers") {
                return { json() {} };
            }

            if (nomeDoModulo === "tls") {
                return { setDefaultCACertificates() {} };
            }

            if (nomeDoModulo.startsWith(".")) {
                return require(path.resolve(projectRoot, nomeDoModulo));
            }

            return require(nomeDoModulo);
        }
    };

    const codigoServidor = fs.readFileSync(serverPath, "utf8");
    vm.runInNewContext(codigoServidor, sandbox, { filename: serverPath });

    return {
        db: () => db,
        escritas,
        logs,
        rotas
    };
}

function criarResposta() {
    return {
        statusCode: 200,
        body: undefined,
        jsonBody: undefined,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        send(conteudo) {
            this.body = conteudo;
        },
        json(conteudo) {
            this.jsonBody = conteudo;
        }
    };
}

test("unitário - POST /login autentica credenciais válidas e cria sessão", async () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "sabrina@gmail.com",
            senhaDigitada: "123456"
        },
        session: {}
    };
    const response = criarResposta();

    await servidor.rotas.post.get("/login")(request, response);

    assert.equal(response.body, "Login realizado com sucesso!");
    assert.equal(request.session.usuario.nome, "Sabrina Barros");
    assert.equal(request.session.usuario.email, "sabrina@gmail.com");
});

test("unitário - POST /login rejeita e-mail inexistente", async () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "nao.existe@teste.com",
            senhaDigitada: "123456"
        },
        session: {}
    };
    const response = criarResposta();

    await servidor.rotas.post.get("/login")(request, response);

    assert.equal(response.body, "Email inválido");
    assert.equal(request.session.usuario, undefined);
});

test("unitário - POST /login rejeita senha incorreta", async () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "sabrina@gmail.com",
            senhaDigitada: "senha-errada"
        },
        session: {}
    };
    const response = criarResposta();

    await servidor.rotas.post.get("/login")(request, response);

    assert.equal(response.body, "Senha incorreta");
    assert.equal(request.session.usuario, undefined);
});

test("unitário - POST /cadastro cria usuário novo com próximo id", async () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            nome: "QA",
            sobrenome: "Automatizado",
            email: "qa.unitario@teste.com",
            senha: "123456"
        }
    };
    const response = criarResposta();

    await servidor.rotas.post.get("/cadastro")(request, response);

    assert.equal(response.jsonBody.sucesso, true);
    assert.equal(servidor.db().usuarios["qa.unitario@teste.com"].id_usuario, 6);
    assert.equal(servidor.escritas.length, 1);
});

test("unitário - POST /cadastro rejeita e-mail duplicado sem gravar banco", async () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            nome: "Sabrina",
            sobrenome: "Barros",
            email: "sabrina@gmail.com",
            senha: "123456"
        }
    };
    const response = criarResposta();

    await servidor.rotas.post.get("/cadastro")(request, response);

    assert.equal(response.jsonBody.sucesso, false);
    assert.equal(servidor.escritas.length, 0);
});

test("regressão - POST /cadastro deve validar campos obrigatórios no back-end", async () => {
    const servidor = carregarServidorComBanco();
    const response = criarResposta();

    await servidor.rotas.post.get("/cadastro")({ body: { nome: "Cadastro incompleto" } }, response);

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.jsonBody.errors.map(erro => erro.path).sort(), ["email", "senha", "sobrenome"]);
    assert.equal(servidor.escritas.length, 0);
});

test("regressão - POST /cadastro deve tratar e-mail duplicado sem diferenciar maiúsculas", async () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            nome: "Sabrina",
            sobrenome: "Barros",
            email: "SABRINA@GMAIL.COM",
            senha: "123456"
        }
    };
    const response = criarResposta();

    await servidor.rotas.post.get("/cadastro")(request, response);

    assert.equal(response.jsonBody.sucesso, false);
    assert.equal(servidor.escritas.length, 0);
});

test.skip("regressão - POST /login não deve registrar dados sensíveis no console", async () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "sabrina@gmail.com",
            senhaDigitada: "123456"
        },
        session: {}
    };

    await servidor.rotas.post.get("/login")(request, criarResposta());

    assert.equal(JSON.stringify(servidor.logs).includes("123456"), false);
});


for (const campo of ["nome", "sobrenome", "senha", "email"]) {
    test(`regressão - cadastro rejeita ${campo} inválido sem persistir`, async () => {
        const servidor = carregarServidorComBanco();
        const body = { nome: "QA", sobrenome: "Teste", senha: "123456", email: "qa@teste.com" };
        body[campo] = campo === "email" ? "email-invalido" : "";
        const response = criarResposta();
        await servidor.rotas.post.get("/cadastro")({ body }, response);
        assert.equal(response.statusCode, 400);
        assert.ok(response.jsonBody.errors.some(erro => erro.path === campo));
        assert.equal(servidor.escritas.length, 0);
    });
}

test("regressão - cadastro persiste e-mail em minúsculas", async () => {
    const servidor = carregarServidorComBanco();
    const response = criarResposta();
    await servidor.rotas.post.get("/cadastro")({ body: {
        nome: "QA", sobrenome: "Teste", senha: "123456", email: "NOVO@TESTE.COM"
    } }, response);
    assert.equal(response.jsonBody.sucesso, true);
    assert.ok(servidor.db().usuarios["novo@teste.com"]);
    assert.equal(servidor.db().usuarios["NOVO@TESTE.COM"], undefined);
});

test("regressão - login aceita e-mail com maiúsculas e espaços", async () => {
    const servidor = carregarServidorComBanco();
    const request = { body: { emailDigitado: " SABRINA@GMAIL.COM ", senhaDigitada: "123456" }, session: {} };
    const response = criarResposta();
    await servidor.rotas.post.get("/login")(request, response);
    assert.equal(response.body, "Login realizado com sucesso!");
    assert.equal(request.session.usuario.id_usuario, 1);
});

for (const rota of ["/api/tarefas", "/api/usuario-logado", "/api/perfil"]) {
    test(`unitário - ${rota} exige autenticação`, () => {
        const servidor = carregarServidorComBanco();
        const response = criarResposta();
        servidor.rotas.get.get(rota)({ session: {} }, response);
        assert.equal(response.statusCode, 401);
        assert.equal(servidor.escritas.length, 0);
    });
}

test("unitário - tarefas lista apenas registros do usuário autenticado", () => {
    const servidor = carregarServidorComBanco();
    const response = criarResposta();
    servidor.rotas.get.get("/api/tarefas")({ session: { usuario: { id_usuario: 1 } } }, response);
    assert.ok(response.jsonBody.length > 0);
    assert.ok(response.jsonBody.every(tarefa => tarefa.id_usuario === 1));
});

test("unitário - tarefas cria e exclui registro do proprietário", async () => {
    const servidor = carregarServidorComBanco();
    const session = { usuario: { id_usuario: 1 } };
    const response = criarResposta();
    await servidor.rotas.post.get("/tarefas")({ session, body: { titulo: "Teste QA" } }, response);
    assert.equal(response.jsonBody.sucesso, true);
    const tarefa = response.jsonBody.tarefa;
    assert.equal(tarefa.id_usuario, 1);
    assert.equal(tarefa.descricao, "");
    assert.ok(servidor.db().tarefas[tarefa.id]);
    const exclusao = criarResposta();
    servidor.rotas.delete.get("/tarefas/:id")({ session, params: { id: tarefa.id } }, exclusao);
    assert.equal(exclusao.jsonBody.sucesso, true);
    assert.equal(servidor.db().tarefas[tarefa.id], undefined);
    assert.equal(servidor.escritas.length, 2);
});

test("unitário - tarefas impede exclusão de registro de outra pessoa", () => {
    const servidor = carregarServidorComBanco();
    const response = criarResposta();
    servidor.rotas.delete.get("/tarefas/:id")({ session: { usuario: { id_usuario: 2 } }, params: { id: "1" } }, response);
    assert.equal(response.statusCode, 403);
    assert.ok(servidor.db().tarefas[1]);
    assert.equal(servidor.escritas.length, 0);
});
