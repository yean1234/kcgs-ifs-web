import type { RawSurveyResponse } from "./survey";

export type ThreeDTopiaPromptVariantId =
  | "emotion_carrier_only"
  | "emotion_carrier_vad"
  | "emotion_carrier_appraisal"
  | "emotion_carrier_vad_appraisal";

export interface ThreeDTopiaPromptVariant {
  id: ThreeDTopiaPromptVariantId;
  title: string;
  prompt: string;
  addedModifiers: string[];
  description: string;
}

export interface ThreeDTopiaStage1Settings {
  samples: number;
  sampler: string;
  steps: number;
  cfgScale: number;
  seed: number;
}

export interface ThreeDTopiaPromptPack {
  generatedAt: string;
  participantId?: string;
  rawSurveyResponse: RawSurveyResponse;
  variants: ThreeDTopiaPromptVariant[];
  recommendedStage1Settings: ThreeDTopiaStage1Settings;
}

export interface PromptComparisonArtifacts {
  rawSurveyResponse: RawSurveyResponse;
  emotionCarrierBasePrompt: string;
  vadModifiers: string[];
  appraisalModifiers: string[];
  emotionCarrierOnlyPrompt: string;
  emotionCarrierVadPrompt: string;
  emotionCarrierAppraisalPrompt: string;
  finalMeshyPrompt: string;
}
