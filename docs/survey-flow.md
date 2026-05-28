# Survey Flow

## 0. 전체 원칙

- 설문은 3개 섹션으로 구성한다.
  1. `Find`
  2. `Focus`
  3. `Flesh out`
- `Find`와 `Focus`는 IFS 맥락을 붙잡는 단계이다.
- `Flesh out`는 Emotion Carrier, VAD, Appraisal 입력을 수집해 Meshy 프롬프트를 만드는 단계이다.
- 모든 선택형 문항은 단일 선택으로 구현한다.
- `직접 입력`을 선택한 경우에만 추가 텍스트 입력창을 표시한다.
- VAD는 0.0~1.0 범위, Appraisal은 1~7 범위의 슬라이더로 수집한다.
- 응답은 최종적으로 `rawSurveyResponse` JSON으로 저장한다.

---

## 1. Find

### 1.1 단계 안내 문구

최근 일상에서 마음이 불편해지거나 자꾸 신경 쓰였던 상황을 하나 떠올려 주세요.

너무 힘든 경험은 선택하지 않아도 됩니다.

### 1.2 질문: 처음 나타나는 반응

**Question ID**

`FIND_Q1_INITIAL_RESPONSE`

**질문 문구**

그 상황을 떠올릴 때 가장 먼저 느껴지는 느낌이나 떠오르는 반응은 무엇인가요?

**입력 방식**

`single_select`

**선택지**

- `신체 감각으로 느껴진다` -> `body_sensation`
- `감정으로 느껴진다` -> `emotion`
- `생각이나 문장으로 떠오른다` -> `thought_or_sentence`
- `이미지나 장면으로 떠오른다` -> `image_or_scene`
- `소리나 목소리처럼 느껴진다` -> `sound_or_voice`
- `아직 잘 모르겠다 / 다른 방식이다` -> `unknown_or_other`

---

## 2. Focus

### 2.1 질문: 자유 서술

**Question ID**

`FOCUS_Q1_FREE_DESCRIPTION`

**질문 문구**

그 반응을 잠시 떠올려 볼 때, 몸 안이나 몸 주변에서 느껴지는 위치, 몸의 감각, 감정, 생각 또는 이미지가 있나요?

떠오르는 방식대로 자유롭게 적어 주세요.

잘 모르겠다면 ‘잘 모르겠음’이라고 적어도 괜찮습니다.

**입력 방식**

`textarea`

### 2.2 질문: 느껴지는 위치

**Question ID**

`FOCUS_Q2_LOCATION`

**질문 문구**

그 반응은 어디에서 느껴지는 것에 가장 가까운가요?

**입력 방식**

`single_select`

**선택지**

- `몸 안에서 느껴진다` -> `inside_body`
- `몸 표면 또는 몸에 붙어 있는 것처럼 느껴진다` -> `on_body_surface`
- `몸 주변 공간에 있는 것처럼 느껴진다` -> `around_body`
- `위치를 특정하기 어렵다` -> `unclear_location`

---

## 3. Flesh out

Flesh out 단계에서는 선택된 마음의 모습을 VR 오브젝트로 외부화하기 위한 입력을 차례로 수집한다.

### 3.1 Emotion Carrier

#### 3.1.1 핵심 Emotion Carrier

**Question ID**

`EMOTION_CARRIER_Q1_PRIMARY_CARRIER`

**질문 문구**

이 마음의 모습을 VR 오브젝트로 옮긴다면, 어떤 표현 방식이 가장 가깝나요?

잘 맞는 선택지가 없다면 직접 설명해 주세요.

**선택지**

- `어린 시절의 나`
- `사람 또는 캐릭터 같은 존재`
- `빛·색·그림자·물체 같은 상징적 형상`
- `감정이 형상으로 느껴짐`
- `몸의 감각이 형상으로 느껴짐`
- `목소리 또는 문장처럼 느껴짐`
- `여러 형태가 함께 느껴짐`
- `아직 구체화되지 않음`
- `직접 설명하기`

**직접 입력 예시**

`예: 말로 옮기기 어려운 느낌, 이미지, 장면`

#### 3.1.2 Emotion Carrier 유형

**Question ID**

`EMOTION_CARRIER_Q2_CARRIER_TYPE`

**질문 문구**

선택한 대상은 어떤 유형에 가장 가깝나요?

기본 범주를 먼저 보고, 필요하면 탐색용 범주도 확인해 주세요.

**선택지**

- `사람 또는 인물` -> `person`
- `사물` -> `object`
- `장소 또는 공간` -> `place`
- `사건 또는 장면` -> `event`
- `행동 또는 상태 (탐색용)` -> `action_state`
- `추상적인 형태 (탐색용)` -> `abstract_form`
- `기타 (탐색용)` -> `other`

#### 3.1.3 보조 Emotion Carrier

**Question ID**

`EMOTION_CARRIER_Q3_SECONDARY_CARRIER`

**질문 문구**

그 감정과 함께 떠오르는 또 다른 대상이나 장면이 있나요?

**선택지**

- `없음`
- `직접 입력`

**직접 입력 예시**

`직접 떠오르는 대상이나 장면을 입력해 주세요`

---

### 3.2 VAD

#### 3.2.1 Valence

**Question ID**

`VAD_Q1_VALENCE`

**질문 문구**

이 대상이나 장면이 담고 있는 느낌은 얼마나 유쾌한 쪽(행복, 기쁨, 긍정, 만족, 희망) 또는 불쾌한 쪽(불행, 짜증, 부정, 불만족, 우울, 절망)에 가깝나요?

