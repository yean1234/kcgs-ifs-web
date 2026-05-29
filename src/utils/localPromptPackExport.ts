import type { ThreeDTopiaPromptPack } from "../types/prompt";

export interface DevPromptPackExportResponse {
  ok: true;
  outputDir: string;
  latestDir: string;
  files: string[];
}

export async function exportPromptPackToDevServer(
  promptPack: ThreeDTopiaPromptPack,
): Promise<DevPromptPackExportResponse> {
  const response = await fetch("/__api/export-prompt-pack", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(promptPack),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "개발 서버에 prompt pack을 저장하지 못했습니다.");
  }

  const data = (await response.json()) as DevPromptPackExportResponse;
  if (!data.ok) {
    throw new Error("개발 서버가 prompt pack 저장에 실패했습니다.");
  }

  return data;
}
