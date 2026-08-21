#!/usr/bin/env python3
"""Smoke-test the require-cursor-agent hook and its archived predecessor."""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Dict, List, Optional


REPO_ROOT = Path(__file__).resolve().parents[2]
HOOK_DIR = Path(__file__).resolve().parent
MARKER_PREFIX = "require-cursor-agent-warned-"


@dataclass
class HookResult:
    returncode: Optional[int]
    stdout: str
    stderr: str
    error: Optional[str] = None


@dataclass
class Case:
    number: int
    name: str
    payload: Dict[str, object]
    expected_exit: int
    check: Callable[[HookResult], List[str]]
    bypass: bool = False
    env: Optional[Dict[str, str]] = None


def edit_payload(path: str) -> Dict[str, object]:
    return {
        "tool_name": "Edit",
        "tool_input": {"file_path": path},
    }


def bash_payload(command: str) -> Dict[str, object]:
    return {
        "tool_name": "Bash",
        "tool_input": {"command": command},
    }


def expected_exit_only(expected_exit: int) -> Callable[[HookResult], List[str]]:
    def check(result: HookResult) -> List[str]:
        failures = []
        if result.returncode != expected_exit:
            failures.append(f"expected exit {expected_exit}, got {result.returncode}")
        return failures

    return check


def read_frontmatter_value(path: Path, wanted_key: str) -> str:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{path} has no leading frontmatter")

    for line in lines[1:]:
        if line.strip() == "---":
            break
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        if key.strip() == wanted_key:
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1]:
                if value[0] in ("'", '"'):
                    value = value[1:-1].strip()
            if value:
                return value

    raise ValueError(f"{wanted_key!r} is missing from {path}")


def resolve_hook(argument: Optional[str]) -> Path:
    if argument is None:
        return (HOOK_DIR / "require-cursor-agent.py").resolve()

    hook = Path(argument)
    if not hook.is_absolute():
        hook = Path.cwd() / hook
    return hook.resolve()


def command_for_hook(hook: Path) -> List[str]:
    suffix = hook.suffix.lower()
    if suffix == ".py":
        return ["python3", str(hook)]
    if suffix in (".sh", ".bak"):
        return ["bash", str(hook)]
    raise ValueError(f"unsupported hook extension: {hook}")


def run_hook(
    hook: Path,
    payload: Dict[str, object],
    *,
    bypass: bool,
    env_overrides: Optional[Dict[str, str]],
) -> HookResult:
    environment = os.environ.copy()
    environment.pop("SUB_AGENTS_DIR", None)
    environment.pop("CURSOR_AGENT", None)

    if bypass:
        environment["CURSOR_AGENT"] = "1"
    elif "CURSOR_AGENT" in environment:
        raise AssertionError("CURSOR_AGENT must be removed for non-bypass cases")

    environment["CLAUDE_PROJECT_DIR"] = str(REPO_ROOT)
    if env_overrides:
        environment.update(env_overrides)

    if not bypass and "CURSOR_AGENT" in environment:
        raise AssertionError("CURSOR_AGENT leaked into a non-bypass invocation")
    if bypass and environment.get("CURSOR_AGENT") != "1":
        raise AssertionError("bypass invocation did not set CURSOR_AGENT=1")

    try:
        completed = subprocess.run(
            command_for_hook(hook),
            cwd=str(REPO_ROOT),
            env=environment,
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            check=False,
        )
    except Exception as error:
        return HookResult(None, "", "", f"{type(error).__name__}: {error}")

    return HookResult(
        completed.returncode,
        completed.stdout,
        completed.stderr,
    )


def bypass_marker_path(session_id: str) -> Path:
    safe_session_id = re.sub(r"[^A-Za-z0-9_-]", "", session_id)
    return Path(tempfile.gettempdir()) / f"{MARKER_PREFIX}{safe_session_id}"


