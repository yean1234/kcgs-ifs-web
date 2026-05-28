import type {
  AnswerMap,
  QuestionId,
  SectionMeta,
  SurveyOption,
  SurveyQuestion,
} from "../types/survey";

const option = (value: string, label: string): SurveyOption => ({
  value,
  label,
});

export const SECTION_META: Record<"find" | "focus" | "flesh_out", SectionMeta> = {
  find: {
    label: "1. Find",
    intro:
      "최근 일상에서 마음이 불편해지거나 자꾸 신경 쓰였던 상황을 하나 떠올려 주세요.\n너무 힘든 경험은 선택하지 않아도 됩니다.",
  },
  focus: {
    label: "2. Focus",
    intro:
      "그 반응을 잠시 떠올려 보며, 떠오르는 방식대로 자유롭게 적어 주세요.\n잘 모르겠다면 ‘잘 모르겠음’이라고 적어도 괜찮습니다.",
  },
  flesh_out: {
    label: "3. Flesh out",
    intro:
      "이제 떠오른 마음의 모습을 VR 오브젝트로 구체화해 보세요.\n중심 이미지, 분위기, 관계를 차례로 정리합니다.",
  },
};

export const APPRAISAL_GUIDANCE =
  "앞서 떠올린 대상이나 장면은 지금 경험하고 있는 마음의 한 부분을 표현한 것입니다.\n이제부터는 그 대상 자체의 모양이 아니라, 그 대상이나 장면이 나타내는 경험 또는 상황을 떠올리며 답해 주세요.";

