#!/usr/bin/env python3
# Require cursor-agent delegation Hook
#
# Deny-by-default: blocks direct implementation (Edit/Write/MultiEdit and
# common Bash write bypasses) in this Claude Code session. Coding work must
# go through cursor-agent:
#   /runner:sub-agents Run cursor-agent on <task description>
#
# Allowed without delegation: plan/review docs (*.md / *.mdx, and non-code
# files under docs/).
#
# Reads the hook payload from stdin. On exit 2, the reason MUST go to stderr —
# Claude Code ignores stdout JSON when exit code is 2.

import json, os, re, sys, tempfile

sys.dont_write_bytecode = True
from _agent_def import read_agent_definition


def print_bypass_warning():
    print(json.dumps({
        "systemMessage": (
            "The hook is disabled for this session because CURSOR_AGENT is set, "
            "so direct edits are therefore not being blocked."
        ),
        "suppressOutput": True,
    }))


def build_delegate_message():
    try:
        model, permission = read_agent_definition()
    except Exception:
        model = None
        permission = None
        definition_read = False
    else:
        definition_read = True

    command = ["cursor-agent", "-p"]
    if permission == "yolo":
        command.append("--force")
    if model:
        command.extend(["--model", model])
    command.extend(['--workspace "$CLAUDE_PROJECT_DIR"', '"<task description>"'])

    message = [
        "Direct implementation edits are blocked in this session; coding work goes to cursor-agent.\n\n",
        "Fast path: run this literal command:\n",
        f'{" ".join(command)}\n\n',
    ]
    if definition_read:
        message.append("The model and permission values above were read from the agent definition.\n\n")
        if permission != "yolo":
            permission_level = permission or "unspecified"
            message.append(
                f"The permission level is {permission_level}; check `.agents/cursor-agent.md` "
                "for the matching flag.\n\n"
            )
    else:
        message.append(
            "The agent definition could not be read; consult `.agents/cursor-agent.md` "
            "for the matching model and permission settings.\n\n"
        )
    message.extend([
        "Alternative: /runner:sub-agents Run cursor-agent on <task description>; "
        "this adds an agent-discovery step.\n\n",
        "Each delegation costs roughly 20 seconds of fixed startup regardless of task size, "
        "so batch several small edits into a single call.\n\n",
        "For a large task, write the spec to a .md file first and point cursor-agent at that file.\n\n",
        "Carve-outs: plan/review-stage edits to docs (*.md / *.mdx, and non-code files under docs/) "
        "may be done directly. Do not bypass via Bash (sed -i, tee, redirects, heredocs).",
    ])
    return "".join(message)


DELEGATE = build_delegate_message()

CODE_EXT = (
    ".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".tsx", ".jsx", ".vue",
    ".css", ".scss", ".sass", ".less", ".styl", ".html", ".htm",
    ".yaml", ".yml", ".lock", ".toml", ".json", ".jsonc", ".json5",
    ".sh", ".bash", ".zsh", ".py", ".rb", ".proto", ".sql", ".graphql", ".gql",
    ".go", ".rs", ".cs", ".java", ".kt", ".dart", ".c", ".cc", ".cpp", ".h", ".hpp",
    ".xml", ".properties", ".template", ".env",
)


def is_allowed_path(path: str) -> bool:
    if not path:
        return False
    p = path.replace("\\", "/")
    base = os.path.basename(p)
    lower = base.lower()
    if lower.endswith(".md") or lower.endswith(".mdx"):
        return True
    # Non-code artifacts under docs/ (checklists, plans, notes, etc.)
    if "/docs/" in f"/{p}" or p.startswith("docs/"):
        if any(lower.endswith(ext) for ext in CODE_EXT):
            return False
        return True
    return False


def looks_like_code_target(path: str) -> bool:
    return not is_allowed_path(path)


WRITE_HINT = re.compile(
    r"(?:^|&&|\|\||[;\n]|\|)\s*"
    r"(?:"
    r"(?:sed|perl|ruby)\s+[^\n;&|]*-i\b|"
    r"(?:tee|truncate|install|cp|mv|rsync|patch|dd)(?:\s|$)"
    r")"
    r"|>>?",
    re.IGNORECASE,
)

PATH_CANDIDATES = re.compile(
    r"(?:(?:^|[\s])(?:tee|cp|mv|install|rsync|patch)\s+)([^\s;|&]+)"
    r"|(?:>>?\s*)([^\s;|&]+)"
    r"|(?:sed\s+[^\n]*-i(?:\s+\S+)?\s+)([^\s;|&]+)"
    r"|(?:--?\s*)?(?:file[_-]?path[=:\s]+)([^\s;|&]+)",
    re.IGNORECASE,
)


def remove_quoted_spans(cmd: str) -> str:
    return re.sub(r"""'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*["]""", "", cmd or "")


def scrub_command(cmd: str) -> str:
    scrubbed = re.sub(r"(?:\d+)?\s*>\s*&\s*\d+", "", cmd or "")
    return re.sub(r"(?:\d+|&)?>>?\s*/dev/null", "", scrubbed)


def extract_paths_from_command(cmd: str):
    paths = []
    for m in PATH_CANDIDATES.finditer(cmd or ""):
        for g in m.groups():
            if g:
                paths.append(g.strip("\"'"))
    return paths


def deny():
    print(DELEGATE, file=sys.stderr)
    return 2


def main():
    try:
        hook_input = sys.stdin.read()
    except Exception:
        return deny()

    # Cursor-agent is the delegation target; don't block its own edits.
    if os.environ.get("CURSOR_AGENT"):
        should_print_warning = True
        try:
            d = json.loads(hook_input or "")
            session_id = d.get("session_id") if isinstance(d, dict) else None
            if session_id:
                safe_session_id = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))
                if safe_session_id:
                    marker_path = os.path.join(
                        tempfile.gettempdir(),
                        f"require-cursor-agent-warned-{safe_session_id}",
                    )
                    try:
                        marker_fd = os.open(
                            marker_path,
                            os.O_CREAT | os.O_EXCL | os.O_WRONLY,
                            0o600,
                        )
                        os.close(marker_fd)
                    except FileExistsError:
                        should_print_warning = False
                    except Exception:
                        pass
        except Exception:
            pass
        if should_print_warning:
            print_bypass_warning()
        return 0

    try:
        d = json.loads(hook_input or "")
    except Exception:
        return deny()

    tool = (d.get("tool_name") or "").strip()
    ti = d.get("tool_input") or {}

    if tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        path = ti.get("file_path") or ti.get("notebook_path") or ""
        if not path or looks_like_code_target(path):
            return deny()
        return 0

    if tool == "Bash":
        cmd = ti.get("command") or ""
        processed_cmd = scrub_command(remove_quoted_spans(cmd))
        if not WRITE_HINT.search(processed_cmd):
            return 0
        paths = extract_paths_from_command(processed_cmd)
        if paths:
            if any(looks_like_code_target(p) for p in paths):
                return deny()
            return 0
        # Write-like command but no clear path → fail closed (heredocs, vars).
        return deny()

    return 0


if __name__ == "__main__":
    sys.exit(main())
