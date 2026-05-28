import type { RawSurveyResponse } from "../types/survey";

const clampScore = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(Math.round(value), min), max);
};

export function buildAppraisalModifiers(
  appraisal: RawSurveyResponse["appraisal"],
): string[] {
  const modifiers: string[] = [];
  const goalRelevance = clampScore(appraisal.goalRelevance, 1, 7);
  const goalConduciveness = clampScore(appraisal.goalConduciveness, 1, 7);
  const copingPotential = clampScore(appraisal.copingPotential, 1, 7);
  const predictability = clampScore(appraisal.predictability, 1, 7);

  if (goalRelevance <= 2) {
    modifiers.push("peripheral presence");
  } else if (goalRelevance >= 6) {
    modifiers.push("central and visually salient presence");
  }

  if (goalConduciveness <= 2) {
    modifiers.push("obstructive surrounding elements");
  } else if (goalConduciveness >= 6) {
    modifiers.push("supportive open surrounding space");
  }

  const agencyValues = Array.isArray(appraisal.agency) ? appraisal.agency : [];
  const normalizedAgencyValues = [...new Set(agencyValues)];

  if (normalizedAgencyValues.length > 1 && !normalizedAgencyValues.includes("unknown")) {
    modifiers.push("mixed causal sources implied in the scene");
  }

  normalizedAgencyValues.forEach((agency) => {
    switch (agency) {
      case "self_behavior":
        modifiers.push("self-directed origin embedded in the scene");
        break;
      case "other_person":
        modifiers.push("presence of external influence implied in the scene");
        break;
      case "situation_environment":
        modifiers.push("environmental pressure shaping the scene");
        break;
      case "chance_natural_cause":
        modifiers.push("chance occurrence or natural cause implied");
        break;
      case "unknown":
        if (normalizedAgencyValues.length === 1) {
          modifiers.push("ambiguous source of tension");
        }
        break;
    }
  });

  if (normalizedAgencyValues.length > 1 && normalizedAgencyValues.includes("unknown")) {
    modifiers.push("partially unclear causal source");
  }

  if (copingPotential <= 2) {
    modifiers.push("enclosed");
    modifiers.push("limited escape space");
  } else if (copingPotential >= 6) {
    modifiers.push("open");
    modifiers.push("accessible pathways");
  }

  if (predictability <= 2) {
    modifiers.push("uncertain");
    modifiers.push("asymmetrical");
    modifiers.push("partially obscured surroundings");
  } else if (predictability >= 6) {
    modifiers.push("ordered");
    modifiers.push("clear");
    modifiers.push("stable surroundings");
  }

  return modifiers;
}
