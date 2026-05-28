import {
  ALL_QUESTION_IDS,
  EMPTY_ANSWER_TEMPLATE,
  QUESTION_DEFINITIONS,
} from "../data/surveyFlow";
import type {
  AnswerMap,
  AnswerRecord,
  FindInitialResponse,
  EmotionCarrierType,
  FocusLocation,
  QuestionId,
  RawSurveyResponse,
  SurveyQuestion,
} from "../types/survey";

const BLANK_ANSWER = (): AnswerRecord => ({
  selectedValue: null,
  selectedValues: [],
  textValue: "",
});

const HANGUL_PATTERN = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
const LATIN_PATTERN = /[A-Za-z]/;

function isEmotionCarrierType(value: string | null): value is EmotionCarrierType {
  return (
    value === "person" ||
    value === "object" ||
    value === "place" ||
    value === "event" ||
    value === "action_state" ||
    value === "abstract_form" ||
    value === "other"
  );
}

function parseScaleValue(question: SurveyQuestion, answer: AnswerRecord): number | null {
  if (question.type !== "slider" || question.scale === undefined) {
    return null;
  }

  if (answer.selectedValue === null) {
    return null;
  }

  const numericValue = Number(answer.selectedValue);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (numericValue < question.scale.min || numericValue > question.scale.max) {
    return null;
  }

  return numericValue;
}

function getScalePrecision(question: SurveyQuestion): number {
  const step = question.scale?.step;

  if (!step || step >= 1) {
    return 0;
  }

  const stepText = step.toString();

  if (stepText.includes("e-")) {
    const exponent = Number(stepText.split("e-")[1]);
    return Number.isFinite(exponent) ? exponent : 0;
  }

  return stepText.includes(".") ? stepText.split(".")[1].length : 0;
}

function isEnglishOnlyText(value: string): boolean {
  const normalized = value.trim();
  return normalized.length > 0 && LATIN_PATTERN.test(normalized) && !HANGUL_PATTERN.test(normalized);
}

function requiresEnglishCustomInput(question: SurveyQuestion): boolean {
  return (
    question.id === "EMOTION_CARRIER_Q1_PRIMARY_CARRIER" ||
    question.id === "EMOTION_CARRIER_Q3_SECONDARY_CARRIER"
  );
}

export function formatScaleValue(question: SurveyQuestion, value: number): string {
  const precision = getScalePrecision(question);

  return precision > 0 ? value.toFixed(precision) : `${Math.round(value)}`;
}

function isFindInitialResponse(value: string | null): value is FindInitialResponse {
  return (
    value === "body_sensation" ||
    value === "emotion" ||
    value === "thought_or_sentence" ||
    value === "image_or_scene" ||
    value === "sound_or_voice" ||
    value === "unknown_or_other"
  );
}

function isFocusLocation(value: string | null): value is FocusLocation {
  return (
    value === "inside_body" ||
    value === "on_body_surface" ||
    value === "around_body" ||
    value === "unclear_location"
  );
}

function findSelectedLabel(question: SurveyQuestion, answer: AnswerRecord): string | null {
  if (answer.selectedValue === null) {
    return null;
  }

  if (answer.selectedValue === "custom") {
    const customText = answer.textValue.trim();
    return customText.length > 0 ? customText : null;
  }

  if (answer.selectedValue === "none") {
    return null;
  }

  return question.options?.find((option) => option.value === answer.selectedValue)?.label ?? answer.selectedValue;
}

function findSelectedLabels(question: SurveyQuestion, answer: AnswerRecord): string[] {
  if (!Array.isArray(answer.selectedValues) || answer.selectedValues.length === 0) {
    return [];
  }

  return answer.selectedValues
    .map((selectedValue) =>
      question.options?.find((option) => option.value === selectedValue)?.label ?? selectedValue,
    )
    .filter((label): label is string => label.trim().length > 0);
}

export function createEmptyAnswerMap(): AnswerMap {
  return Object.fromEntries(
    Object.keys(EMPTY_ANSWER_TEMPLATE).map((questionId) => [questionId, BLANK_ANSWER()]),
  ) as AnswerMap;
}

export function getVisibleQuestionIds(_: AnswerMap): QuestionId[] {
  return [...ALL_QUESTION_IDS];
}

