import type {
  PromptComparisonArtifacts,
  ThreeDTopiaPromptPack,
  ThreeDTopiaPromptVariant,
} from "../types/prompt";

const RECOMMENDED_STAGE1_SETTINGS = {
  samples: 1,
  sampler: "ddim",
  steps: 200,
  cfgScale: 7.5,
  seed: 0,
} as const;

export function buildThreeDTopiaPromptPack(
  comparison: PromptComparisonArtifacts,
  participantId?: string,
): ThreeDTopiaPromptPack {
  const variants: ThreeDTopiaPromptVariant[] = [
    {
      id: "emotion_carrier_only",
      title: "Emotion Carrier only",
      description: "중심 형상만 반영한 3DTopia 실행용 프롬프트",
      prompt: comparison.emotionCarrierOnlyPrompt,
      addedModifiers: [],
    },
    {
      id: "emotion_carrier_vad",
      title: "Emotion Carrier + VAD",
      description: "Emotion Carrier에 VAD 시각 수식어가 추가된 프롬프트",
      prompt: comparison.emotionCarrierVadPrompt,
      addedModifiers: [...comparison.vadModifiers],
    },
    {
      id: "emotion_carrier_appraisal",
      title: "Emotion Carrier + Appraisal",
      description: "Emotion Carrier에 Appraisal 시각 수식어가 추가된 프롬프트",
      prompt: comparison.emotionCarrierAppraisalPrompt,
      addedModifiers: [...comparison.appraisalModifiers],
    },
    {
      id: "emotion_carrier_vad_appraisal",
      title: "Emotion Carrier + VAD + Appraisal",
      description: "Emotion Carrier에 VAD와 Appraisal이 모두 반영된 최종 프롬프트",
      prompt: comparison.finalMeshyPrompt,
      addedModifiers: [...comparison.vadModifiers, ...comparison.appraisalModifiers],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    participantId: participantId?.trim() || undefined,
    rawSurveyResponse: comparison.rawSurveyResponse,
    variants,
    recommendedStage1Settings: {
      samples: RECOMMENDED_STAGE1_SETTINGS.samples,
      sampler: RECOMMENDED_STAGE1_SETTINGS.sampler,
      steps: RECOMMENDED_STAGE1_SETTINGS.steps,
      cfgScale: RECOMMENDED_STAGE1_SETTINGS.cfgScale,
      seed: RECOMMENDED_STAGE1_SETTINGS.seed,
    },
  };
}

export function serializeThreeDTopiaPromptVariant(
  variant: ThreeDTopiaPromptVariant,
): string {
  return JSON.stringify(variant, null, 2);
}