def make_cases(
    *,
    yolo_dir: Path,
    read_only_dir: Path,
    empty_dir: Path,
    real_model: Optional[str],
    real_model_error: Optional[str],
    bypass_session_id: str,
) -> List[Case]:
    def case_19_check(result: HookResult) -> List[str]:
        failures = expected_exit_only(2)(result)
        if "--force" not in result.stderr:
            failures.append("stderr is missing --force")
        if real_model_error:
            failures.append(f"could not read real model: {real_model_error}")
        elif not real_model or real_model not in result.stderr:
            failures.append("stderr is missing the model from .agents/cursor-agent.md")
        return failures

    def case_20_check(result: HookResult) -> List[str]:
        failures = expected_exit_only(2)(result)
        if "smoketest-model-x" not in result.stderr:
            failures.append("stderr is missing smoketest-model-x")
        if real_model and real_model in result.stderr:
            failures.append("stderr contains the repo model instead of the fixture model")
        return failures

    def case_21_check(result: HookResult) -> List[str]:
        failures = expected_exit_only(2)(result)
        if "--force" in result.stderr:
            failures.append("stderr unexpectedly contains --force")
        if "read-only" not in result.stderr:
            failures.append("stderr is missing read-only")
        return failures

    def case_22_check(result: HookResult) -> List[str]:
        failures = expected_exit_only(2)(result)
        if "--model" in result.stderr:
            failures.append("stderr unexpectedly contains --model")
        if "Traceback (most recent call last)" in result.stderr:
            failures.append("stderr contains a Python traceback")
        return failures

    def case_23_check(result: HookResult) -> List[str]:
        failures = expected_exit_only(0)(result)
        try:
            output = json.loads(result.stdout)
        except json.JSONDecodeError:
            failures.append("stdout is not JSON")
        else:
            if not isinstance(output, dict) or "systemMessage" not in output:
                failures.append("stdout JSON is missing systemMessage")
        return failures

    def case_24_check(result: HookResult) -> List[str]:
        failures = expected_exit_only(0)(result)
        if result.stdout != "":
            failures.append("stdout is not empty")
        return failures

    return [
        Case(1, "Edit lib/main.dart", edit_payload("lib/main.dart"), 2, expected_exit_only(2)),
        Case(
            2,
            "Edit /Users/wujincheng/.claude.json",
            edit_payload("/Users/wujincheng/.claude.json"),
            2,
            expected_exit_only(2),
        ),
        Case(3, "Edit pubspec.yaml", edit_payload("pubspec.yaml"), 2, expected_exit_only(2)),
        Case(4, "Write lib/foo.dart", {
            "tool_name": "Write",
            "tool_input": {"file_path": "lib/foo.dart"},
        }, 2, expected_exit_only(2)),
        Case(5, "Bash cp lib/a.dart lib/b.dart", bash_payload("cp lib/a.dart lib/b.dart"), 2, expected_exit_only(2)),
        Case(6, "Bash mv lib/a.dart lib/b.dart", bash_payload("mv lib/a.dart lib/b.dart"), 2, expected_exit_only(2)),
        Case(7, "Bash tee lib/x.dart", bash_payload("tee lib/x.dart"), 2, expected_exit_only(2)),
        Case(
            8,
            "Bash sed -i lib/main.dart",
            bash_payload("sed -i '' s/a/b/ lib/main.dart"),
            2,
            expected_exit_only(2),
        ),
        Case(9, "Bash echo redirect to lib/out.dart", bash_payload("echo hello > lib/out.dart"), 2, expected_exit_only(2)),
        Case(10, "Edit docs/plan.md", edit_payload("docs/plan.md"), 0, expected_exit_only(0)),
        Case(
            11,
            "Edit /Users/wujincheng/notes/scratch.md",
            edit_payload("/Users/wujincheng/notes/scratch.md"),
            0,
            expected_exit_only(0),
        ),
        Case(12, "Bash ls foo 2>/dev/null", bash_payload("ls foo 2>/dev/null"), 0, expected_exit_only(0)),
        Case(13, "Bash find . -name x 2>&1", bash_payload("find . -name x 2>&1"), 0, expected_exit_only(0)),
        Case(14, "Bash echo arrow", bash_payload('echo "arrow -> here"'), 0, expected_exit_only(0)),
        Case(
            15,
            "Bash jq quoted redirect text",
            bash_payload(r'jq -r ".a|join(\" > \")" f.json'),
            0,
            expected_exit_only(0),
        ),
        Case(
            16,
            "Bash claude plugin install",
            bash_payload("claude plugin install runner@sub-agents-skills"),
            0,
            expected_exit_only(0),
        ),
        Case(
            17,
            "Bash cursor-agent quoted text",
            bash_payload('cursor-agent -p --force "please cp and truncate the file"'),
            0,
            expected_exit_only(0),
        ),
        Case(
            18,
            "Bash printf exit status",
            bash_payload(r'printf "exit=%s\n" "$?"'),
            0,
            expected_exit_only(0),
        ),
        Case(
            19,
            "Edit lib/main.dart uses real agent definition",
            edit_payload("lib/main.dart"),
            2,
            case_19_check,
        ),
        Case(
            20,
            "Edit with yolo fixture definition",
            edit_payload("lib/main.dart"),
            2,
            case_20_check,
            env={"SUB_AGENTS_DIR": str(yolo_dir)},
        ),
        Case(
            21,
            "Edit with read-only fixture definition",
            edit_payload("lib/main.dart"),
            2,
            case_21_check,
            env={"SUB_AGENTS_DIR": str(read_only_dir)},
        ),
        Case(
            22,
            "Edit with empty agent definition directory",
            edit_payload("lib/main.dart"),
            2,
            case_22_check,
            env={"SUB_AGENTS_DIR": str(empty_dir)},
        ),
        Case(
            23,
            "Bypass first call emits warning JSON",
            {
                **edit_payload("lib/main.dart"),
                "session_id": bypass_session_id,
            },
            0,
            case_23_check,
            bypass=True,
        ),
        Case(
            24,
            "Bypass second call is silent",
            {
                **edit_payload("lib/main.dart"),
                "session_id": bypass_session_id,
            },
            0,
            case_24_check,
            bypass=True,
        ),
    ]