export function getQuestion(questionId: QuestionId): SurveyQuestion {
  return QUESTION_DEFINITIONS[questionId];
}

export function getAnswer(questionId: QuestionId, answers: AnswerMap): AnswerRecord {
  return answers[questionId] ?? BLANK_ANSWER();
}

export function isQuestionComplete(question: SurveyQuestion, answer: AnswerRecord): boolean {
  if (question.type === "multi_select") {
    return Array.isArray(answer.selectedValues) && answer.selectedValues.length > 0;
  }

  if (question.type === "textarea") {
    return answer.textValue.trim().length > 0;
  }

  if (question.type === "slider") {
    return parseScaleValue(question, answer) !== null;
  }

  if (answer.selectedValue === null) {
    return false;
  }

  if (answer.selectedValue === "custom") {
    if (!requiresEnglishCustomInput(question)) {
      return answer.textValue.trim().length > 0;
    }

    return isEnglishOnlyText(answer.textValue);
  }

  return true;
}

export function getQuestionValidationMessage(
  question: SurveyQuestion,
  answer: AnswerRecord,
): string | null {
  if (question.type === "multi_select") {
    return Array.isArray(answer.selectedValues) && answer.selectedValues.length > 0
      ? null
      : "선택지를 하나 이상 골라 주세요.";
  }

  if (question.type === "textarea") {
    return answer.textValue.trim().length > 0 ? null : "내용을 입력해 주세요.";
  }

  if (question.type === "slider") {
    if (parseScaleValue(question, answer) !== null) {
      return null;
    }

    const minLabel =
      question.scale?.min !== undefined ? formatScaleValue(question, question.scale.min) : "1";
    const maxLabel =
      question.scale?.max !== undefined ? formatScaleValue(question, question.scale.max) : "9";

    return `${minLabel}부터 ${maxLabel} 사이의 값을 선택해 주세요.`;
  }

  if (answer.selectedValue === null) {
    return "선택지를 하나 골라 주세요.";
  }

  if (answer.selectedValue === "custom" && answer.textValue.trim().length === 0) {
    return "직접 입력 내용을 적어 주세요.";
  }

  if (
    answer.selectedValue === "custom" &&
    requiresEnglishCustomInput(question) &&
    !isEnglishOnlyText(answer.textValue)
  ) {
    return "영어로 입력해 주세요.";
  }

  return null;
}

export function getAnswerDisplayText(
  question: SurveyQuestion,
  answer: AnswerRecord,
): string {
  if (question.type === "multi_select") {
    const labels = findSelectedLabels(question, answer);
    return labels.length > 0 ? labels.join(", ") : "";
  }

  if (question.type === "textarea") {
    return answer.textValue.trim();
  }

  if (question.type === "slider") {
    const numericValue = parseScaleValue(question, answer);
    if (numericValue === null) {
      return "";
    }

    const maxValue = question.scale?.max ?? numericValue;
    return `${formatScaleValue(question, numericValue)} / ${formatScaleValue(question, maxValue)}`;
  }

  if (answer.selectedValue === null) {
    return "";
  }

  if (answer.selectedValue === "custom") {
    const customText = answer.textValue.trim();
    return customText.length > 0 ? `직접 입력: ${customText}` : "직접 입력";
  }

  const optionLabel =
    question.options?.find((option) => option.value === answer.selectedValue)?.label ??
    answer.selectedValue;

  return optionLabel;
}

function resolvePrimaryCarrier(question: SurveyQuestion, answer: AnswerRecord): string | null {
  if (answer.selectedValue === null) {
    return null;
  }

  if (answer.selectedValue === "custom") {
    const customText = answer.textValue.trim();
    return customText.length > 0 ? customText : null;
  }

  return findSelectedLabel(question, answer);
}

function resolveSecondaryCarrier(question: SurveyQuestion, answer: AnswerRecord): string | null {
  if (answer.selectedValue === null || answer.selectedValue === "none") {
    return null;
  }

  return findSelectedLabel(question, answer);
}

function resolveScaleValue(questionId: QuestionId, answers: AnswerMap): number | null {
  const question = getQuestion(questionId);
  const answer = getAnswer(questionId, answers);
  return parseScaleValue(question, answer);
}

