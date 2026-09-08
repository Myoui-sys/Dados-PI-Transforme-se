const fs = require("node:fs");
const path = require("node:path");
const evidencias = path.join(__dirname, "tests", "reports", "ciclo-2", "evidencias");
fs.mkdirSync(evidencias, { recursive: true });

function perfil(tags, relatorio) {
    return {
        tags,
        paths: ["tests/e2e/features/**/*.feature"],
        require: ["tests/e2e/steps/**/*.cjs"],
        format: [
            "progress",
            "summary",
            `json:${path.join(evidencias, relatorio)}`
        ],
        publishQuiet: true
    };
}

module.exports = {
    default: perfil("not @pendente", "cucumber-report.json"),
    aprovados: perfil("@aprovado and not @pendente", "cucumber-aprovados.json"),
    reprovados: perfil("@reprovado and not @pendente", "cucumber-reprovados.json"),
    ignorados: perfil("@ignorado", "cucumber-ignorados.json")
};
