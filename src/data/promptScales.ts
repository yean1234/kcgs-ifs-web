export type ThreeLevel = "low" | "medium" | "high";

export const THREE_LEVEL_TO_SCORE: Record<ThreeLevel, number> = {
  low: 0.2,
  medium: 0.5,
  high: 0.8,
};

export function scoreToThreeLevel(score: number): ThreeLevel {
  if (score < 0.35) {
    return "low";
  }

  if (score < 0.65) {
    return "medium";
  }

  return "high";
}

export function averageThreeLevels(levels: readonly ThreeLevel[]): ThreeLevel {
  if (levels.length === 0) {
    return "medium";
  }

  const averageScore =
    levels.reduce((sum, level) => sum + THREE_LEVEL_TO_SCORE[level], 0) / levels.length;

  return scoreToThreeLevel(averageScore);
}
