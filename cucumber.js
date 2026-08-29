module.exports = {
    default: {
        paths: ["tests/e2e/features/**/*.feature"],
        require: ["tests/e2e/steps/**/*.cjs"],
        format: [
            "progress",
            "summary",
            "json:tests/reports/cucumber-report.json"
        ],
        publishQuiet: true
    }
};
