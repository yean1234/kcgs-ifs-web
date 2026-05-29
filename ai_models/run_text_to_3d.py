#!/usr/bin/env python3
from __future__ import annotations

import argparse
import gc
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Sequence

import torch


@dataclass
class PromptVariant:
    id: str
    title: str
    prompt: str
    added_modifiers: list[str] = field(default_factory=list)
    description: str = ""


@dataclass
class PromptPack:
    generated_at: str
    raw_survey_response: dict[str, Any] | None
    variants: list[PromptVariant]
    recommended_stage1_settings: dict[str, Any] | None


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "prompt"


def normalize_prompt_text(value: str) -> str:
    return " ".join(value.strip().split())


def resolve_prompt_pack_path(path: Path) -> Path:
    if path.is_dir():
        return path / "prompt-pack.json"
    return path


def load_prompt_pack(path: Path) -> PromptPack:
    data = json.loads(path.read_text(encoding="utf-8"))
    variants_data = data.get("variants", [])
    if not variants_data and isinstance(data.get("prompt"), str):
        variants_data = [
            {
                "id": "manual_prompt",
                "title": data.get("title", "Manual prompt"),
                "prompt": data["prompt"],
                "addedModifiers": data.get("addedModifiers", []),
                "description": data.get("description", "CLI에서 직접 입력한 프롬프트"),
            }
        ]

    variants = [
        PromptVariant(
            id=item["id"],
            title=item.get("title", item["id"]),
            prompt=normalize_prompt_text(item["prompt"]),
            added_modifiers=list(item.get("addedModifiers", [])),
            description=item.get("description", ""),
        )
        for item in variants_data
    ]
    return PromptPack(
        generated_at=data.get("generatedAt", datetime.now(timezone.utc).isoformat()),
        raw_survey_response=data.get("rawSurveyResponse"),
        variants=variants,
        recommended_stage1_settings=data.get("recommendedStage1Settings"),
    )


def save_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def resolve_device(device_name: str) -> torch.device:
    if device_name != "auto":
        return torch.device(device_name)
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def clear_torch_caches(device: torch.device) -> None:
    if device.type == "cuda":
        torch.cuda.empty_cache()
    if device.type == "mps" and hasattr(torch, "mps"):
        torch.mps.empty_cache()
    gc.collect()


def export_scene_or_geometry_to_glb(scene_or_geometry: Any, output_path: Path) -> bool:
    try:
        import trimesh
    except Exception:
        return False

    try:
        if hasattr(scene_or_geometry, "vertices") and hasattr(scene_or_geometry, "faces"):
            geometry = trimesh.Trimesh(
                vertices=scene_or_geometry.vertices,
                faces=scene_or_geometry.faces,
                process=False,
            )
            payload = geometry.export(file_type="glb")
        else:
            scene = trimesh.Scene(scene_or_geometry)
            payload = scene.export(file_type="glb")

        if isinstance(payload, (bytes, bytearray)):
            output_path.write_bytes(payload)
        else:
            output_path.write_text(payload, encoding="utf-8")
        return True
    except Exception:
        return False


def export_point_cloud_glb(coords: Any, colors: Any, output_path: Path) -> bool:
    try:
        import trimesh
        import numpy as np
    except Exception:
        return False

    try:
        color_array = None
        if colors is not None:
            color_array = np.asarray(colors)
            if color_array.ndim == 1:
                color_array = color_array[:, None]
        cloud = trimesh.points.PointCloud(np.asarray(coords), colors=color_array)
        scene = trimesh.Scene(cloud)
        payload = scene.export(file_type="glb")
        if isinstance(payload, (bytes, bytearray)):
            output_path.write_bytes(payload)
        else:
            output_path.write_text(payload, encoding="utf-8")
        return True
    except Exception:
        return False


def run_shap_e(
    prompt: str,
    output_dir: Path,
    device: torch.device,
    model_name: str,
    steps: int,
    guidance_scale: float,
    cache_dir: Path | None,
) -> dict[str, str]:
    from diffusers import ShapEPipeline
    from diffusers.utils import export_to_ply

    ensure_dir(output_dir)
    ply_path = output_dir / "mesh.ply"
    glb_path = output_dir / "mesh.glb"

    dtype = torch.float16 if device.type in {"mps", "cuda"} else torch.float32
    pipe = ShapEPipeline.from_pretrained(
        model_name,
        torch_dtype=dtype,
        cache_dir=str(cache_dir) if cache_dir is not None else None,
    )
    pipe.to(device)

    with torch.inference_mode():
        result = pipe(
            prompt,
            guidance_scale=guidance_scale,
            num_inference_steps=steps,
            output_type="mesh",
        )

    payload = result.images[0] if isinstance(result.images, Sequence) else result.images
    try:
        if hasattr(payload, "export"):
            payload.export(str(ply_path))
        else:
            export_to_ply(payload, str(ply_path))
    except Exception:
        export_to_ply(payload, str(ply_path))

    glb_written = export_scene_or_geometry_to_glb(payload, glb_path)

    del pipe, result, payload
    clear_torch_caches(device)

    return {
        "ply": str(ply_path),
        "glb": str(glb_path) if glb_written else "",
    }


