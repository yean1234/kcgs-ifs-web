# AGENTS.md

## 프로젝트 목표

* 이 프로젝트는 IFS-informed 자기탐색 흐름에서 사용자가 표현한 내적 경험을 구조화하고, 이를 Meshy Text-to-3D용 영어 프롬프트로 변환하는 웹 기반 연구 프로토타입이다.
* 연구의 핵심은 생성 모델 성능 평가가 아니라, **동일한 사용자 응답이 Find / Focus 맥락을 거친 뒤 Flesh out 단계의 서로 다른 가공 규칙에 따라 어떻게 다른 프롬프트로 바뀌는지 비교하는 것**이다.
* 이 프로젝트에서는 LLM, 생성형 API, Meshy API 자동 연동을 사용하지 않는다.
* 모든 프롬프트는 다음 방식으로만 생성한다.

```text
고정된 설문 응답
→ 구조화된 데이터 객체
→ 연구자가 정의한 operational mapping
→ 결정론적 문자열 조립 함수
→ Meshy용 최종 텍스트 프롬프트
```

---

## 현재 MVP 범위

현재 MVP는 다음 흐름을 우선 구현한다.

1. React 화면에서 Find / Focus / Flesh out 순서의 설문을 제시한다.
2. 사용자가 Find와 Focus에서 IFS 맥락을 응답한다.
3. 사용자가 Flesh out에서 Emotion Carrier, VAD, Appraisal 입력을 응답한다.
4. 사용자의 응답을 `rawSurveyResponse` 구조로 저장한다.
5. `rawSurveyResponse`를 기반으로 `Emotion Carrier base prompt`, `VAD modifiers`, `Appraisal modifiers`, `Final Meshy prompt`를 생성한다.
6. 결과 화면에서 원본 JSON과 각 프롬프트 단계를 확인할 수 있게 한다.
7. 사용자가 프롬프트를 복사하여 Meshy에 직접 입력할 수 있도록 한다.
8. 필요하면 prompt pack JSON을 내려받아 `scripts/run-3dtopia-prompt-pack.mjs`로 로컬 3DTopia 실행용 파일을 만든다.

명시적으로 요청받기 전까지 다음 기능은 구현하지 않는다.

* 회원가입 또는 로그인
* 데이터베이스 저장
* 외부 서버 배포 설정
* 복잡한 상태 관리 라이브러리 도입
* LLM 또는 생성형 AI API 연동
* Ollama 연동
* Qwen, Gemma, T5, BART 또는 Hugging Face 생성 모델 사용
* Meshy API 자동 연동
* Three.js 또는 React Three Fiber 기반 3D 렌더링
* 사용자 응답에 대한 치료적 평가 또는 진단 기능
* 실험 참여자 관리 기능
* 응답 결과의 영구 저장 기능

---

## 핵심 설계 원칙

* 이 시스템은 임상 진단 도구나 치료 도구가 아니라, IFS의 자기탐색 흐름을 참고한 연구용 프로토타입이다.
* 질문 문장, 선택지, 조건 분기 방식은 사용자 확인 없이 임의로 변경하지 않는다.
* 사용자가 답하지 않은 내용을 시스템이 임의로 추론하지 않는다.
* `Find`는 현재 마음을 떠올릴 맥락을 잡는 단계이다.
* `Focus`는 그 반응을 언어로 붙잡는 단계이다.
* `Flesh out`는 중심 오브젝트와 그에 붙을 VAD / Appraisal 수정어를 정리하는 단계이다.
* `Emotion Carrier`는 중심 오브젝트를 정하는 기준이다.
* Emotion Carrier는 사용자가 직접 설명하는 입력도 허용하되, 핵심 범주와 탐색 범주를 구분해서 보여준다.
* Q1에는 `직접 설명하기`를 허용하고, Q2는 사람/사물/장소/사건을 핵심 범주로 두되 행동/상태, 추상 형태, 기타는 탐색 범주로 표시한다.
* `VAD`는 중심 오브젝트의 정서적 분위기를 조절하는 modifier 기준이다.
* `Appraisal`는 대상과 장면의 관계, 맥락, 통제감 등을 조절하는 modifier 기준이다.
* Appraisal 문항은 대상의 모양 자체가 아니라, 그 대상이나 장면이 나타내는 경험 또는 상황을 평가하도록 안내한다.
* 세 조건은 같은 수준의 단순 옵션이 아니라, 다음과 같은 위계를 가진 파이프라인으로 다룬다.

