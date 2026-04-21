from pathlib import Path

ROOT = Path("src/components/BodyTracking")

SUBS = [
    ("bg-blue-600/10 border-blue-500/30", "bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/20"),
    ("bg-blue-600/10 border border-blue-500/30", "bg-black border border-[#0F4C5C]/50"),
    ("bg-blue-600/20", "bg-[#0F4C5C]/25"),
    ("bg-blue-600/30", "bg-[#0F4C5C]/35"),
    ("border-blue-500/30", "border-[#0F4C5C]/45"),
    ("border-blue-500/50", "border-[#0F4C5C]/50"),
    ("border-l-blue-400", "border-l-sky-400"),
    ("text-blue-300", "text-sky-300"),
    ("text-blue-400", "text-sky-300/90"),
    ("bg-blue-600 hover:bg-blue-700", "bg-[#0F4C5C]/50 hover:bg-[#0F4C5C]/65"),
    ("bg-blue-600 ", "bg-[#0F5C45]/45 "),
    ("hover:bg-blue-600/30", "hover:bg-[#0F4C5C]/35"),
    ("bg-blue-600/5", "bg-[#0F4C5C]/10"),
    ("peer-checked:bg-blue-600", "peer-checked:bg-[#0F5C45]"),
    ("bg-purple-400", "bg-sky-400/80"),
    ("from-purple-600 to-purple-400", "from-[#0F4C5C] to-sky-400"),
    ("bg-purple-500", "bg-[#0F5C45]"),
    ("ring-slate-600", "ring-[#0F4C5C]/50"),
    (
        "from-slate-700 via-slate-600/50 to-slate-700",
        "from-[#0F4C5C]/40 via-teal-950/60 to-[#0F4C5C]/40",
    ),
    (
        "from-slate-700 via-slate-600 to-slate-700",
        "from-[#0F4C5C]/50 via-teal-950/70 to-[#0F4C5C]/50",
    ),
    (
        "border-[#0F4C5C]/55/30 border-t-purple-500",
        "border-[#0F4C5C]/40 border-t-sky-400",
    ),
    ("text-slate-100", "text-teal-100"),
    (
        "flex-1 bg-blue-600 hover:bg-blue-700 text-teal-100",
        "flex-1 rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/45 text-teal-100 hover:bg-[#0F4C5C]/60",
    ),
]


def main():
    for path in sorted(ROOT.rglob("*.jsx")):
        text = path.read_text(encoding="utf-8")
        original = text
        for a, b in SUBS:
            text = text.replace(a, b)
        if path.name == "useToast.jsx":
            text = text.replace("bg: 'bg-blue-600/90'", "bg: 'bg-[#0F4C5C]/90'")
        if text != original:
            path.write_text(text, encoding="utf-8")
            print("patched", path)
    print("done")


FIXES = [
    ("bg-[#0F4C5C]/50/10 border-[#0F4C5C]/55/30", "bg-black border-2 border-[#0F4C5C]/55 shadow-sm shadow-black/15"),
    ("[#0F4C5C]/45/50", "[#0F4C5C]/45"),
    ("[#0F4C5C]/55/30", "[#0F4C5C]/50"),
    ("bg-blue-600/10", "bg-[#0F4C5C]/15"),
    ("bg-blue-500/10", "bg-[#0F4C5C]/12"),
    ("border-blue-500", "border-[#0F5C45]/55"),
    ("hover:border-blue-500", "hover:border-[#0F5C45]/60"),
    ("hover:border-blue-400", "hover:border-sky-400/60"),
    ("bg-blue-900/20 border border-blue-700/30", "bg-black border border-[#0F4C5C]/45"),
    ("text-blue-200", "text-sky-200/90"),
    ("text-blue-100", "text-sky-100/90"),
    ("border-blue-500", "border-[#0F4C5C]/50"),
    ("bg-blue-500/20", "bg-[#0F4C5C]/22"),
    ("'bg-blue-400'", "'bg-sky-400'"),
]


def cleanup():
    for path in sorted(ROOT.rglob("*.jsx")):
        text = path.read_text(encoding="utf-8")
        original = text
        for a, b in FIXES:
            text = text.replace(a, b)
        if path.name == "useToast.jsx":
            text = text.replace("border: 'border-blue-500'", "border: 'border-[#0F4C5C]/50'")
        if text != original:
            path.write_text(text, encoding="utf-8")
            print("cleanup", path)


if __name__ == "__main__":
    main()
    cleanup()
