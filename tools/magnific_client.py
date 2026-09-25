"""Thin, verified client for the Magnific API (https://docs.magnific.com).

* Auth: header `x-magnific-api-key` (env MAGNIFIC_API_KEY or .env in the project root).
* Every generation endpoint is asynchronous: POST -> {data:{task_id,status,generated[]}},
  then GET <same path>/<task_id> until status is COMPLETED or FAILED.
* Result URLs are temporary: this client downloads them immediately.
* `--dry-run` prints the exact payload (with reference sizes) and spends no credits.

CLI examples (run from the project root):
  python tools/magnific_client.py --probe
  python tools/magnific_client.py --model gpt-image-2-edit --prompt "..." --ref a.png --ref b.png \
        --aspect square_1_1 --quality low --n 1 --out assets_src/raw/test
"""
from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import json
import os
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://api.magnific.com/v1"
COST_LOG = ROOT / "assets_src" / "cost_log.csv"
CACHE_DIR = ROOT / "assets_src" / ".cache"

# Endpoint registry. `refs` = request field carrying reference images; `ref_style`:
#   "b64"      -> array of raw base64 strings (or https URLs)
#   "b64_field" -> single base64 string in one field (Mystic style_reference)
#   "url_obj"  -> [{"image": url, "mime_type": ..}] (Nano Banana Pro Flash; URLs only)
#   "numbered" -> input_image, input_image_2.. (Flux 2)
MODELS = {
    "gpt-image-2-edit": {
        "path": "/ai/text-to-image/gpt-image-2-edit", "refs": "reference_images",
        "ref_style": "b64", "refs_max": 16,
        "params": ["num_images", "resolution", "aspect_ratio", "quality", "output_format",
                   "output_compression", "background", "moderation", "webhook_url"],
    },
    "gpt-image-2": {
        "path": "/ai/text-to-image/gpt-image-2", "refs": None,
        "params": ["num_images", "resolution", "aspect_ratio", "quality", "output_format",
                   "output_compression", "background", "moderation", "webhook_url"],
    },
    "seedream-v5-pro-edit": {
        "path": "/ai/text-to-image/seedream-v5-pro-edit", "refs": "reference_images",
        "ref_style": "b64", "refs_max": 10,
        "params": ["resolution", "aspect_ratio", "seed", "webhook_url"],
    },
    "seedream-v4-5-edit": {
        "path": "/ai/text-to-image/seedream-v4-5-edit", "refs": "reference_images",
        "ref_style": "b64", "refs_max": 5,
        "params": ["aspect_ratio", "seed", "enable_safety_checker", "webhook_url"],
    },
    "mystic": {
        "path": "/ai/mystic", "refs": "style_reference", "ref_style": "b64_field", "refs_max": 1,
        "params": ["structure_reference", "structure_strength", "adherence", "hdr", "resolution",
                   "aspect_ratio", "model", "creative_detailing", "engine", "fixed_generation",
                   "filter_nsfw", "styling", "webhook_url"],
    },
    "nano-banana-pro-flash": {
        "path": "/ai/text-to-image/nano-banana-pro-flash", "refs": "reference_images",
        "ref_style": "url_obj", "refs_max": 14,
        "params": ["aspect_ratio", "resolution", "use_google_search_tool", "webhook_url"],
    },
    "flux-2-pro": {
        "path": "/ai/text-to-image/flux-2-pro", "refs": "input_image", "ref_style": "numbered",
        "refs_max": 4,
        "params": ["width", "height", "seed", "prompt_upsampling", "webhook_url"],
    },
    "image-style-transfer": {
        "path": "/ai/image-style-transfer", "refs": "reference_image", "ref_style": "b64_field",
        "refs_max": 1,
        "params": ["image", "style_strength", "structure_strength", "is_portrait", "portrait_style",
                   "portrait_beautifier", "flavor", "engine", "fixed_generation", "webhook_url"],
    },
}

# Credits multipliers documented for GPT Image 2 (base unit = 1k / low). Used for the ledger only.
GPT_QUALITY_MULT = {"low": 1, "medium": 4, "high": 6}
GPT_RES_MULT = {"1k": 1, "2k": 2, "4k": 3}


class MagnificError(RuntimeError):
    pass


