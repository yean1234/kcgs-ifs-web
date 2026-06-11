# Prompt Conversion Strategy

## 1. 변환 개요

- 사용자는 Find / Focus / Flesh out 설문에 한 번만 응답한다.
- `rawSurveyResponse`는 Find, Focus, Flesh out 입력을 모두 보존하는 내부 원본 데이터이다.
- 최종 Meshy 프롬프트는 Flesh out 단계의 세 변환 결과를 결합해 만든다.

```text
Emotion Carrier base prompt
→ VAD modifiers
→ Appraisal modifiers
→ final Meshy prompt
```

- Find와 Focus는 IFS 맥락을 보존하는 역할을 하고, 현재 프롬프트 조립에서는 직접 modifier로 쓰지 않는다.
- 비교 기준은 입력 방식이 아니라 변환 방식이다.
- Meshy용 원문 프롬프트는 영어로 유지하고, UI는 한국어를 유지한다.
- `negative prompt` 문구는 사용하지 않는다.

---

## 2. Emotion Carrier Base Prompt

### 역할

- 중심 대상과 보조 대상을 영어 문장구로 정리한다.
- 정서 분위기, 조명, 색감, 통제감, 관계 해석은 여기서 추가하지 않는다.
- Q1과 Q3의 직접 입력은 영어로 받으며, 입력된 영문 표현을 그대로 deterministic canonical phrase로 사용한다.
- Q2는 사람 / 사물 / 장소 / 사건을 핵심 범주로 두고, 행동-상태 / 추상 형상 / 기타는 탐색 범주로 둔다.

### 사용 입력

- `rawSurveyResponse.emotionCarrier.primaryCarrier`
- `rawSurveyResponse.emotionCarrier.carrierType`
- `rawSurveyResponse.emotionCarrier.secondaryCarrier`

### 구현 함수

- `buildEmotionCarrierBasePrompt(response)`
- 내부적으로 `buildEmotionCarrierBasePromptText()`와 `buildMeshyPrompt()`를 사용한다.

### 출력 예시

```text
a curled-up child figure with a closed door-like object
```

---

## 3. VAD Modifiers

### 역할

- 선택된 중심 대상의 정서적 시각 분위기를 조절한다.
- 본 프로젝트에서는 VAD를 연구용 operational mapping으로 다룬다.

### 사용 입력

- `rawSurveyResponse.vad.valence`
- `rawSurveyResponse.vad.arousal`
- `rawSurveyResponse.vad.dominance`

### 응답 형식

- VAD 응답은 0.0~1.0 범위의 연속값으로 저장한다.
- 질문 문구는 NRC VAD Lexicon의 paradigm-word anchors를 참고해 유쾌/불쾌, 활성/비활성, 통제/무력의 양극을 사용자에게 더 분명하게 보여준다.

### 구현 함수

- `buildVadModifiersFromResponse(response.vad)`
- 실제 수식어 조합은 `src/data/vadModifierMap.ts`에서 관리한다.

### 운영 규칙

- 낮은 valence, 높은 arousal, 낮은 dominance는 더 어둡고 긴장된 시각 수식어로 변환한다.
- dominance는 특히 시각적 무게, 명도, 압박감, 짙음/연함 단서를 조절한다.
- 중간 구간은 중립 또는 완화된 표현을 사용한다.
- 이 매핑은 이론의 직접 출력이 아니라 연구용 규칙이다.

### 출력 예시

```text
muted, dim, somber, still, low-energy, quiet, small-scale, fragile, withdrawn
```

---

## 4. Appraisal Modifiers

### 역할

- 대상과 장면의 관계, 맥락, 통제감, 예측 가능성을 조절한다.
- 이 단계는 VAD와 다른 종류의 관계적 수식어를 만든다.
- Appraisal 문항은 대상의 모양 자체가 아니라, 그 대상이나 장면이 나타내는 경험 또는 상황을 평가하도록 안내한다.

### 사용 입력

- `rawSurveyResponse.appraisal.goalRelevance`
- `rawSurveyResponse.appraisal.goalConduciveness`
- `rawSurveyResponse.appraisal.agency` (multi-select 배열)
- `rawSurveyResponse.appraisal.copingPotential`
- `rawSurveyResponse.appraisal.predictability`

### 구현 함수

- `buildAppraisalModifiersFromResponse(response.appraisal)`
- 실제 수식어 조합은 `src/data/appraisalModifierMap.ts`에서 관리한다.

### 운영 규칙

- goal relevance는 시각적 중심성 또는 주변성을 조절한다.
- goal conduciveness는 장면이 막히는지 열려 있는지 조절한다.
- agency는 외적 영향, 상황 압력, 사건의 흔적, 자기 행동의 흔적 같은 관계적 단서를 조절한다.
- coping potential은 닫힘/열림, 탈출 가능성 같은 관계를 조절한다.
- predictability는 장면의 명료성, 규칙성, 가려짐 정도를 조절한다.
- 이 매핑 역시 연구용 operational mapping이다.

### 출력 예시

```text
central and visually salient presence, obstructive surrounding elements, presence of external influence implied in the scene, enclosed, limited escape space, uncertain, asymmetrical, partially obscured surroundings
```

---

## 5. Final Meshy Prompt

### 조립 규칙

- `buildFinalMeshyPrompt(basePrompt, vadModifiers, appraisalModifiers)`가 최종 문자열을 만든다.
- 순서는 다음과 같다.

```text
[Emotion Carrier base prompt], [VAD modifiers], [Appraisal modifiers], 2D object, isolated object, suitable for text-to-2D generation
```

- `src/utils/promptConverters/meshyPrompt.ts`의 `buildMeshyPrompt()`는 subject, modifiers, styles를 쉼표로 연결하는 역할만 한다.

### 예시

```text
a curled-up child figure with a closed door-like object, muted, dim, somber, still, low-energy, quiet, small-scale, fragile, withdrawn, central and visually salient presence, obstructive surrounding elements, presence of external influence implied in the scene, enclosed, limited escape space, uncertain, asymmetrical, partially obscured surroundings, 2D object, isolated object, suitable for text-to-2D generation
```

---

## 6. 결과 화면 표시 원칙

- 메인 결과 화면은 JSON 하나만 보여주지 않는다.
- 조건별 full prompt 변형 4개를 각각 확인할 수 있어야 한다.

  1. `Emotion Carrier only`
  2. `Emotion Carrier + VAD`
  3. `Emotion Carrier + Appraisal`
  4. `Emotion Carrier + VAD + Appraisal`

- `Raw Survey Response JSON`은 개발용 접기/펼치기 영역에서만 보여준다.
- 각 항목은 복사 가능해야 한다.
- 4개 카드는 Meshy나 다른 데모에 바로 넣을 수 있는 입력용 full prompt다.

## 7. 프롬프트 JSON 내보내기

- 웹에서는 prompt pack JSON만 내려받는다.
- JSON에는 4개 변형 프롬프트와 각 변형의 가공 요소가 포함된다.
- 사용자는 이 JSON을 Meshy나 다른 외부 데모의 입력으로 사용할 수 있다.
- 로컬 모델 실행 스크립트는 제공하지 않는다.
