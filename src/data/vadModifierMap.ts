import type { RawSurveyResponse } from "../types/survey";

const clampValue = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
};

const normalizeVadScore = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }

  if (value >= 0 && value <= 1) {
    return Math.min(Math.max(Math.round(value * 100) / 100, 0), 1);
  }

  if (value >= 1 && value <= 9) {
    const normalized = (value - 1) / 8;
    return Math.min(Math.max(Math.round(normalized * 100) / 100, 0), 1);
  }

  return value < 0 ? 0 : 1;
};

function resolveValenceModifiers(value: number): string[] {
  if (value <= 0.33) {
    return ["muted", "dim", "somber"];
  }

  if (value >= 0.67) {
    return ["softly luminous", "warm", "gentle"];
  }

  return ["neutral-toned"];
}

function resolveArousalModifiers(value: number): string[] {
  if (value <= 0.33) {
    return ["still", "low-energy", "quiet"];
  }

  if (value >= 0.67) {
    return ["tense", "dynamic", "visually agitated"];
  }

  return ["subtle motion"];
}

function resolveDominanceModifiers(value: number): string[] {
  if (value <= 0.33) {
    return [
      "small-scale",
      "fragile",
      "withdrawn",
      "light-toned",
      "visually receding",
    ];
  }

  if (value >= 0.67) {
    return [
      "stable",
      "upright",
      "self-possessed",
      "deep-toned",
      "visually weighty",
    ];
  }

  return ["balanced presence", "moderately weighted"];
}

export function buildVadModifiers(vad: RawSurveyResponse["vad"]): string[] {
  const valence = normalizeVadScore(clampValue(vad.valence, 0, 9));
  const arousal = normalizeVadScore(clampValue(vad.arousal, 0, 9));
  const dominance = normalizeVadScore(clampValue(vad.dominance, 0, 9));

  return [
    ...resolveValenceModifiers(valence),
    ...resolveArousalModifiers(arousal),
    ...resolveDominanceModifiers(dominance),
  ];
}
