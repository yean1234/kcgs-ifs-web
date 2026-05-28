#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const VARIANT_DIR_MAP = {
  emotion_carrier_only: "emotion_carrier_only",
  emotion_carrier_vad: "emotion_carrier_vad",
  emotion_carrier_appraisal: "emotion_carrier_appraisal",
  emotion_carrier_vad_appraisal: "emotion_carrier_vad_appraisal",
};

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/run-3dtopia-prompt-pack.mjs <prompt-pack.json> [--outdir <output-dir>]",
      "",
      "The script writes:",
      "  - a copy of the prompt pack JSON",
      "  - one prompt text file per variant",
      "  - a run-stage1.sh script for local 3DTopia execution",
    ].join("\n"),
  );
}

function readArg(flagName, args) {
  const flagIndex = args.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }

  const value = args[flagIndex + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flagName}`);
  }

  return value;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  const inputPath = path.resolve(process.cwd(), args[0]);
  const outdirArg = readArg("--outdir", args);
  const outputDir = path.resolve(
    process.cwd(),
    outdirArg ?? `threeDtopia-export-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );

  const rawText = await fs.readFile(inputPath, "utf8");
  const promptPack = JSON.parse(rawText);

  if (!Array.isArray(promptPack?.variants) || promptPack.variants.length === 0) {
    throw new Error("Prompt pack does not contain any variants.");
  }

  const promptDir = path.join(outputDir, "prompts");
  await fs.mkdir(promptDir, { recursive: true });

  await fs.writeFile(
    path.join(outputDir, "prompt-pack.json"),
    JSON.stringify(promptPack, null, 2),
    "utf8",
  );

  const stage1Settings = promptPack.recommendedStage1Settings ?? {
    samples: 1,
    sampler: "ddim",
    steps: 200,
    cfgScale: 7.5,
    seed: 0,
  };

  const scriptLines = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    'THREEDTOPIA_REPO="${THREEDTOPIA_REPO:-/path/to/3DTopia}"',
    'if [ ! -d "$THREEDTOPIA_REPO" ]; then',
    '  echo "Set THREEDTOPIA_REPO to your local 3DTopia repository path."',
    "  exit 1",
    "fi",
    "",
    'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
    'PROMPT_DIR="$SCRIPT_DIR/prompts"',
    "",
    'cd "$THREEDTOPIA_REPO"',
    "",
  ];

  for (const variant of promptPack.variants) {
    const variantDir =
      VARIANT_DIR_MAP[variant.id] ?? String(variant.id).replace(/[^a-z0-9]+/gi, "_");
    const promptFileName = `${variantDir}.txt`;
    const promptPath = path.join(promptDir, promptFileName);

    await fs.writeFile(promptPath, `${variant.prompt.trim()}\n`, "utf8");

    scriptLines.push(`# ${variant.title}`);
    scriptLines.push(
      [
        "python -u sample_stage1.py",
        `  --text "$(cat \"$PROMPT_DIR/${promptFileName}\")"`,
        `  --samples ${stage1Settings.samples}`,
        `  --sampler ${stage1Settings.sampler}`,
        `  --steps ${stage1Settings.steps}`,
        `  --cfg_scale ${stage1Settings.cfgScale}`,
        `  --seed ${stage1Settings.seed}`,
        `  --test_folder "results/${variantDir}"`,
      ].join(" \\\n"),
    );
    scriptLines.push("");
    scriptLines.push(`# Stage2 refinement template for ${variant.title}`);
    scriptLines.push(`# Choose one candidate mesh from results/${variantDir}/stage1/ and then run:`);
    scriptLines.push(
      `# threefiner sd --mesh results/${variantDir}/stage1/<selected>.ply --prompt "$(cat "$PROMPT_DIR/${promptFileName}")" --text_dir --front_dir='-y' --outdir results/${variantDir}/stage2/ --save <selected>_sd.glb`,
    );
    scriptLines.push(
      `# threefiner if2 --mesh results/${variantDir}/stage2/<selected>_sd.glb --prompt "$(cat "$PROMPT_DIR/${promptFileName}")" --outdir results/${variantDir}/stage2/ --save <selected>_if2.glb`,
    );
    scriptLines.push("");
  }

  await fs.writeFile(path.join(outputDir, "run-stage1.sh"), `${scriptLines.join("\n")}\n`, "utf8");
  await fs.chmod(path.join(outputDir, "run-stage1.sh"), 0o755);

  console.log(`Wrote 3DTopia prompt pack to: ${outputDir}`);
  console.log(`- ${path.join(outputDir, "prompt-pack.json")}`);
  console.log(`- ${path.join(outputDir, "run-stage1.sh")}`);
  console.log(`- ${promptDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
