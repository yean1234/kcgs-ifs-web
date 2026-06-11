export type SurveySectionId = "find" | "focus" | "flesh_out";

export type EmotionCarrierType =
  | "person"
  | "object"
  | "place"
  | "event"
  | "action_state"
  | "abstract_form"
  | "other";

export type AppraisalAgency =
  | "self_behavior"
  | "other_person"
  | "situation_environment"
  | "chance_natural_cause"
  | "unknown";

export type FindInitialResponse =
  | "body_sensation"
  | "emotion"
  | "thought_or_sentence"
  | "image_or_scene"
  | "sound_or_voice"
  | "unknown_or_other";

export type FocusLocation =
  | "inside_body"
  | "on_body_surface"
  | "around_body"
  | "unclear_location";

export type QuestionId =
  | "FIND_Q1_INITIAL_RESPONSE"
  | "FOCUS_Q1_FREE_DESCRIPTION"
  | "FOCUS_Q2_LOCATION"
  | "EMOTION_CARRIER_Q1_PRIMARY_CARRIER"
  | "EMOTION_CARRIER_Q2_CARRIER_TYPE"
  | "EMOTION_CARRIER_Q3_SECONDARY_CARRIER"
  | "VAD_Q1_VALENCE"
  | "VAD_Q2_AROUSAL"
  | "VAD_Q3_DOMINANCE"
  | "APPRAISAL_Q1_GOAL_RELEVANCE"
  | "APPRAISAL_Q2_GOAL_CONDUCIVENESS"
  | "APPRAISAL_Q3_AGENCY"
  | "APPRAISAL_Q4_COPING_POTENTIAL"
  | "APPRAISAL_Q5_PREDICTABILITY";

export type SurveyQuestionType = "single_select" | "multi_select" | "textarea" | "slider";

export type SurveyOption = {
  value: string;
  label: string;
  canonicalPrompt?: string;
};

export type ScaleDefinition = {
  min: number;
  max: number;
  step?: number;
  leftLabel: string;
  centerLabel: string;
  rightLabel: string;
};

export type SurveyQuestion = {
  id: QuestionId;
  section: SurveySectionId;
  type: SurveyQuestionType;
  prompt: string;
  options?: readonly SurveyOption[];
  placeholder?: string;
  customPlaceholder?: string;
  scale?: ScaleDefinition;
};

export type AnswerRecord = {
  selectedValue: string | null;
  selectedValues: string[];
  textValue: string;
};

export type AnswerMap = Record<QuestionId, AnswerRecord>;

export type SectionMeta = {
  label: string;
  intro: string;
};

export interface RawSurveyResponse {
  find: {
    initial_response: FindInitialResponse;
  };
  focus: {
    free_description: string;
    location: FocusLocation;
  };
  emotionCarrier: {
    primaryCarrier: string;
    carrierType: EmotionCarrierType;
    secondaryCarrier: string | null;
  };
  vad: {
    valence: number;
    arousal: number;
    dominance: number;
  };
  appraisal: {
    goalRelevance: number;
    goalConduciveness: number;
    agency: AppraisalAgency[];
    copingPotential: number;
    predictability: number;
  };
}

export type FinalSurveyResponse = RawSurveyResponse;
