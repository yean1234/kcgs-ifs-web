import type { PromptComparisonArtifacts } from "../types/prompt";
import type { RawSurveyResponse } from "../types/survey";
import { buildAppraisalModifiers } from "../data/appraisalModifierMap";
import { buildEmotionCarrierBasePromptText } from "../data/emotionCarrierPromptMap";
import { buildVadModifiers } from "../data/vadModifierMap";
import { buildMeshyPrompt } from "./promptConverters/meshyPrompt";

const TEXT_TO_2D_STYLES = [
  "2D object",
  "isolated object",
  "suitable for text-to-2D generation",
] as const;

export function buildEmotionCarrierBasePrompt(
  response: RawSurveyResponse,
): string {
  return buildEmotionCarrierBasePromptText(
    response.emotionCarrier.primaryCarrier,
    response.emotionCarrier.carrierType,
    response.emotionCarrier.secondaryCarrier,
  );
}

export function buildVadModifiersFromResponse(
  response: RawSurveyResponse["vad"],
): string[] {
  return buildVadModifiers(response);
}

export function buildAppraisalModifiersFromResponse(
  response: RawSurveyResponse["appraisal"],
): string[] {
  return buildAppraisalModifiers(response);
}

export function buildFinalMeshyPrompt(
  basePrompt: string,
  vadModifiers: readonly string[],
  appraisalModifiers: readonly string[],
): string {
  return buildMeshyPrompt({
    subject: basePrompt,
    modifiers: [...vadModifiers],
    styles: [...appraisalModifiers, ...TEXT_TO_2D_STYLES],
  });
}

function buildTextTo2DPrompt(
  subject: string,
  modifiers: readonly string[],
): string {
  return buildMeshyPrompt({
    subject,
    modifiers,
    styles: TEXT_TO_2D_STYLES,
  });
}

export function buildPromptComparison(
  rawSurveyResponse: RawSurveyResponse,
): PromptComparisonArtifacts {
  const emotionCarrierBasePrompt = buildEmotionCarrierBasePrompt(rawSurveyResponse);
  const vadModifiers = buildVadModifiersFromResponse(rawSurveyResponse.vad);
  const appraisalModifiers = buildAppraisalModifiersFromResponse(rawSurveyResponse.appraisal);
  const emotionCarrierOnlyPrompt = buildTextTo2DPrompt(emotionCarrierBasePrompt, []);
  const emotionCarrierVadPrompt = buildTextTo2DPrompt(emotionCarrierBasePrompt, vadModifiers);
  const emotionCarrierAppraisalPrompt = buildTextTo2DPrompt(
    emotionCarrierBasePrompt,
    appraisalModifiers,
  );
  const finalMeshyPrompt = buildFinalMeshyPrompt(
    emotionCarrierBasePrompt,
    vadModifiers,
    appraisalModifiers,
  );

  return {
    rawSurveyResponse,
    emotionCarrierBasePrompt,
    vadModifiers,
    appraisalModifiers,
    emotionCarrierOnlyPrompt,
    emotionCarrierVadPrompt,
    emotionCarrierAppraisalPrompt,
    finalMeshyPrompt,
  };
}