function resolveAgency(answers: AnswerMap): RawSurveyResponse["appraisal"]["agency"] | null {
  const answer = getAnswer("APPRAISAL_Q3_AGENCY", answers);
  if (!Array.isArray(answer.selectedValues) || answer.selectedValues.length === 0) {
    return null;
  }

  const allowedValues: RawSurveyResponse["appraisal"]["agency"] = [];

  answer.selectedValues.forEach((selectedValue) => {
    if (
      selectedValue === "self_behavior" ||
      selectedValue === "other_person" ||
      selectedValue === "situation_environment" ||
      selectedValue === "chance_natural_cause" ||
      selectedValue === "unknown"
    ) {
      if (!allowedValues.includes(selectedValue)) {
        allowedValues.push(selectedValue);
      }
    }
  });

  return allowedValues.length > 0 ? allowedValues : null;
}

export function buildRawSurveyResponse(answers: AnswerMap): RawSurveyResponse | null {
  const findAnswer = getAnswer("FIND_Q1_INITIAL_RESPONSE", answers);
  const focusDescriptionAnswer = getAnswer("FOCUS_Q1_FREE_DESCRIPTION", answers);
  const focusLocationAnswer = getAnswer("FOCUS_Q2_LOCATION", answers);
  const primaryCarrierQuestion = getQuestion("EMOTION_CARRIER_Q1_PRIMARY_CARRIER");
  const primaryCarrierAnswer = getAnswer("EMOTION_CARRIER_Q1_PRIMARY_CARRIER", answers);
  const carrierTypeQuestion = getQuestion("EMOTION_CARRIER_Q2_CARRIER_TYPE");
  const carrierTypeAnswer = getAnswer("EMOTION_CARRIER_Q2_CARRIER_TYPE", answers);
  const secondaryCarrierQuestion = getQuestion("EMOTION_CARRIER_Q3_SECONDARY_CARRIER");
  const secondaryCarrierAnswer = getAnswer("EMOTION_CARRIER_Q3_SECONDARY_CARRIER", answers);

  const initialResponse = isFindInitialResponse(findAnswer.selectedValue)
    ? findAnswer.selectedValue
    : null;
  const freeDescription = focusDescriptionAnswer.textValue.trim();
  const location = isFocusLocation(focusLocationAnswer.selectedValue)
    ? focusLocationAnswer.selectedValue
    : null;

  const primaryCarrier = resolvePrimaryCarrier(primaryCarrierQuestion, primaryCarrierAnswer);
  const carrierType = carrierTypeAnswer.selectedValue;
  const secondaryCarrier = resolveSecondaryCarrier(secondaryCarrierQuestion, secondaryCarrierAnswer);

  const valence = resolveScaleValue("VAD_Q1_VALENCE", answers);
  const arousal = resolveScaleValue("VAD_Q2_AROUSAL", answers);
  const dominance = resolveScaleValue("VAD_Q3_DOMINANCE", answers);

  const goalRelevance = resolveScaleValue("APPRAISAL_Q1_GOAL_RELEVANCE", answers);
  const goalConduciveness = resolveScaleValue("APPRAISAL_Q2_GOAL_CONDUCIVENESS", answers);
  const agency = resolveAgency(answers);
  const copingPotential = resolveScaleValue("APPRAISAL_Q4_COPING_POTENTIAL", answers);
  const predictability = resolveScaleValue("APPRAISAL_Q5_PREDICTABILITY", answers);

  if (
    initialResponse === null ||
    freeDescription.length === 0 ||
    location === null ||
    primaryCarrier === null ||
    !isEmotionCarrierType(carrierType) ||
    valence === null ||
    arousal === null ||
    dominance === null ||
    goalRelevance === null ||
    goalConduciveness === null ||
    agency === null ||
    copingPotential === null ||
    predictability === null
  ) {
    return null;
  }

  return {
    find: {
      initial_response: initialResponse,
    },
    focus: {
      free_description: freeDescription,
      location,
    },
    emotionCarrier: {
      primaryCarrier,
      carrierType,
      secondaryCarrier,
    },
    vad: {
      valence,
      arousal,
      dominance,
    },
    appraisal: {
      goalRelevance,
      goalConduciveness,
      agency,
      copingPotential,
      predictability,
    },
  };
}

export const buildStructuredResponse = buildRawSurveyResponse;