def run_case(case: Case, hook: Path) -> List[str]:
    try:
        result = run_hook(
            hook,
            case.payload,
            bypass=case.bypass,
            env_overrides=case.env,
        )
        failures = case.check(result)
        if result.error:
            failures.insert(0, result.error)
    except Exception as error:
        result = HookResult(None, "", "", f"{type(error).__name__}: {error}")
        failures = [result.error or "unknown runner error"]

    actual = result.returncode if result.returncode is not None else "ERROR"
    status = "PASS" if not failures else f"FAIL ({'; '.join(failures)})"
    print(
        f"{case.number:02d}. {case.name} | expected={case.expected_exit} "
        f"actual={actual} | {status}"
    )
    return failures


def remove_marker_files(marker_paths: List[Path]) -> List[Path]:
    for marker_path in marker_paths:
        try:
            marker_path.unlink()
        except FileNotFoundError:
            pass
    return [path for path in marker_paths if path.exists()]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--hook",
        help="hook to exercise (defaults to require-cursor-agent.py next to this test)",
    )
    args = parser.parse_args()
    hook = resolve_hook(args.hook)

    real_model: Optional[str]
    real_model_error: Optional[str]
    try:
        real_model = read_frontmatter_value(REPO_ROOT / ".agents" / "cursor-agent.md", "model")
        real_model_error = None
    except Exception as error:
        real_model = None
        real_model_error = f"{type(error).__name__}: {error}"

    bypass_session_id = f"smoketest-{os.getpid()}-{uuid.uuid4().hex}"
    marker_paths = [bypass_marker_path(bypass_session_id)]
    case_failures = 0
    case_count = 0
    fixture_dir: Optional[Path] = None
    fixture_removed = False

    try:
        with tempfile.TemporaryDirectory(prefix="require-cursor-agent-smoketest-") as temporary_directory:
            fixture_dir = Path(temporary_directory)
            yolo_dir = fixture_dir / "yolo"
            read_only_dir = fixture_dir / "read-only"
            empty_dir = fixture_dir / "empty"
            yolo_dir.mkdir()
            read_only_dir.mkdir()
            empty_dir.mkdir()
            (yolo_dir / "cursor-agent.md").write_text(
                "---\npermission: yolo\nmodel: smoketest-model-x\n---\n",
                encoding="utf-8",
            )
            (read_only_dir / "cursor-agent.md").write_text(
                "---\npermission: read-only\n---\n",
                encoding="utf-8",
            )

            cases = make_cases(
                yolo_dir=yolo_dir,
                read_only_dir=read_only_dir,
                empty_dir=empty_dir,
                real_model=real_model,
                real_model_error=real_model_error,
                bypass_session_id=bypass_session_id,
            )
            case_count = len(cases)
            for case in cases:
                if run_case(case, hook):
                    case_failures += 1
    finally:
        if fixture_dir is not None:
            fixture_removed = not fixture_dir.exists()
        remaining_markers = remove_marker_files(marker_paths)

    cleanup_ok = fixture_removed and not remaining_markers
    print(f"Tally: {case_count - case_failures} passed, {case_failures} failed")
    print(f"Cleanup: {'PASS' if cleanup_ok else 'FAIL'}")
    return 0 if case_count == 24 and case_failures == 0 and cleanup_ok else 1


if __name__ == "__main__":
    sys.exit(main())