```text
Emotion Carrier base prompt
→ apply VAD modifiers
→ apply Appraisal modifiers
→ final Meshy prompt
```

---

## 설문 구조

설문은 3개 섹션으로 구성한다.

1. `Find`
2. `Focus`
3. `Flesh out`

### Find

* 사용자가 최근 일상에서 신경 쓰였던 상황을 떠올리도록 돕는다.
* 첫 반응이 무엇인지 선택형으로 묻는다.

### Focus

* 사용자가 그 반응을 언어로 붙잡도록 돕는다.
* 자유 서술과 위치 선택을 수집한다.

### Flesh out

* 사용자가 느끼는 내적 경험을 외부화 가능한 형상으로 구체화한다.
* 이 섹션 안에서 Emotion Carrier, VAD, Appraisal 입력을 차례로 수집한다.
* 이 단계에서 생성된 값이 최종 Meshy 프롬프트의 입력이 된다.

---

## `rawSurveyResponse` 구조

사용자 응답은 다음 타입으로 저장한다.

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

* 사용자가 답하지 않은 항목은 `null` 또는 미응답 상태로 유지한다.
* `rawSurveyResponse`는 사용자 메인 결과물이 아니라, 모든 변환기의 공통 원본 입력이다.

---

## 프롬프트 생성 규칙

### 공통 규칙

* 최종 Meshy 프롬프트는 영어로 출력한다.
* 하나의 오브젝트만 생성하도록 `single isolated 3D object` 또는 이에 준하는 표현을 포함한다.
* 조건별 차이는 연구자가 정의한 operational mapping으로만 만든다.
* 프롬프트 생성은 항상 결정론적이어야 한다.
* 동일한 입력값은 항상 동일한 프롬프트를 출력해야 한다.
* Meshy용 프롬프트는 `Subject / Modifiers / Styles` 순서로 조립한다.
* 배제형 `negative prompt` 문구는 사용하지 않는다.

### Emotion Carrier base prompt

* `buildEmotionCarrierBasePromptText()`는 중심 대상과 보조 대상을 영어 명사구로 정리한다.
* Emotion Carrier base prompt에는 정서적 분위기, 조명, 색감, 통제감, 위협 관계를 임의로 추가하지 않는다.
* 사용자가 입력한 텍스트가 이미 English-only인 경우에만 그대로 활용할 수 있다.
* 한국어로 선택된 표준 carrier는 `src/data/emotionCarrierPromptMap.ts`의 매핑을 우선 사용한다.

### VAD modifiers

* `buildVadModifiers()`는 0.0~1.0으로 정규화된 `vad` 값을 기반으로 정서적 시각 수식어 배열을 반환한다.
* VAD 질문 문구는 NRC VAD Lexicon의 BWS 기반 0~1 연속 점수 체계와 잘 맞도록 paradigm-word anchors를 포함한다.
* `dominance`는 특히 시각적 무게, 명도, 압박감, 짙음/연함 단서를 조절하는 방향으로 매핑한다.
* 이 매핑은 연구용 operational mapping이며, 심리 이론이 시각 표현을 직접 보장한다는 의미로 쓰지 않는다.

### Appraisal modifiers

* `buildAppraisalModifiers()`는 `appraisal` 값을 기반으로 관계, 맥락, 통제감 수식어 배열을 반환한다.
* 이 매핑 역시 연구용 operational mapping이다.

### Final Meshy prompt

* `buildMeshyPrompt()`는 subject, modifiers, styles를 쉼표로 연결한다.
* 최종 결과는 사용자가 Meshy에 붙여 넣을 수 있는 영어 문장이어야 한다.

---

## UI 및 결과 화면 규칙