def load_api_key() -> str | None:
    key = os.environ.get("MAGNIFIC_API_KEY")
    if key:
        return key.strip()
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("MAGNIFIC_API_KEY=") and len(line) > len("MAGNIFIC_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def _b64_file(path: Path) -> str:
    return base64.b64encode(Path(path).read_bytes()).decode("ascii")


class MagnificClient:
    def __init__(self, api_key: str | None = None, dry_run: bool = False, verbose: bool = True,
                 base_url: str = BASE_URL):
        self.api_key = api_key or load_api_key()
        self.dry_run = dry_run
        self.verbose = verbose
        self.base_url = base_url.rstrip("/")
        if not self.dry_run and not self.api_key:
            raise MagnificError("MAGNIFIC_API_KEY is not set (env or .env). Use --dry-run to test without a key.")
        self.session = requests.Session()
        self.session.headers.update({
            "x-magnific-api-key": self.api_key or "DRY-RUN",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "SluhaBudzhetu-AssetPipeline/1.0",
        })

    # ------------------------------------------------------------------ helpers
    def _log(self, msg: str):
        if self.verbose:
            print(msg, flush=True)

    def _request(self, method: str, url: str, *, json_body=None, data=None, attempts: int = 5):
        delay = 2.0
        last = None
        for i in range(attempts):
            try:
                r = self.session.request(method, url, json=json_body, data=data, timeout=120)
            except requests.RequestException as e:
                last = e
                self._log(f"  network error ({e}); retry {i + 1}/{attempts} in {delay:.0f}s")
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            if r.status_code in (429, 500, 502, 503, 504):
                last = MagnificError(f"HTTP {r.status_code}: {r.text[:300]}")
                self._log(f"  HTTP {r.status_code}; retry {i + 1}/{attempts} in {delay:.0f}s")
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            if r.status_code >= 400:
                raise MagnificError(f"HTTP {r.status_code} for {method} {url}: {r.text[:600]}")
            try:
                return r.json()
            except ValueError:
                raise MagnificError(f"Non-JSON response from {url}: {r.text[:300]}")
        raise MagnificError(f"gave up after {attempts} attempts: {last}")

    def build_payload(self, model: str, prompt: str, references: list[Path] | None = None, **params):
        spec = MODELS[model]
        payload: dict = {"prompt": prompt}
        refs = [Path(p) for p in (references or [])]
        if refs and not spec.get("refs"):
            raise MagnificError(f"model {model} does not accept reference images")
        if refs:
            if len(refs) > spec["refs_max"]:
                raise MagnificError(f"{model} accepts at most {spec['refs_max']} references, got {len(refs)}")
            style = spec["ref_style"]
            if style == "b64":
                payload[spec["refs"]] = [_b64_file(p) for p in refs]
            elif style == "b64_field":
                payload[spec["refs"]] = _b64_file(refs[0])
            elif style == "numbered":
                for i, p in enumerate(refs):
                    payload["input_image" if i == 0 else f"input_image_{i + 1}"] = _b64_file(p)
            elif style == "url_obj":
                payload[spec["refs"]] = [{"image": str(p), "mime_type": "image/png"} for p in refs]
        for k, v in params.items():
            if v is None:
                continue
            if k not in spec["params"]:
                raise MagnificError(f"param '{k}' is not supported by {model} (allowed: {spec['params']})")
            payload[k] = v
        return payload

    @staticmethod
    def payload_digest(model: str, payload: dict) -> str:
        h = hashlib.sha256()
        h.update(model.encode())
        h.update(json.dumps(payload, sort_keys=True).encode())
        return h.hexdigest()[:16]

    # ------------------------------------------------------------------ API
    def probe(self) -> dict:
        """Cheap authenticated call (lists GPT Image 2 tasks) to validate the key. No credits."""
        url = f"{self.base_url}{MODELS['gpt-image-2']['path']}"
        return self._request("GET", url)

    def submit(self, model: str, payload: dict) -> str:
        spec = MODELS[model]
        url = f"{self.base_url}{spec['path']}"
        if self.dry_run:
            self._describe(model, payload)
            return "dry-run"
        res = self._request("POST", url, json_body=payload)
        data = res.get("data", res)
        task_id = data.get("task_id") or data.get("id")
        if not task_id:
            raise MagnificError(f"no task_id in response: {json.dumps(res)[:400]}")
        self._log(f"  submitted {model} task {task_id} (status {data.get('status')})")
        # some endpoints return results synchronously
        if data.get("status") == "COMPLETED" and data.get("generated"):
            self._sync_result = data["generated"]
        else:
            self._sync_result = None
        return task_id

    def wait(self, model: str, task_id: str, timeout: float = 420, poll: float = 3.0) -> list[str]:
        if self.dry_run:
            return []
        if getattr(self, "_sync_result", None):
            return self._sync_result
        spec = MODELS[model]
        url = f"{self.base_url}{spec['path']}/{task_id}"
        t0 = time.time()
        delay = poll
        while True:
            res = self._request("GET", url)
            data = res.get("data", res)
            status = (data.get("status") or "").upper()
            if status == "COMPLETED":
                urls = data.get("generated") or []
                if not urls:
                    raise MagnificError(f"task {task_id} completed without images: {json.dumps(data)[:300]}")
                return [u if isinstance(u, str) else u.get("url") for u in urls]
            if status == "FAILED":
                raise MagnificError(f"task {task_id} failed: {json.dumps(data)[:400]}")
            if time.time() - t0 > timeout:
                raise MagnificError(f"task {task_id} timed out after {timeout:.0f}s (status {status})")
            time.sleep(delay)
            delay = min(delay * 1.4, 8.0)

    def download(self, urls: list[str], dest_dir: Path, prefix: str = "v") -> list[Path]:
        dest_dir = Path(dest_dir)
        dest_dir.mkdir(parents=True, exist_ok=True)
        existing = sorted(dest_dir.glob(f"{prefix}[0-9][0-9][0-9].png"))
        n = len(existing)
        out = []
        for u in urls:
            n += 1
            path = dest_dir / f"{prefix}{n:03d}.png"
            for attempt in range(3):
                try:
                    r = requests.get(u, timeout=120)
                    r.raise_for_status()
                    path.write_bytes(r.content)
                    break
                except requests.RequestException as e:
                    if attempt == 2:
                        raise MagnificError(f"download failed for {u}: {e}")
                    time.sleep(2)
            out.append(path)
            self._log(f"  saved {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")
        return out

    def generate(self, model: str, prompt: str, references=None, dest_dir: Path | None = None,
                 prefix: str = "v", **params) -> list[Path]:
        payload = self.build_payload(model, prompt, references, **params)
        t0 = time.time()
        task_id = self.submit(model, payload)
        if self.dry_run:
            return []
        urls = self.wait(model, task_id)
        paths = self.download(urls, dest_dir or (ROOT / "assets_src" / "raw" / "adhoc"), prefix)
        self._ledger(model, payload, task_id, time.time() - t0, len(paths), "COMPLETED")
        return paths

    # ------------------------------------------------------------------ reporting
    def _describe(self, model: str, payload: dict):
        spec = MODELS[model]
        shown = {}
        for k, v in payload.items():
            if isinstance(v, str) and len(v) > 200:
                shown[k] = f"<base64 {len(v) // 1024} KB>"
            elif isinstance(v, list) and v and isinstance(v[0], str) and len(v[0]) > 200:
                shown[k] = [f"<base64 {len(x) // 1024} KB>" for x in v]
            else:
                shown[k] = v
        units = self.estimate_units(model, payload)
        print(f"[dry-run] POST {self.base_url}{spec['path']}  (~{units} base units)")
        print(json.dumps(shown, indent=2, ensure_ascii=False))

    @staticmethod
    def estimate_units(model: str, payload: dict) -> float:
        if model.startswith("gpt-image-2"):
            q = GPT_QUALITY_MULT.get(payload.get("quality", "high"), 6)
            r = GPT_RES_MULT.get(payload.get("resolution", "1k"), 1)
            return q * r * int(payload.get("num_images", 1))
        return float(payload.get("num_images", 1))

    def _ledger(self, model: str, payload: dict, task_id: str, seconds: float, n: int, status: str):
        COST_LOG.parent.mkdir(parents=True, exist_ok=True)
        new = not COST_LOG.exists()
        with COST_LOG.open("a", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            if new:
                w.writerow(["timestamp", "model", "quality", "resolution", "num_images", "est_units",
                            "task_id", "seconds", "status"])
            w.writerow([time.strftime("%Y-%m-%d %H:%M:%S"), model, payload.get("quality", ""),
                        payload.get("resolution", ""), n, self.estimate_units(model, payload),
                        task_id, f"{seconds:.0f}", status])


# ---------------------------------------------------------------------- CLI
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--probe", action="store_true", help="validate the API key (no credits)")
    ap.add_argument("--model", default="gpt-image-2-edit", choices=sorted(MODELS))
    ap.add_argument("--prompt")
    ap.add_argument("--ref", action="append", default=[], help="reference image path (repeatable)")
    ap.add_argument("--aspect", default="square_1_1")
    ap.add_argument("--resolution", default="1k")
    ap.add_argument("--quality", default="high", choices=["low", "medium", "high"])
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("--background", default="opaque")
    ap.add_argument("--out", default="assets_src/raw/adhoc")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    client = MagnificClient(dry_run=args.dry_run)
    if args.probe:
        res = client.probe()
        data = res.get("data", res)
        n = len(data) if isinstance(data, list) else "?"
        print(f"API key OK. gpt-image-2 task list returned {n} entries.")
        return
    if not args.prompt:
        ap.error("--prompt is required unless --probe")
    params = {}
    if args.model.startswith("gpt-image-2"):
        params = dict(aspect_ratio=args.aspect, resolution=args.resolution, quality=args.quality,
                      num_images=args.n, output_format="png", background=args.background, moderation="low")
    elif args.model.startswith("seedream"):
        params = dict(aspect_ratio=args.aspect)
    paths = client.generate(args.model, args.prompt, args.ref, ROOT / args.out, **params)
    for p in paths:
        print(p)


if __name__ == "__main__":
    try:
        main()
    except MagnificError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
