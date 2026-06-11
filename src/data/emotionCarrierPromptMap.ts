import type { EmotionCarrierType } from "../types/survey";

const CARRIER_TYPE_FALLBACK_MAP: Record<EmotionCarrierType, string> = {
  person: "a self-described person-like figure",
  object: "a self-described object",
  place: "a self-described place-like scene",
  event: "a self-described event-like scene",
  action_state: "a self-described action-state form",
  abstract_form: "an abstract form",
  other: "a self-described carrier",
};

const LEGACY_PRIMARY_CARRIER_PROMPT_ALIASES: Record<string, string> = {
  "a cloud-like emotional form": "an emotional form",
};

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function resolvePrimaryCarrierPrompt(
  rawText: string,
  carrierType: EmotionCarrierType,
): string {
  const normalized = normalizeText(rawText);

  if (normalized in LEGACY_PRIMARY_CARRIER_PROMPT_ALIASES) {
    return LEGACY_PRIMARY_CARRIER_PROMPT_ALIASES[normalized];
  }

  if (normalized.length > 0) {
    return normalized;
  }

  return CARRIER_TYPE_FALLBACK_MAP[carrierType];
}

function resolveSecondaryCarrierPrompt(rawText: string): string {
  const normalized = normalizeText(rawText);

  return normalized.length > 0 ? normalized : "a secondary user-described element";
}

export function buildEmotionCarrierBasePromptText(
  primaryCarrier: string,
  carrierType: EmotionCarrierType,
  secondaryCarrier: string | null,
): string {
  const primaryPrompt = resolvePrimaryCarrierPrompt(primaryCarrier, carrierType);
  const secondaryPrompt = secondaryCarrier
    ? resolveSecondaryCarrierPrompt(secondaryCarrier)
    : null;

  return secondaryPrompt
    ? `${primaryPrompt} with ${secondaryPrompt}`
    : primaryPrompt;
}
