import { useEffect, useMemo, useState } from "react";
import { APPRAISAL_GUIDANCE, SECTION_META } from "./data/surveyFlow";
import type {
  AnswerMap,
  AnswerRecord,
  QuestionId,
  RawSurveyResponse,
  SurveyQuestion,
  SurveySectionId,
} from "./types/survey";
import type { PromptComparisonArtifacts } from "./types/prompt";
import { buildPromptComparison } from "./utils/buildPromptComparison";
import { buildThreeDTopiaPromptPack } from "./utils/threeDtopiaExport";
import {
  buildRawSurveyResponse,
  createEmptyAnswerMap,
  formatScaleValue,
  getAnswer,
  getAnswerDisplayText,
  getQuestion,
  getQuestionValidationMessage,
  getVisibleQuestionIds,
  isQuestionComplete,
} from "./utils/surveyFlow";

const SECTION_ORDER: SurveySectionId[] = ["find", "focus", "flesh_out"];

type CopyTarget =
  | "raw_survey_response"
  | "three_dtopia_emotion_carrier_only"
  | "three_dtopia_emotion_carrier_vad"
  | "three_dtopia_emotion_carrier_appraisal"
  | "three_dtopia_emotion_carrier_vad_appraisal";

type CopyFeedback = {
  target: CopyTarget;
  kind: "success" | "error";
} | null;

type SummaryEntry = {
  questionId: QuestionId;
  question: SurveyQuestion;
  value: string;
};