export const QUESTION_DEFINITIONS = {
  FIND_Q1_INITIAL_RESPONSE: {
    id: "FIND_Q1_INITIAL_RESPONSE",
    section: "find",
    type: "single_select",
    prompt: "그 상황을 떠올릴 때 가장 먼저 느껴지는 느낌이나 떠오르는 반응은 무엇인가요?",
    options: [
      option("body_sensation", "신체 감각으로 느껴진다"),
      option("emotion", "감정으로 느껴진다"),
      option("thought_or_sentence", "생각이나 문장으로 떠오른다"),
      option("image_or_scene", "이미지나 장면으로 떠오른다"),
      option("sound_or_voice", "소리나 목소리처럼 느껴진다"),
      option("unknown_or_other", "아직 잘 모르겠다 / 다른 방식이다"),
    ],
  },
  FOCUS_Q1_FREE_DESCRIPTION: {
    id: "FOCUS_Q1_FREE_DESCRIPTION",
    section: "focus",
    type: "textarea",
    prompt:
      "그 반응을 잠시 떠올려 볼 때, 몸 안이나 몸 주변에서 느껴지는 위치, 몸의 감각, 감정, 생각 또는 이미지가 있나요?\n\n떠오르는 방식대로 자유롭게 적어 주세요.\n잘 모르겠다면 ‘잘 모르겠음’이라고 적어도 괜찮습니다.",
    placeholder: "예: 뭔가 몸이 불편해지고, 슬픈 감정이 떠오른다.",
  },
  FOCUS_Q2_LOCATION: {
    id: "FOCUS_Q2_LOCATION",
    section: "focus",
    type: "single_select",
    prompt: "그 반응은 어디에서 느껴지는 것에 가장 가까운가요?",
    options: [
      option("inside_body", "몸 안에서 느껴진다"),
      option("on_body_surface", "몸 표면 또는 몸에 붙어 있는 것처럼 느껴진다"),
      option("around_body", "몸 주변 공간에 있는 것처럼 느껴진다"),
      option("unclear_location", "위치를 특정하기 어렵다"),
    ],
  },
  EMOTION_CARRIER_Q1_PRIMARY_CARRIER: {
    id: "EMOTION_CARRIER_Q1_PRIMARY_CARRIER",
    section: "flesh_out",
    type: "single_select",
    prompt:
      "이 마음의 모습을 VR 오브젝트로 옮긴다면, 어떤 표현 방식이 가장 가깝나요?\n잘 맞는 선택지가 없다면 직접 설명해 주세요.",
    options: [
      option("young_self", "어린 시절의 나"),
      option("character", "사람 또는 캐릭터 같은 존재"),
      option("symbolic_object", "빛·색·그림자·물체 같은 상징적 형상"),
      option("emotion_as_object", "감정이 형상으로 느껴짐"),
      option("body_sensation", "몸의 감각이 형상으로 느껴짐"),
      option("voice_or_phrase", "목소리 또는 문장처럼 느껴짐"),
      option("multiple", "여러 형태가 함께 느껴짐"),
      option("undefined", "아직 구체화되지 않음"),
      option("custom", "직접 설명하기 (영어)"),
    ],
    customPlaceholder: "Please describe it in English, e.g. a blurred feeling, a cloud-like image, a distant scene.",
  },
  EMOTION_CARRIER_Q2_CARRIER_TYPE: {
    id: "EMOTION_CARRIER_Q2_CARRIER_TYPE",
    section: "flesh_out",
    type: "single_select",
    prompt:
      "선택한 대상은 어떤 유형에 가장 가깝나요?\n기본 범주를 먼저 보고, 필요하면 탐색용 범주도 확인해 주세요.",
    options: [
      option("person", "사람 또는 인물"),
      option("object", "사물"),
      option("place", "장소 또는 공간"),
      option("event", "사건 또는 장면"),
      option("action_state", "행동 또는 상태 (탐색용)"),
      option("abstract_form", "추상적인 형태 (탐색용)"),
      option("other", "기타 (탐색용)"),
    ],
  },
  EMOTION_CARRIER_Q3_SECONDARY_CARRIER: {
    id: "EMOTION_CARRIER_Q3_SECONDARY_CARRIER",
    section: "flesh_out",
    type: "single_select",
    prompt: "그 감정과 함께 떠오르는 또 다른 대상이나 장면이 있나요?",
    options: [
      option("none", "없음"),
      option("custom", "직접 입력 (영어)"),
    ],
    customPlaceholder: "Please enter the object or scene in English, e.g. dark cloud, mist, shadow.",
  },
  VAD_Q1_VALENCE: {
    id: "VAD_Q1_VALENCE",
    section: "flesh_out",
    type: "slider",
    prompt:
      "이 대상이나 장면이 담고 있는 느낌은 얼마나 유쾌한 쪽(행복, 기쁨, 긍정, 만족, 희망) 또는 불쾌한 쪽(불행, 짜증, 부정, 불만족, 우울, 절망)에 가깝나요? 색으로 떠올리면 밝고 따뜻한가요, 어둡고 차가운가요?",
    scale: {
      min: 0,
      max: 1,
      step: 0.01,
      leftLabel: "어둡고 차가움",
      centerLabel: "중립",
      rightLabel: "밝고 따뜻함",
    },
  },
  VAD_Q2_AROUSAL: {
    id: "VAD_Q2_AROUSAL",
    section: "flesh_out",
    type: "slider",
    prompt:
      "이 느낌은 얼마나 활기 있고 자극적이며 열광적이고 기민한 쪽인가요, 아니면 수동적이고 이완되어 있으며 차분하고 나른하며 졸린 쪽인가요? 색으로 떠올리면 선명하고 채도 높은가요, 탁하고 가라앉은가요?",
    scale: {
      min: 0,
      max: 1,
      step: 0.01,
      leftLabel: "탁하고 가라앉음",
      centerLabel: "중간",
      rightLabel: "선명하고 채도 높음",
    },
  },
  VAD_Q3_DOMINANCE: {
    id: "VAD_Q3_DOMINANCE",
    section: "flesh_out",
    type: "slider",
    prompt:
      "이 느낌 속에서 나는 얼마나 영향력 있고, 상황을 통제하며, 강력하고 주도적이라고 느끼나요, 아니면 외부 요인에 의해 휘둘리고, 약하며, 무력하고 수동적이라고 느끼나요? 시각적으로는 얼마나 무겁고 짙으며 압도적인가요, 아니면 가볍고 연하며 덜 눌리는가요?",
    scale: {
      min: 0,
      max: 1,
      step: 0.01,
      leftLabel: "가볍고 연함",
      centerLabel: "중간",
      rightLabel: "무겁고 짙음",
    },
  },
  APPRAISAL_Q1_GOAL_RELEVANCE: {
    id: "APPRAISAL_Q1_GOAL_RELEVANCE",
    section: "flesh_out",
    type: "slider",
    prompt:
      "이 대상이나 장면이 나타내는 경험은, 지금 나의 바람이나 필요와 얼마나 중요하게 관련되어 있다고 느껴지나요?",
    scale: {
      min: 1,
      max: 7,
      leftLabel: "전혀 관련 없음",
      centerLabel: "중간",
      rightLabel: "매우 중요하게 관련됨",
    },
  },
  APPRAISAL_Q2_GOAL_CONDUCIVENESS: {
    id: "APPRAISAL_Q2_GOAL_CONDUCIVENESS",
    section: "flesh_out",
    type: "slider",
    prompt:
      "이 대상이나 장면이 나타내는 경험은, 내가 지금 바라는 방향에 가까워지는 데 얼마나 방해가 되거나 도움이 된다고 느껴지나요?",
    scale: {
      min: 1,
      max: 7,
      leftLabel: "매우 방해함",
      centerLabel: "중간",
      rightLabel: "매우 도움 됨",
    },
  },
  APPRAISAL_Q3_AGENCY: {
    id: "APPRAISAL_Q3_AGENCY",
    section: "flesh_out",
    type: "multi_select",
    prompt:
      "이 대상이나 장면이 나타내는 경험은 무엇의 영향을 받아 생긴 것에 가깝다고 느껴지나요? 여러 개를 선택할 수 있습니다.",
    options: [
      option("self_behavior", "나 자신의 행동이나 선택"),
      option("other_person", "다른 사람"),
      option("situation_environment", "상황이나 환경"),
      option("chance_natural_cause", "우연하거나 자연스럽게 생긴 일"),
      option("unknown", "잘 모르겠음"),
    ],
  },
  APPRAISAL_Q4_COPING_POTENTIAL: {
    id: "APPRAISAL_Q4_COPING_POTENTIAL",
    section: "flesh_out",
    type: "slider",
    prompt: "나는 이 대상이나 장면이 나타내는 경험을 얼마나 다루거나 대처할 수 있다고 느끼나요?",
    scale: {
      min: 1,
      max: 7,
      leftLabel: "전혀 대처할 수 없음",
      centerLabel: "중간",
      rightLabel: "충분히 대처할 수 있음",
    },
  },
  APPRAISAL_Q5_PREDICTABILITY: {
    id: "APPRAISAL_Q5_PREDICTABILITY",
    section: "flesh_out",
    type: "slider",
    prompt: "이 대상이나 장면이 나타내는 경험이 생길 것을, 나는 얼마나 미리 예상할 수 있었다고 느끼나요?",
    scale: {
      min: 1,
      max: 7,
      leftLabel: "전혀 예측할 수 없음",
      centerLabel: "중간",
      rightLabel: "매우 예측 가능함",
    },
  },
} as const satisfies Record<QuestionId, SurveyQuestion>;

export const ALL_QUESTION_IDS = [
  "FIND_Q1_INITIAL_RESPONSE",
  "FOCUS_Q1_FREE_DESCRIPTION",
  "FOCUS_Q2_LOCATION",
  "EMOTION_CARRIER_Q1_PRIMARY_CARRIER",
  "EMOTION_CARRIER_Q2_CARRIER_TYPE",
  "EMOTION_CARRIER_Q3_SECONDARY_CARRIER",
  "VAD_Q1_VALENCE",
  "VAD_Q2_AROUSAL",
  "VAD_Q3_DOMINANCE",
  "APPRAISAL_Q1_GOAL_RELEVANCE",
  "APPRAISAL_Q2_GOAL_CONDUCIVENESS",
  "APPRAISAL_Q3_AGENCY",
  "APPRAISAL_Q4_COPING_POTENTIAL",
  "APPRAISAL_Q5_PREDICTABILITY",
] as const satisfies readonly QuestionId[];

export const EMPTY_ANSWER_TEMPLATE: AnswerMap = Object.fromEntries(
  ALL_QUESTION_IDS.map((questionId) => [
    questionId,
    { selectedValue: null, selectedValues: [], textValue: "" },
  ]),
) as unknown as AnswerMap;