* 질문 화면의 설명과 선택지는 한국어로 유지한다.
* 화면의 단계 라벨은 `Find`, `Focus`, `Flesh out`를 사용한다.
* 결과 화면은 다음 항목을 각각 확인할 수 있게 보여준다.

  * `Raw Survey Response JSON`
  * `Emotion Carrier only`
  * `Emotion Carrier + VAD`
  * `Emotion Carrier + Appraisal`
  * `Emotion Carrier + VAD + Appraisal`

* 각 프롬프트는 복사할 수 있어야 한다.
* 원본 JSON은 개발용 확인 영역에서 볼 수 있어야 한다.

---

## 파일 및 폴더 구조 원칙

* 먼저 현재 프로젝트 구조, `package.json`, 기존 컴포넌트와 스타일 방식을 확인한 뒤 수정한다.
* 기존 코드 스타일과 폴더 구조를 최대한 유지한다.
* 필요한 경우에만 아래 파일을 사용하거나 보강한다.

```text
src/
  data/
    surveyFlow.ts
    emotionCarrierPromptMap.ts
    vadModifierMap.ts
    appraisalModifierMap.ts
  types/
    survey.ts
    prompt.ts
  utils/
    promptBuilders.ts
    promptConverters/meshyPrompt.ts
  App.tsx
  styles.css
```

* 파일을 새로 만들기 전, 같은 책임을 가진 파일이 이미 있는지 확인한다.
* 기능과 직접 관련 없는 파일은 수정하지 않는다.

---

## 코딩 규칙

* 기존 프로젝트가 TypeScript이면 TypeScript를 유지한다.
* 새 의존성은 가급적 추가하지 않는다.
* 복잡한 상태 관리 라이브러리를 추가하지 않는다.
* 함수와 컴포넌트는 한 가지 책임을 중심으로 작게 유지한다.
* 의미가 분명한 변수명과 함수명을 사용한다.
* 타입 오류를 숨기기 위해 `any`를 임의로 사용하지 않는다.
* 사용자 응답 구조, 프롬프트 생성 결과 구조, 매핑 데이터 구조에는 명시적인 타입을 사용한다.
* 코드 주석이 필요한 경우, 해당 코드의 바로 윗줄에 간결하게 작성한다.
* 사용자가 별도 언어를 지정하지 않으면 설명과 문서는 한국어로 작성한다.

---

## 검증 규칙

기능 구현 후 실행 가능한 검증 명령을 직접 실행한다.

가능하면 다음 명령을 확인한다.

* `npm run typecheck`
* `npm run build`

최소 연결 테스트에서는 다음 흐름이 정상 작동하는지 확인한다.

1. 사용자가 Find / Focus / Flesh out의 각 질문에 응답할 수 있다.
2. 필수 선택값이 비어 있으면 결과 생성 전에 차단된다.
3. 사용자 응답이 명시적인 타입 구조로 관리된다.
4. Emotion Carrier base prompt가 중심 대상만 반영한다.
5. VAD modifiers가 VAD 값에 따라 생성된다.
6. Appraisal modifiers가 appraisal 값에 따라 생성된다.
7. final Meshy prompt가 세 단계 결과를 결합해 생성된다.
8. 각 조건별 결과와 원본 JSON이 화면에서 확인된다.
9. 복사 버튼이 정상적으로 작동한다.
10. 사용자 응답이 콘솔이나 파일에 불필요하게 기록되지 않는다.
11. 빌드 및 타입 검사가 통과한다.

---

## 변경 관리 규칙

* 사용자가 명시적으로 요청하지 않으면 Git commit, push, branch 생성, pull request 생성을 하지 않는다.
* 변경 전에는 수정하거나 새로 만들 파일을 간단히 정리한다.
* 변경 후에는 다음 내용을 반드시 보고한다.

  1. 구현 또는 수정한 내용
  2. 변경한 파일 목록과 각 파일의 역할
  3. 실행 및 테스트 방법
  4. 실제로 검증한 항목
  5. 아직 구현하지 않은 범위
  6. 다음 작업 후보
