import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const PROJECT_ROOT = process.cwd();

function promptPackExportPlugin(): Plugin {
  return {
    name: "prompt-pack-export-plugin",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "POST" || req.url !== "/__api/export-prompt-pack") {
          next();
          return;
        }

        try {
          const body = await readRequestBody(req);
          const promptPack = JSON.parse(body) as {
            generatedAt?: string;
            participantId?: string;
            variants?: Array<{
              id: string;
              title: string;
              prompt: string;
              addedModifiers?: string[];
              description?: string;
            }>;
          };

          if (!Array.isArray(promptPack.variants) || promptPack.variants.length === 0) {
            throw new Error("prompt pack에 variants가 없습니다.");
          }

          const timestamp = new Date().toISOString().replace(/:/g, "-");
          const generatedRoot = path.join(PROJECT_ROOT, "ai_models", "inputs", "generated");
          const participantFolder = sanitizeParticipantFolder(promptPack.participantId);
          const participantRoot = path.join(generatedRoot, participantFolder);
          const outputDir = path.join(participantRoot, timestamp);
          const latestDir = path.join(participantRoot, "latest");
          await fs.mkdir(outputDir, { recursive: true });

          await fs.writeFile(
            path.join(outputDir, "prompt-pack.json"),
            JSON.stringify(promptPack, null, 2),
            "utf-8",
          );

          const files: string[] = ["prompt-pack.json"];
          for (const variant of promptPack.variants) {
            const fileName = `${variant.id}.json`;
            await fs.writeFile(
              path.join(outputDir, fileName),
              JSON.stringify(
                {
                  ...variant,
                  generatedAt: promptPack.generatedAt ?? new Date().toISOString(),
                },
                null,
                2,
              ),
              "utf-8",
            );
            files.push(fileName);
          }

          await fs.writeFile(
            path.join(outputDir, "manifest.json"),
            JSON.stringify(
              {
                generatedAt: promptPack.generatedAt ?? new Date().toISOString(),
                participantId: participantFolder,
                outputDir: path.relative(PROJECT_ROOT, outputDir),
                files,
              },
              null,
              2,
            ),
            "utf-8",
          );
          files.push("manifest.json");

          await fs.rm(latestDir, { recursive: true, force: true });
          await fs.cp(outputDir, latestDir, { recursive: true });

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify(
              {
                ok: true,
                outputDir: path.relative(PROJECT_ROOT, outputDir),
                latestDir: path.relative(PROJECT_ROOT, latestDir),
                participantId: participantFolder,
                files,
              },
              null,
              2,
            ),
          );
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify(
              {
                ok: false,
                error: error instanceof Error ? error.message : "알 수 없는 오류",
              },
              null,
              2,
            ),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), promptPackExportPlugin()],
});

async function readRequestBody(request: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function sanitizeParticipantFolder(value: string | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  const folder = normalized.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return folder || "anonymous";
}