type QuestionCardProps = {
  question: SurveyQuestion;
  answer: AnswerRecord;
  questionIndex: number;
  totalQuestions: number;
  sectionLabel: string;
  sectionIntro: string;
  canGoBack: boolean;
  canProceed: boolean;
  isLastQuestion: boolean;
  validationMessage: string | null;
  onSelectValue: (questionId: QuestionId, value: string) => void;
  onToggleValue: (questionId: QuestionId, value: string) => void;
  onTextChange: (questionId: QuestionId, value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

type SummaryPanelProps = {
  entries: SummaryEntry[];
  totalVisibleQuestions: number;
  isCompleted: boolean;
};

type ResultPanelProps = {
  rawSurveyResponse: RawSurveyResponse;
  comparison: PromptComparisonArtifacts;
  copyFeedback: CopyFeedback;
  onCopyText: (target: CopyTarget, text: string) => void;
  onRestart: () => void;
};

type ResultCardProps = {
  title: string;
  copyTarget: CopyTarget;
  copyButtonLabel: string;
  content: string;
  copyFeedback: CopyFeedback;
  onCopyText: (target: CopyTarget, text: string) => void;
  description?: string;
};

function QuestionCard({
  question,
  answer,
  questionIndex,
  totalQuestions,
  sectionLabel,
  sectionIntro,
  canGoBack,
  canProceed,
  isLastQuestion,
  validationMessage,
  onSelectValue,
  onToggleValue,
  onTextChange,
  onBack,
  onNext,
}: QuestionCardProps) {
  const showCustomInput =
    question.type === "single_select" && answer.selectedValue === "custom";
  const selectedMultiValues = question.type === "multi_select" ? answer.selectedValues : [];
  const scaleValue =
    question.type === "slider" && answer.selectedValue !== null
      ? Number(answer.selectedValue)
      : null;
  const fallbackValue =
    question.type === "slider" && question.scale
      ? (question.scale.min + question.scale.max) / 2
      : 0;
  const renderedScaleValue = scaleValue ?? fallbackValue;
  const renderedScaleLabel =
    question.type === "slider" && question.scale
      ? formatScaleValue(question, renderedScaleValue)
      : null;

  return (
    <section className="card question-card">
      <div className="question-meta">
        <div>
          <p className="eyebrow">{sectionLabel}</p>
          <p className="question-count">
            문항 {questionIndex + 1} / {totalQuestions}
          </p>
        </div>
        {isLastQuestion ? <span className="status-pill">마지막 문항</span> : null}
      </div>

      <div className="intro-block">
        <p>{sectionIntro}</p>
      </div>

      <h2 className="question-prompt">{question.prompt}</h2>

      {question.type === "single_select" ? (
        <div className="option-list" role="radiogroup" aria-label={question.prompt}>
          {question.options?.map((option) => {
            const optionId = `${question.id}-${option.value}`;
            const isSelected = answer.selectedValue === option.value;

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={`option-card${isSelected ? " selected" : ""}`}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onSelectValue(question.id, option.value)}
                />
                <span className="option-label">{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : question.type === "multi_select" ? (
        <div className="option-list" role="group" aria-label={question.prompt}>
          {question.options?.map((option) => {
            const optionId = `${question.id}-${option.value}`;
            const isSelected = selectedMultiValues.includes(option.value);

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={`option-card${isSelected ? " selected" : ""}`}
              >
                <input
                  id={optionId}
                  type="checkbox"
                  name={question.id}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onToggleValue(question.id, option.value)}
                />
                <span className="option-label">{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : question.type === "textarea" ? (
        <div className="text-field">
          <textarea
            className="text-area"
            value={answer.textValue}
            onChange={(event) => onTextChange(question.id, event.target.value)}
            placeholder={question.placeholder ?? "여기에 적어 주세요."}
            rows={7}
          />
        </div>
      ) : (
        <div className="scale-block">
          <div className="scale-value-row">
            <span className="scale-value-label">현재값</span>
            <strong className="scale-value-number">
              {answer.selectedValue === null
                ? "미선택"
                : renderedScaleLabel ?? answer.selectedValue}
            </strong>
          </div>

          <input
            className="scale-slider"
            type="range"
            min={question.scale?.min ?? 1}
            max={question.scale?.max ?? 9}
            step={question.scale?.step ?? 1}
            value={renderedScaleValue}
            onChange={(event) => onSelectValue(question.id, event.target.value)}
          />

          <div className="scale-label-row" aria-hidden="true">
            <span>{question.scale?.leftLabel ?? ""}</span>
            <span>{question.scale?.centerLabel ?? ""}</span>
            <span>{question.scale?.rightLabel ?? ""}</span>
          </div>
        </div>
      )}

      {showCustomInput ? (
        <div className="custom-input-block">
          <label className="custom-input-label" htmlFor={`${question.id}-custom`}>
            직접 입력 내용 (영어)
          </label>
          <textarea
            id={`${question.id}-custom`}
            className="text-area text-area-custom"
            value={answer.textValue}
            onChange={(event) => onTextChange(question.id, event.target.value)}
            placeholder={question.customPlaceholder ?? "Please enter the text in English."}
            rows={4}
          />
        </div>
      ) : null}

      {validationMessage ? <p className="validation-note">{validationMessage}</p> : null}

      <div className="nav-row">
        <button
          type="button"
          className="button secondary"
          onClick={onBack}
          disabled={!canGoBack}
        >
          이전
        </button>
        <button
          type="button"
          className="button primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          {isLastQuestion ? "결과 확인" : "다음"}
        </button>
      </div>
    </section>
  );
}

function SummaryPanel({
  entries,
  totalVisibleQuestions,
  isCompleted,
}: SummaryPanelProps) {
  return (
    <aside className="card summary-panel">
      <div className="summary-head">
        <div>
          <p className="eyebrow">응답 요약</p>
          <h2>{isCompleted ? "전체 응답" : "지금까지 저장된 응답"}</h2>
        </div>
        <span className="status-pill">
          {entries.length} / {totalVisibleQuestions}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="empty-state">아직 저장된 응답이 없습니다.</p>
      ) : (
        <div className="summary-list">
          {entries.map((entry) => (
            <article key={entry.questionId} className="summary-item">
              <p className="summary-step">{SECTION_META[entry.question.section].label}</p>
              <p className="summary-question">{entry.question.prompt}</p>
              <p className="summary-value">{entry.value}</p>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function ResultCard({
  title,
  copyTarget,
  copyButtonLabel,
  content,
  copyFeedback,
  onCopyText,
  description,
}: ResultCardProps) {
  const isCopied = copyFeedback?.target === copyTarget && copyFeedback.kind === "success";
  const isCopyError = copyFeedback?.target === copyTarget && copyFeedback.kind === "error";
  const displayedContent = content.length > 0 ? content : "없음";

  return (
    <article className="prompt-card">
      <div className="prompt-card-head">
        <div>
          <h3 className="prompt-card-title">{title}</h3>
          {description ? <p className="prompt-card-description">{description}</p> : null}
        </div>
      </div>

      <pre className="prompt-output">{displayedContent}</pre>

      <div className="prompt-card-footer">
        <button
          type="button"
          className="button secondary"
          onClick={() => onCopyText(copyTarget, displayedContent)}
        >
          {copyButtonLabel}
        </button>
        {isCopied ? <p className="prompt-feedback success">복사했습니다.</p> : null}
        {isCopyError ? (
          <p className="prompt-feedback error">복사에 실패했습니다. 브라우저 권한을 확인해 주세요.</p>
        ) : null}
      </div>
    </article>
  );
}

function ResultPanel({
  rawSurveyResponse,
  comparison,
  copyFeedback,
  onCopyText,
  onRestart,
}: ResultPanelProps) {
  const rawSurveyResponseText = useMemo(
    () => JSON.stringify(rawSurveyResponse, null, 2),
    [rawSurveyResponse],
  );
  const threeDTopiaPromptPack = useMemo(
    () => buildThreeDTopiaPromptPack(comparison),
    [comparison],
  );
  const threeDTopiaPromptPackText = useMemo(
    () => JSON.stringify(threeDTopiaPromptPack, null, 2),
    [threeDTopiaPromptPack],
  );
  const handleDownloadPromptPack = () => {
    const blob = new Blob([threeDTopiaPromptPackText], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `3dtopia-prompt-pack-${new Date().toISOString().replace(/:/g, "-")}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="card result-panel">
      <div className="result-head">
        <div>
          <p className="eyebrow">3DTopia 실행용 프롬프트 결과</p>
          <h2>Find / Focus를 거친 뒤 Flesh out에서 로컬 실행용 프롬프트를 만듭니다</h2>
          <p className="helper-copy">
            Find와 Focus는 IFS 맥락으로 보존하고, Flesh out에서 중심 이미지, 분위기, 관계를 붙여 3DTopia stage1에 넣을 프롬프트를 구성합니다.
          </p>
          <p className="helper-copy">원본 JSON은 아래 개발용 접기 영역에서 확인할 수 있습니다.</p>
          <p className="helper-copy">
            아래 3DTopia 실행용 프롬프트 묶음을 다운로드하면, 로컬에서 stage1 입력 파일로
            사용할 수 있습니다.
          </p>
        </div>

        <div className="result-actions">
          <button type="button" className="button primary" onClick={onRestart}>
            처음부터 다시 작성
          </button>
        </div>
      </div>

      <section className="prompt-export-panel">
        <div className="result-head">
          <div>
            <p className="eyebrow">3DTopia 실행용 프롬프트</p>
            <h2>웹에서는 프롬프트만 만들고, 로컬에서 모델을 생성합니다</h2>
            <p className="helper-copy">
              아래 네 개의 프롬프트는 각각 3DTopia stage1의 `--text` 입력으로 넘길 수 있는
              full prompt입니다.
            </p>
          </div>

          <div className="result-actions">
            <button type="button" className="button secondary" onClick={handleDownloadPromptPack}>
              JSON 다운로드
            </button>
          </div>
        </div>

        <div className="prompt-results-grid">
          <ResultCard
            title="Emotion Carrier only"
            description="중심 형상만 반영한 3DTopia 실행용 프롬프트"
            copyTarget="three_dtopia_emotion_carrier_only"
            copyButtonLabel="프롬프트 복사"
            content={threeDTopiaPromptPack.variants[0].prompt}
            copyFeedback={copyFeedback}
            onCopyText={onCopyText}
          />

          <ResultCard
            title="Emotion Carrier + VAD"
            description="Emotion Carrier에 VAD 시각 수식어가 추가된 프롬프트"
            copyTarget="three_dtopia_emotion_carrier_vad"
            copyButtonLabel="프롬프트 복사"
            content={threeDTopiaPromptPack.variants[1].prompt}
            copyFeedback={copyFeedback}
            onCopyText={onCopyText}
          />

          <ResultCard
            title="Emotion Carrier + Appraisal"
            description="Emotion Carrier에 Appraisal 시각 수식어가 추가된 프롬프트"
            copyTarget="three_dtopia_emotion_carrier_appraisal"
            copyButtonLabel="프롬프트 복사"
            content={threeDTopiaPromptPack.variants[2].prompt}
            copyFeedback={copyFeedback}
            onCopyText={onCopyText}
          />

          <ResultCard
            title="Emotion Carrier + VAD + Appraisal"
            description="Emotion Carrier에 VAD와 Appraisal이 모두 반영된 최종 프롬프트"
            copyTarget="three_dtopia_emotion_carrier_vad_appraisal"
            copyButtonLabel="프롬프트 복사"
            content={threeDTopiaPromptPack.variants[3].prompt}
            copyFeedback={copyFeedback}
            onCopyText={onCopyText}
          />
        </div>
      </section>

      <details className="raw-response-details">
        <summary>개발용 원본 응답 데이터 확인</summary>
        <div className="debug-data-stack">
          <div className="debug-data-item">
            <p className="debug-data-title">Raw Survey Response JSON</p>
            <pre className="raw-response-json">{rawSurveyResponseText}</pre>
          </div>

          <div className="prompt-card-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => onCopyText("raw_survey_response", rawSurveyResponseText)}
            >
              JSON 복사
            </button>
            {copyFeedback?.target === "raw_survey_response" && copyFeedback.kind === "success" ? (
              <p className="prompt-feedback success">복사했습니다.</p>
            ) : null}
            {copyFeedback?.target === "raw_survey_response" && copyFeedback.kind === "error" ? (
              <p className="prompt-feedback error">복사에 실패했습니다. 브라우저 권한을 확인해 주세요.</p>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}

function App() {
  const [answers, setAnswers] = useState<AnswerMap>(() => createEmptyAnswerMap());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submittedRawSurveyResponse, setSubmittedRawSurveyResponse] =
    useState<RawSurveyResponse | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);

  const questionIds = getVisibleQuestionIds(answers);
  const safeQuestionIndex = Math.min(currentIndex, questionIds.length - 1);
  const currentQuestionId = questionIds[safeQuestionIndex];
  const currentQuestion = getQuestion(currentQuestionId);
  const currentAnswer = getAnswer(currentQuestionId, answers);
  const currentSection = SECTION_META[currentQuestion.section];
  const currentQuestionIntro =
    currentQuestionId === "APPRAISAL_Q1_GOAL_RELEVANCE"
      ? `${APPRAISAL_GUIDANCE}\n\n${currentSection.intro}`
      : currentSection.intro;
  const sectionIndex = SECTION_ORDER.indexOf(currentQuestion.section);
  const currentProgress = submittedRawSurveyResponse
    ? 100
    : ((safeQuestionIndex + 1) / questionIds.length) * 100;
  const canProceed = isQuestionComplete(currentQuestion, currentAnswer);
  const validationMessage = getQuestionValidationMessage(currentQuestion, currentAnswer);
  const isLastQuestion = safeQuestionIndex === questionIds.length - 1;
  const isCompleted = submittedRawSurveyResponse !== null;
  const comparisonArtifacts = useMemo(
    () => (submittedRawSurveyResponse ? buildPromptComparison(submittedRawSurveyResponse) : null),
    [submittedRawSurveyResponse],
  );
  const summaryEntries: SummaryEntry[] = questionIds
    .slice(0, isCompleted ? questionIds.length : safeQuestionIndex)
    .map((questionId) => {
      const question = getQuestion(questionId);
      const value = getAnswerDisplayText(question, getAnswer(questionId, answers));

      if (value.length === 0) {
        return null;
      }

      return {
        questionId,
        question,
        value,
      };
    })
    .filter((entry): entry is SummaryEntry => entry !== null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex, submittedRawSurveyResponse]);

  useEffect(() => {
    if (!copyFeedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCopyFeedback(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  const handleSelectValue = (questionId: QuestionId, value: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: {
        ...previous[questionId],
        selectedValue: value,
        selectedValues: [],
      },
    }));

    setSubmittedRawSurveyResponse(null);
    setCopyFeedback(null);
  };

  const handleToggleValue = (questionId: QuestionId, value: string) => {
    setAnswers((previous) => {
      const currentAnswer = previous[questionId];
      const nextSelectedValues = currentAnswer.selectedValues.includes(value)
        ? currentAnswer.selectedValues.filter((selectedValue) => selectedValue !== value)
        : value === "unknown"
          ? ["unknown"]
          : [...currentAnswer.selectedValues.filter((selectedValue) => selectedValue !== "unknown"), value];

      return {
        ...previous,
        [questionId]: {
          ...currentAnswer,
          selectedValue: null,
          selectedValues: nextSelectedValues,
        },
      };
    });

    setSubmittedRawSurveyResponse(null);
    setCopyFeedback(null);
  };

  const handleTextChange = (questionId: QuestionId, value: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: {
        ...previous[questionId],
        textValue: value,
      },
    }));

    setSubmittedRawSurveyResponse(null);
    setCopyFeedback(null);
  };

  const handleNext = () => {
    if (!canProceed) {
      return;
    }

    if (isLastQuestion) {
      const response = buildRawSurveyResponse(answers);
      if (response) {
        setSubmittedRawSurveyResponse(response);
        setCopyFeedback(null);
      }
      return;
    }

    setCurrentIndex((index) => Math.min(index + 1, questionIds.length - 1));
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      return;
    }

    setCurrentIndex((index) => Math.max(index - 1, 0));
    setSubmittedRawSurveyResponse(null);
    setCopyFeedback(null);
  };

  const handleRestart = () => {
    setAnswers(createEmptyAnswerMap());
    setCurrentIndex(0);
    setSubmittedRawSurveyResponse(null);
    setCopyFeedback(null);
  };

  const handleCopyText = async (target: CopyTarget, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback({ target, kind: "success" });
    } catch {
      setCopyFeedback({ target, kind: "error" });
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <main className="container">
        <section className="hero card">
          <p className="eyebrow">연구용 구조화 설문</p>
          <h1>Find, Focus, Flesh out를 차례로 정리합니다</h1>
          <p className="hero-copy">
            Find와 Focus로 IFS 맥락을 붙잡고, Flesh out에서 중심 이미지와 수정어를 정리해 Meshy용 프롬프트를 만듭니다.
          </p>

          <div className="step-rail" aria-label="설문 단계">
            {SECTION_ORDER.map((sectionId, index) => {
              const isActive = isCompleted ? true : sectionIndex === index;
              const isDone = isCompleted || sectionIndex > index;

              return (
                <div
                  key={sectionId}
                  className={`step-chip${isActive ? " active" : ""}${isDone ? " done" : ""}`}
                >
                  <span className="step-chip-label">{SECTION_META[sectionId].label}</span>
                  <span className="step-chip-status">
                    {isCompleted || isDone ? "완료" : isActive ? "진행 중" : "대기"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="progress-track" aria-hidden="true">
            <div className="progress-bar" style={{ width: `${currentProgress}%` }} />
          </div>
        </section>

        <section className="survey-grid">
          <div className="survey-main">
            {!isCompleted ? (
              <QuestionCard
                question={currentQuestion}
                answer={currentAnswer}
                questionIndex={safeQuestionIndex}
                totalQuestions={questionIds.length}
                sectionLabel={currentSection.label}
                sectionIntro={currentQuestionIntro}
                canGoBack={currentIndex > 0}
                canProceed={canProceed}
                isLastQuestion={isLastQuestion}
                validationMessage={validationMessage}
                onSelectValue={handleSelectValue}
                onToggleValue={handleToggleValue}
                onTextChange={handleTextChange}
                onBack={handleBack}
                onNext={handleNext}
              />
            ) : (
              <ResultPanel
                rawSurveyResponse={submittedRawSurveyResponse!}
                comparison={comparisonArtifacts!}
                copyFeedback={copyFeedback}
                onCopyText={handleCopyText}
                onRestart={handleRestart}
              />
            )}
          </div>

          <SummaryPanel
            entries={summaryEntries}
            totalVisibleQuestions={questionIds.length}
            isCompleted={isCompleted}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