색으로 떠올리면 밝고 따뜻한가요, 어둡고 차가운가요?

**범위**

- `0.00 = 불쾌·불행·절망`
- `0.50 = 중간`
- `1.00 = 유쾌·행복·희망`

#### 3.2.2 Arousal

**Question ID**

`VAD_Q2_AROUSAL`

**질문 문구**

이 느낌은 얼마나 활기 있고 자극적이며 열광적이고 기민한 쪽인가요, 아니면 수동적이고 이완되어 있으며 차분하고 나른하며 졸린 쪽인가요?

색으로 떠올리면 선명하고 채도 높은가요, 탁하고 가라앉은가요?

**범위**

- `0.00 = 차분·이완·졸림`
- `0.50 = 중간`
- `1.00 = 활기·자극·열광`

#### 3.2.3 Dominance

**Question ID**

`VAD_Q3_DOMINANCE`

**질문 문구**

이 느낌 속에서 나는 얼마나 영향력 있고, 상황을 통제하며, 강력하고 주도적이라고 느끼나요, 아니면 외부 요인에 의해 휘둘리고, 약하며, 무력하고 수동적이라고 느끼나요?

시각적으로는 얼마나 무겁고 짙으며 압도적인가요, 아니면 가볍고 연하며 덜 눌리는가요?

**범위**

- `0.00 = 가볍고 연함`
- `0.50 = 중간`
- `1.00 = 무겁고 짙음`

---

### 3.3 Appraisal

Appraisal 문항에 답할 때는 앞서 떠올린 대상의 모양 자체보다, 그 대상이나 장면이 나타내는 경험 또는 상황을 떠올리며 답해 주세요.

#### 3.3.1 중요성 / Goal Relevance

**Question ID**

`APPRAISAL_Q1_GOAL_RELEVANCE`

**질문 문구**

이 대상이나 장면이 나타내는 경험은, 지금 나의 바람이나 필요와 얼마나 중요하게 관련되어 있다고 느껴지나요?

**범위**

- `1 = 전혀 관련 없음`
- `4 = 중간`
- `7 = 매우 중요하게 관련됨`

#### 3.3.2 도움 또는 방해 / Goal Conduciveness

**Question ID**

`APPRAISAL_Q2_GOAL_CONDUCIVENESS`

**질문 문구**

이 대상이나 장면이 나타내는 경험은, 내가 지금 바라는 방향에 가까워지는 데 얼마나 방해가 되거나 도움이 된다고 느껴지나요?

**범위**

- `1 = 매우 방해함`
- `4 = 중간`
- `7 = 매우 도움 됨`

#### 3.3.3 원인 주체 / Agency

**Question ID**

`APPRAISAL_Q3_AGENCY`

**질문 문구**

이 대상이나 장면이 나타내는 경험은 무엇의 영향을 받아 생긴 것에 가깝다고 느껴지나요? 여러 개를 선택할 수 있습니다.

**선택지**

- `나 자신의 행동이나 선택` -> `self_behavior`
- `다른 사람` -> `other_person`
- `상황이나 환경` -> `situation_environment`
- `우연하거나 자연스럽게 생긴 일` -> `chance_natural_cause`
- `잘 모르겠음` -> `unknown`

#### 3.3.4 통제·대처 가능성 / Coping Potential

**Question ID**

`APPRAISAL_Q4_COPING_POTENTIAL`

**질문 문구**

나는 이 대상이나 장면이 나타내는 경험을 얼마나 다루거나 대처할 수 있다고 느끼나요?

**범위**

- `1 = 전혀 대처할 수 없음`
- `4 = 중간`
- `7 = 충분히 대처할 수 있음`

#### 3.3.5 예측 가능성 / Predictability

**Question ID**

`APPRAISAL_Q5_PREDICTABILITY`

**질문 문구**

이 대상이나 장면이 나타내는 경험이 생길 것을, 나는 얼마나 미리 예상할 수 있었다고 느끼나요?

**범위**

- `1 = 전혀 예측할 수 없음`
- `4 = 중간`
- `7 = 매우 예측 가능함`

---

## 4. 최종 `rawSurveyResponse`

최종 응답은 다음 형태로 저장한다.

```ts
export interface RawSurveyResponse {
  find: {
    initial_response: "body_sensation" | "emotion" | "thought_or_sentence" | "image_or_scene" | "sound_or_voice" | "unknown_or_other";
  };
  focus: {
    free_description: string;
    location: "inside_body" | "on_body_surface" | "around_body" | "unclear_location";
  };
  emotionCarrier: {
    primaryCarrier: string;
    carrierType: "person" | "object" | "place" | "event" | "action_state" | "abstract_form" | "other";
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
    agency: ("self_behavior" | "other_person" | "situation_environment" | "chance_natural_cause" | "unknown")[];
    copingPotential: number;
    predictability: number;
  };
}
```

예시:

```json
{
  "find": {
    "initial_response": "emotion"
  },
  "focus": {
    "free_description": "뭔가 몸이 불편해지고, 슬픈 감정이 떠오른다. 어디론가 숨고 싶다",
    "location": "inside_body"
  },
  "emotionCarrier": {
    "primaryCarrier": "웅크리고 앉아 있는 어린아이",
    "carrierType": "person",
    "secondaryCarrier": "닫힌 문"
  },
  "vad": {
    "valence": 2,
    "arousal": 3,
    "dominance": 2
  },
  "appraisal": {
    "goalRelevance": 7,
    "goalConduciveness": 2,
    "agency": ["other_person"],
    "copingPotential": 2,
    "predictability": 2
  }
}
```