def import_point_e_modules(point_e_repo: Path | None):
    if point_e_repo is not None:
        repo_path = str(point_e_repo.resolve())
        if repo_path not in sys.path:
            sys.path.insert(0, repo_path)

    from point_e.diffusion.configs import DIFFUSION_CONFIGS, diffusion_from_config
    from point_e.diffusion.sampler import PointCloudSampler
    from point_e.models.configs import MODEL_CONFIGS, model_from_config
    from point_e.models.download import load_checkpoint

    return DIFFUSION_CONFIGS, diffusion_from_config, PointCloudSampler, MODEL_CONFIGS, model_from_config, load_checkpoint


def run_point_e(
    prompt: str,
    output_dir: Path,
    device: torch.device,
    cache_dir: Path | None,
    point_e_repo: Path | None,
    guidance_scale: float,
    base_steps: int,
    upsample_steps: int,
) -> dict[str, str]:
    import numpy as np

    (
        DIFFUSION_CONFIGS,
        diffusion_from_config,
        PointCloudSampler,
        MODEL_CONFIGS,
        model_from_config,
        load_checkpoint,
    ) = import_point_e_modules(point_e_repo)

    ensure_dir(output_dir)
    ply_path = output_dir / "point_cloud.ply"
    glb_path = output_dir / "point_cloud.glb"

    model_cache_dir = str(cache_dir) if cache_dir is not None else None

    base_model = model_from_config(MODEL_CONFIGS["base40M-textvec"], device)
    base_model.load_state_dict(
        load_checkpoint("base40M-textvec", device=device, cache_dir=model_cache_dir)
    )
    base_model.eval()

    upsample_model = model_from_config(MODEL_CONFIGS["upsample"], device)
    upsample_model.load_state_dict(load_checkpoint("upsample", device=device, cache_dir=model_cache_dir))
    upsample_model.eval()

    base_diffusion = diffusion_from_config(DIFFUSION_CONFIGS["base40M-textvec"])
    upsample_diffusion = diffusion_from_config(DIFFUSION_CONFIGS["upsample"])

    sampler = PointCloudSampler(
        device=device,
        models=[base_model, upsample_model],
        diffusions=[base_diffusion, upsample_diffusion],
        num_points=[1024, 3072],
        aux_channels=["R", "G", "B"],
        guidance_scale=[guidance_scale, 1.0],
        karras_steps=[base_steps, upsample_steps],
    )

    with torch.inference_mode():
        samples = sampler.sample_batch(batch_size=1, model_kwargs={"texts": [prompt]})
    point_cloud = sampler.output_to_point_clouds(samples)[0]

    with ply_path.open("wb") as f:
        point_cloud.write_ply(f)

    colors = None
    if all(name in point_cloud.channels for name in ("R", "G", "B")):
        colors = np.stack([point_cloud.channels[name] for name in ("R", "G", "B")], axis=1)
    glb_written = export_point_cloud_glb(point_cloud.coords, colors, glb_path)

    del sampler, base_model, upsample_model, samples, point_cloud
    clear_torch_caches(device)

    return {
        "ply": str(ply_path),
        "glb": str(glb_path) if glb_written else "",
    }


