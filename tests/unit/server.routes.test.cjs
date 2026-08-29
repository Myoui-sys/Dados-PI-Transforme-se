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
        post: new Map()
    };
    const escritas = [];
    const logs = [];

    const app = {
        use() {},
        get(rota, handler) {
            rotas.get.set(rota, handler);
        },
        post(rota, handler) {
            rotas.post.set(rota, handler);
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

test("unitário - POST /login autentica credenciais válidas e cria sessão", () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "sabrina@gmail.com",
            senhaDigitada: "123456"
        },
        session: {}
    };
    const response = criarResposta();

    servidor.rotas.post.get("/login")(request, response);

    assert.equal(response.body, "Login realizado com sucesso!");
    assert.equal(request.session.usuario.nome, "Sabrina Barros");
    assert.equal(request.session.usuario.email, "sabrina@gmail.com");
});

test("unitário - POST /login rejeita e-mail inexistente", () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "nao.existe@teste.com",
            senhaDigitada: "123456"
        },
        session: {}
    };
    const response = criarResposta();

    servidor.rotas.post.get("/login")(request, response);

    assert.equal(response.body, "Email inválido");
    assert.equal(request.session.usuario, undefined);
});

test("unitário - POST /login rejeita senha incorreta", () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "sabrina@gmail.com",
            senhaDigitada: "senha-errada"
        },
        session: {}
    };
    const response = criarResposta();

    servidor.rotas.post.get("/login")(request, response);

    assert.equal(response.body, "Senha incorreta");
    assert.equal(request.session.usuario, undefined);
});

test("unitário - POST /cadastro cria usuário novo com próximo id", () => {
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

    servidor.rotas.post.get("/cadastro")(request, response);

    assert.equal(response.jsonBody.sucesso, true);
    assert.equal(servidor.db().usuarios["qa.unitario@teste.com"].id_usuario, 6);
    assert.equal(servidor.escritas.length, 1);
});

test("unitário - POST /cadastro rejeita e-mail duplicado sem gravar banco", () => {
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

    servidor.rotas.post.get("/cadastro")(request, response);

    assert.equal(response.jsonBody.sucesso, false);
    assert.equal(servidor.escritas.length, 0);
});

test("rejeitado - POST /cadastro deve validar campos obrigatórios no back-end", () => {
    const servidor = carregarServidorComBanco();
    const response = criarResposta();

    servidor.rotas.post.get("/cadastro")({ body: { nome: "Cadastro incompleto" } }, response);

    assert.deepEqual(response.jsonBody, { sucesso: false });
    assert.equal(servidor.escritas.length, 0);
});

test("rejeitado - POST /cadastro deve tratar e-mail duplicado sem diferenciar maiúsculas", () => {
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

    servidor.rotas.post.get("/cadastro")(request, response);

    assert.deepEqual(response.jsonBody, { sucesso: false });
    assert.equal(servidor.escritas.length, 0);
});

test("rejeitado - POST /login não deve registrar dados sensíveis no console", () => {
    const servidor = carregarServidorComBanco();
    const request = {
        body: {
            emailDigitado: "sabrina@gmail.com",
            senhaDigitada: "123456"
        },
        session: {}
    };

    servidor.rotas.post.get("/login")(request, criarResposta());

    assert.equal(JSON.stringify(servidor.logs).includes("123456"), false);
});
