const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..", "..");
const tempRoot = path.join(projectRoot, "tests", "tmp", "app-under-test");

function copyRecursive(origin, destination) {
    const stats = fs.statSync(origin);

    if (stats.isDirectory()) {
        fs.mkdirSync(destination, { recursive: true });

        for (const item of fs.readdirSync(origin)) {
            copyRecursive(path.join(origin, item), path.join(destination, item));
        }

        return;
    }

    fs.copyFileSync(origin, destination);
}

function prepareAppCopy() {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fs.mkdirSync(tempRoot, { recursive: true });

    copyRecursive(path.join(projectRoot, "public"), path.join(tempRoot, "public"));
    fs.copyFileSync(path.join(projectRoot, "db.json"), path.join(tempRoot, "db.json"));

    const serverSource = fs.readFileSync(path.join(projectRoot, "server.js"), "utf8");
    const serverWithDynamicPort = serverSource.replace(
        /app\.listen\(3000,\s*function\(\)\s*\{/,
        "app.listen(process.env.PORT || 3000, function(){"
    );

    fs.writeFileSync(path.join(tempRoot, "server.js"), serverWithDynamicPort);
}

function waitForServer(baseUrl, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;

    return new Promise((resolve, reject) => {
        function attempt() {
            const request = http.get(`${baseUrl}/api/cursos`, (response) => {
                response.resume();

                if (response.statusCode === 200) {
                    resolve();
                    return;
                }

                retry();
            });

            request.on("error", retry);
            request.setTimeout(1000, () => {
                request.destroy();
                retry();
            });
        }

        function retry() {
            if (Date.now() > deadline) {
                reject(new Error(`Servidor de teste não respondeu em ${baseUrl}`));
                return;
            }

            setTimeout(attempt, 200);
        }

        attempt();
    });
}

async function startApp() {
    const port = Number(process.env.QA_PORT || 3137);
    const baseUrl = `http://127.0.0.1:${port}`;
    const logs = [];

    prepareAppCopy();

    const serverProcess = spawn(process.execPath, ["server.js"], {
        cwd: tempRoot,
        env: {
            ...process.env,
            PORT: String(port)
        },
        stdio: ["ignore", "pipe", "pipe"]
    });

    serverProcess.stdout.on("data", (chunk) => logs.push(chunk.toString()));
    serverProcess.stderr.on("data", (chunk) => logs.push(chunk.toString()));

    try {
        await waitForServer(baseUrl);
    } catch (error) {
        serverProcess.kill();
        throw new Error(`${error.message}\nLogs:\n${logs.join("")}`);
    }

    return {
        baseUrl,
        process: serverProcess,
        logs: () => logs.join("")
    };
}

async function stopApp(appHandle) {
    if (!appHandle || !appHandle.process || appHandle.process.killed) {
        return;
    }

    await new Promise((resolve) => {
        appHandle.process.once("exit", resolve);
        appHandle.process.kill();
        setTimeout(resolve, 1000);
    });

    fs.rmSync(path.join(projectRoot, "tests", "tmp"), { recursive: true, force: true });
}

module.exports = {
    startApp,
    stopApp
};
