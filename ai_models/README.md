# ai_models

이 폴더는 `kcgs-ifs-web`에서 만든 텍스트 프롬프트를 로컬 Python 모델로 돌리기 위한 실행 영역입니다.

목표는 다음과 같습니다.

1. 웹에서 내보낸 prompt pack JSON을 읽는다.
2. 같은 프롬프트에 대해 Shap-E와 Point-E를 각각 실행한다.
3. 결과를 `PLY`와 `GLB` 파일로 저장한다.
4. 나중에 브라우저나 뷰어에서 결과를 비교한다.

## 왜 별도 환경인가

- 웹 프로젝트는 TypeScript/Vite 기반입니다.
- Shap-E와 Point-E는 Python 기반 모델입니다.
- 의존성 충돌을 피하려면 Python 가상환경을 따로 두는 것이 가장 단순합니다.

## 권장 설치 순서

### macOS / Linux / WSL

```bash
cd /Users/parkseoyeon/Junior/KCGS/kcgs-ifs-web
python3 -m venv ai_models/.venv
source ai_models/.venv/bin/activate
pip install --upgrade pip
pip install -r ai_models/requirements.txt
```

Point-E는 공식 저장소를 별도로 클론한 뒤 editable install 하는 방식을 권장합니다.

```bash
git clone https://github.com/openai/point-e.git ai_models/vendor/point-e
pip install -e ai_models/vendor/point-e
```

Shap-E는 Hugging Face Diffusers의 `ShapEPipeline`을 사용합니다. 공식 Shap-E 저장소는 텍스트 조건 3D 예시 노트북을 제공하고, Point-E 공식 저장소는 `text2pointcloud.ipynb`와 `pointcloud2mesh.ipynb` 예시를 제공합니다.

### Windows PowerShell

```powershell
cd C:\Users\parkseoyeon\Junior\KCGS\kcgs-ifs-web
py -3 -m venv ai_models\.venv
.\ai_models\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r ai_models\requirements.txt
```

Point-E는 Windows에서도 같은 방식으로 별도 저장소를 클론한 뒤 editable install 하면 됩니다.

```powershell
git clone https://github.com/openai/point-e.git ai_models\vendor\point-e
pip install -e ai_models\vendor\point-e
```

Windows에서 NVIDIA GPU를 쓸 경우, PyTorch 공식 Windows 설치 안내에 맞는 CUDA 빌드를 설치해야 합니다. GPU가 없으면 CPU로도 실행할 수 있습니다.

## MPS / Apple Silicon

스크립트는 기본적으로 다음 순서로 디바이스를 고릅니다.

1. `mps`
2. `cuda`
3. `cpu`

Mac M1/M2에서는 MPS가 보이면 그 장치를 우선 사용합니다.

## 웹에서 가져올 입력

웹 앱에서 prompt pack JSON을 다운로드한 뒤, 이 스크립트의 `--input`으로 넘기면 됩니다.

이 JSON은 보통 다음 구조를 가집니다.

```json
{
  "generatedAt": "2026-05-29T12:00:00.000Z",
  "rawSurveyResponse": { ... },
  "variants": [
    {
      "id": "emotion_carrier_only",
      "title": "Emotion Carrier only",
      "prompt": "a curled-up child figure ...",
      "addedModifiers": [],
      "description": "..."
    }
  ],
  "recommendedStage1Settings": {
    "samples": 1,
    "sampler": "ddim",
    "steps": 200,
    "cfgScale": 7.5,
    "seed": 0
  }
}
```

개발 모드에서는 웹 화면의 결과 확인 시점에 dev 서버가 자동으로
`ai_models/inputs/generated/<participantId>/<timestamp>` 아래에 같은 형식의 JSON 파일들을 저장하고,
항상 최신 결과를 가리키는 `ai_models/inputs/generated/<participantId>/latest`도 함께 갱신합니다.
이때 생성되는 파일은 다음과 같습니다.

- `prompt-pack.json`
- `emotion_carrier_only.json`
- `emotion_carrier_vad.json`
- `emotion_carrier_appraisal.json`
- `emotion_carrier_vad_appraisal.json`
- `manifest.json`

## 실행 예시

### 전체 변형을 Shap-E와 Point-E 둘 다 돌리기

```bash
source ai_models/.venv/bin/activate
python ai_models/run_text_to_3d.py \
  --input ai_models/inputs/generated/user1/latest \
  --point-e-repo ai_models/vendor/point-e \
  --models shap-e point-e \
  --output-dir ai_models/outputs
```

Windows PowerShell에서는 다음처럼 실행할 수 있습니다.

```powershell
.\ai_models\.venv\Scripts\Activate.ps1
python ai_models\run_text_to_3d.py `
  --input ai_models/inputs/generated/user1/latest `
  --point-e-repo ai_models/vendor\point-e `
  --models shap-e point-e `
  --output-dir ai_models\outputs
```

### 특정 변형만 돌리기

```bash
python ai_models/run_text_to_3d.py \
  --input ai_models/inputs/generated/latest \
  --point-e-repo ai_models/vendor/point-e \
  --variant emotion_carrier_vad_appraisal \
  --models shap-e point-e
```

### 단일 프롬프트 빠른 테스트

```bash
python ai_models/run_text_to_3d.py \
  --prompt "a softly luminous and gentle object" \
  --models shap-e point-e
```

## 결과물

기본 출력 폴더는 다음처럼 정리됩니다.

```text
ai_models/outputs/<timestamp>/
  manifest.json
  prompt_pack.json
  variants/
    emotion_carrier_only/
      prompt.txt
      shap-e/
        mesh.ply
        mesh.glb
      point-e/
        point_cloud.ply
        point_cloud.glb
```

## 참고

- 이 폴더는 연구용 로컬 실행 영역입니다.
- 웹 앱은 계속 프롬프트 생성까지만 담당합니다.
- 실제 3D 생성은 이 폴더의 Python 스크립트에서만 수행합니다.