def build_variants(
    pack: PromptPack | None,
    prompt: str | None,
    selected_variant_ids: set[str] | None,
) -> list[PromptVariant]:
    if pack is None:
        if prompt is None:
            raise ValueError("prompt 또는 input prompt pack 중 하나는 필요합니다.")
        return [
            PromptVariant(
                id="manual_prompt",
                title="Manual prompt",
                prompt=normalize_prompt_text(prompt),
                description="CLI에서 직접 입력한 프롬프트",
            )
        ]

    variants = pack.variants
    if selected_variant_ids:
        variants = [variant for variant in variants if variant.id in selected_variant_ids]
    if not variants:
        raise ValueError(
            "입력 JSON에 variants가 없습니다. "
            "이 스크립트는 웹에서 내려받은 prompt pack JSON 또는 top-level prompt 문자열을 기대합니다. "
            "지금 파일은 raw survey response만 들어 있는 형식처럼 보이므로, 먼저 웹에서 prompt pack JSON을 내려받거나 "
            "--prompt로 직접 프롬프트를 넣어 주세요."
        )
    return variants


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export prompt pack variants to Shap-E and Point-E outputs."
    )
    parser.add_argument("--input", type=Path, help="웹에서 내보낸 prompt pack JSON")
    parser.add_argument("--prompt", type=str, help="단일 프롬프트를 직접 실행할 때 사용")
    parser.add_argument(
        "--variant",
        action="append",
        dest="variants",
        help="실행할 variant id. 여러 번 지정할 수 있습니다.",
    )
    parser.add_argument(
        "--models",
        nargs="*",
        default=["shap-e", "point-e"],
        choices=["shap-e", "point-e"],
        help="실행할 모델",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("ai_models/outputs"),
        help="결과를 저장할 폴더",
    )
    parser.add_argument(
        "--device",
        choices=["auto", "mps", "cuda", "cpu"],
        default="auto",
        help="실행 디바이스",
    )
    parser.add_argument(
        "--point-e-repo",
        type=Path,
        help="로컬 Point-E 저장소 경로",
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=Path("ai_models/cache"),
        help="모델 캐시 폴더",
    )
    parser.add_argument(
        "--shap-e-model",
        type=str,
        default="openai/shap-e",
        help="Hugging Face Diffusers에서 사용할 Shap-E 모델 식별자",
    )
    parser.add_argument(
        "--shap-e-steps",
        type=int,
        default=64,
        help="Shap-E diffusion step 수",
    )
    parser.add_argument(
        "--shap-e-guidance-scale",
        type=float,
        default=15.0,
        help="Shap-E guidance scale",
    )
    parser.add_argument(
        "--point-e-guidance-scale",
        type=float,
        default=3.0,
        help="Point-E guidance scale",
    )
    parser.add_argument(
        "--point-e-base-steps",
        type=int,
        default=64,
        help="Point-E base stage Karras step 수",
    )
    parser.add_argument(
        "--point-e-upsample-steps",
        type=int,
        default=64,
        help="Point-E upsample stage Karras step 수",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = resolve_prompt_pack_path(args.input) if args.input else None
    pack = load_prompt_pack(input_path) if input_path else None
    selected_variant_ids = set(args.variants or [])
    variants = build_variants(pack, args.prompt, selected_variant_ids or None)

    device = resolve_device(args.device)
    output_root = args.output_dir / datetime.now().strftime("%Y%m%d-%H%M%S")
    ensure_dir(output_root)
    ensure_dir(output_root / "variants")
    ensure_dir(args.cache_dir)

    if pack is not None and input_path is not None:
        (output_root / "prompt_pack.json").write_text(
            input_path.read_text(encoding="utf-8"),
            encoding="utf-8",
        )
    elif args.prompt is not None:
        save_json(
            output_root / "prompt_pack.json",
            {
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "rawSurveyResponse": None,
                "variants": [
                    {
                        "id": "manual_prompt",
                        "title": "Manual prompt",
                        "prompt": normalize_prompt_text(args.prompt),
                        "addedModifiers": [],
                        "description": "CLI에서 직접 입력한 프롬프트",
                    }
                ],
                "recommendedStage1Settings": None,
            },
        )

    manifest: dict[str, Any] = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "device": str(device),
        "models": list(args.models),
        "source": str(input_path) if input_path else "manual_prompt",
        "variants": [],
    }

    for variant in variants:
        variant_dir = output_root / "variants" / slugify(variant.id)
        ensure_dir(variant_dir)
        (variant_dir / "prompt.txt").write_text(variant.prompt, encoding="utf-8")

        variant_record: dict[str, Any] = {
            "id": variant.id,
            "title": variant.title,
            "prompt": variant.prompt,
            "description": variant.description,
            "addedModifiers": variant.added_modifiers,
            "results": {},
        }

        if "shap-e" in args.models:
            shap_e_dir = variant_dir / "shap-e"
            ensure_dir(shap_e_dir)
            try:
                variant_record["results"]["shap-e"] = run_shap_e(
                    prompt=variant.prompt,
                    output_dir=shap_e_dir,
                    device=device,
                    model_name=args.shap_e_model,
                    steps=args.shap_e_steps,
                    guidance_scale=args.shap_e_guidance_scale,
                    cache_dir=args.cache_dir,
                )
            except Exception as exc:
                variant_record["results"]["shap-e"] = {"error": str(exc)}
                clear_torch_caches(device)

        if "point-e" in args.models:
            point_e_dir = variant_dir / "point-e"
            ensure_dir(point_e_dir)
            try:
                variant_record["results"]["point-e"] = run_point_e(
                    prompt=variant.prompt,
                    output_dir=point_e_dir,
                    device=device,
                    cache_dir=args.cache_dir,
                    point_e_repo=args.point_e_repo,
                    guidance_scale=args.point_e_guidance_scale,
                    base_steps=args.point_e_base_steps,
                    upsample_steps=args.point_e_upsample_steps,
                )
            except Exception as exc:
                variant_record["results"]["point-e"] = {"error": str(exc)}
                clear_torch_caches(device)

        manifest["variants"].append(variant_record)

    save_json(output_root / "manifest.json", manifest)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f"\nSaved outputs to: {output_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
