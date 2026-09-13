const fs = require("node:fs");
const path = require("node:path");
function perfil(tags, relatorio, ciclo = "ciclo-4") {
    const evidencias = path.join(__dirname, "tests", "reports", ciclo, "evidencias");
    fs.mkdirSync(evidencias, { recursive: true });
    return {
        tags,
        paths: ["tests/e2e/features/**/*.feature"],
        require: ["tests/e2e/steps/**/*.cjs"],
        format: [
            "progress",
            "summary",
            `json:${path.relative(__dirname, path.join(evidencias, relatorio)).replaceAll("\\", "/")}`
        ],
        publishQuiet: true
    };
}

module.exports = {
    ciclo3: perfil("(@ciclo3 or @perfil_api) and not @pendente", "cucumber-ciclo3.json", "ciclo-3"),
    ciclo4: perfil("@ciclo4 and not @pendente", "cucumber-ciclo4.json"),
    default: perfil("not @pendente", "cucumber-report.json"),
    aprovados: perfil("@aprovado and not @pendente", "cucumber-aprovados.json"),
    reprovados: perfil("@reprovado and not @pendente", "cucumber-reprovados.json"),
    ignorados: perfil("@ignorado", "cucumber-ignorados.json")
};
