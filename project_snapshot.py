import os
import subprocess
import json
from datetime import datetime, timezone

PROJECT_NAME = "connector-browser"  # عدّل الاسم لو حابب
MAX_TREE_DEPTH = 3                  # أقصى عمق لعرض الشجرة
MAX_ITEMS_PER_DIR = 50             # لتقليل حجم الشجرة لو المشروع ضخم


def run_cmd(cmd):
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except Exception:
        return None


def get_git_info():
    if not os.path.isdir(".git"):
        return None

    branch = run_cmd(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    last_hash = run_cmd(["git", "rev-parse", "HEAD"])
    last_author = run_cmd(["git", "log", "-1", "--pretty=format:%an"])
    last_date = run_cmd(["git", "log", "-1", "--pretty=format:%cI"])
    last_msg = run_cmd(["git", "log", "-1", "--pretty=format:%s"])

    status_porcelain = run_cmd(["git", "status", "--porcelain"])
    modified = added = deleted = untracked = 0
    if status_porcelain:
        for line in status_porcelain.splitlines():
            code = line[:2]
            if "??" in code:
                untracked += 1
            elif "D" in code:
                deleted += 1
            elif "A" in code:
                added += 1
            else:
                modified += 1

    return {
        "branch": branch,
        "last_commit": {
            "hash": last_hash,
            "author": last_author,
            "date": last_date,
            "message": last_msg
        },
        "status_summary": {
            "modified": modified,
            "added": added,
            "deleted": deleted,
            "untracked": untracked
        }
    }


def build_ascii_tree(root=".", prefix="", depth=0):
    if depth > MAX_TREE_DEPTH:
        return prefix + "...(max depth reached)\n"

    try:
        entries = sorted(os.listdir(root))
    except PermissionError:
        return prefix + f"{os.path.basename(root) or root}/ (permission denied)\n"

    lines = []
    if depth == 0:
        lines.append(os.path.basename(os.path.abspath(root)) + "/")

    count = 0
    for index, name in enumerate(entries):
        if name.startswith(".git"):
            continue  # تجاهل مجلد git لتقليل الضوضاء

        path = os.path.join(root, name)
        count += 1
        if count > MAX_ITEMS_PER_DIR:
            lines.append(prefix + "  ... (truncated)\n")
            break

        connector = "└── " if index == len(entries) - 1 else "├── "
        if os.path.isdir(path):
            lines.append(prefix + connector + name + "/")
            extension = "    " if index == len(entries) - 1 else "│   "
            subtree = build_ascii_tree(path, prefix + extension, depth + 1)
            for line in subtree.splitlines():
                lines.append(line)
        else:
            lines.append(prefix + connector + name)

    return "\n".join(lines)


def get_build_info():
    # بسيط مبدئياً: عدّل حسب نظام البناء عندك
    # مثال: لو تستخدم npm scripts:
    # يمكن مثلاً إجراء آخر build log من ملف أو تجاهله الآن
    return {
        "last_build_status": "unknown",
        "last_build_time": None,
        "errors_count": None
    }


def main():
    snapshot = {
        "project_name": PROJECT_NAME,
        "snapshot_time": datetime.now(timezone.utc).isoformat(),
        "git": get_git_info(),
        "folder_tree": build_ascii_tree("."),
        "build": get_build_info(),
        "modules": [
            {
                "name": "ai_assistant",
                "path": "src/ai/assistant.ts",
                "status": "unknown",
                "notes": ""
            },
            {
                "name": "proxy_manager",
                "path": "src/network/proxyManager.ts",
                "status": "unknown",
                "notes": ""
            }
        ],
        "todo_notes": [
            "أضف TODO من ملفات الكود أو من دماغك هنا يدويًا بعد أول تشغيل."
        ],
        "risks": []
    }

    text = json.dumps(snapshot, ensure_ascii=False, indent=2)
    with open("snapshot.json", "w", encoding="utf-8") as f:
        f.write(text)


if __name__ == "__main__":
    main()
