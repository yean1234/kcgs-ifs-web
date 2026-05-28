import type { EmotionCarrierType } from "../types/survey";

const PRIMARY_CARRIER_PROMPT_MAP: Record<string, string> = {
  어린_시절의_나: "a child-like figure",
  사람_또는_캐릭터_같은_존재: "a person-like figure",
  빛·색·그림자·물체_같은_상징적_형상: "an abstract symbolic form",
  감정이_형상으로_느껴짐: "an emotion-shaped form",
  몸의_감각이_형상으로_느껴짐: "a sensation-shaped form",
  목소리_또는_문장처럼_느껴짐: "a voice-like phrase",
  여러_형태가_함께_느껴짐: "a composite form",
  아직_구체화되지_않음: "an undefined abstract form",
};

const CARRIER_TYPE_FALLBACK_MAP: Record<EmotionCarrierType, string> = {
  person: "a self-described person-like figure",
  object: "a self-described object",
  place: "a self-described place-like scene",
  event: "a self-described event-like scene",
  action_state: "a self-described action-state form",
  abstract_form: "an abstract form",
  other: "a self-described carrier",
};

const HANGUL_PATTERN = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
const LATIN_PATTERN = /[A-Za-z]/;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function slugifyKoreanLabel(label: string): string {
  return normalizeText(label).replace(/\s+/g, "_");
}

function resolveRawTextAsPrompt(
  rawText: string,
  carrierType: EmotionCarrierType,
  fallbackText?: string,
): string {
  const normalized = normalizeText(rawText);
  const mapped = PRIMARY_CARRIER_PROMPT_MAP[slugifyKoreanLabel(normalized)];

  if (mapped) {
    return mapped;
  }

  if (LATIN_PATTERN.test(normalized) && !HANGUL_PATTERN.test(normalized)) {
    return normalized;
  }

  return fallbackText ?? CARRIER_TYPE_FALLBACK_MAP[carrierType];
}

function resolveSecondaryCarrierPrompt(
  rawText: string,
  carrierType: EmotionCarrierType,
): string {
  return resolveRawTextAsPrompt(
    rawText,
    carrierType,
    "a secondary user-described element",
  );
}

export function buildEmotionCarrierBasePromptText(
  primaryCarrier: string,
  carrierType: EmotionCarrierType,
  secondaryCarrier: string | null,
): string {
  const primaryPrompt = resolveRawTextAsPrompt(primaryCarrier, carrierType);
  const secondaryPrompt = secondaryCarrier
    ? resolveSecondaryCarrierPrompt(secondaryCarrier, carrierType)
    : null;

  return secondaryPrompt
    ? `${primaryPrompt} with ${secondaryPrompt} as a secondary symbolic element`
    : primaryPrompt;
}
