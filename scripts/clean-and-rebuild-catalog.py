#!/usr/bin/env python3
"""
Comprehensive content audit + clean rebuild of quotes.json and stories.json.
Applies strict quality control to produce a clean publishable archive.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

QUOTES_IN   = ROOT / "src/lib/quotes/quotes.json"
STORIES_IN  = ROOT / "src/lib/stories/stories.json"
QUOTES_OUT  = ROOT / "src/lib/quotes/quotes.clean.json"
STORIES_OUT = ROOT / "src/lib/stories/stories.clean.json"
REPORT_OUT  = ROOT / "scripts/audit-report.json"

# ── Manual exclusion overrides ─────────────────────────────────────────────────
# These have been individually reviewed and determined to be unfit for publication.
MANUAL_EXCLUDE = {
    "yq-p002": "Corrupted URL header + garbled OCR body",
    "yq-p009": "Clear OCR garbage (Latin chars mixed into Hindi text)",
    "yq-p016": "Contains corrupted OCR chars in Hindi text (Fer, fais)",
    "yq-p030": "Body has OCR artifacts at line endings (ty, का, व)",
    "yq-p033": "URL/garbage header + garbled first line ('AA भा तज़ हा रहा ह1')",
    "yq-p048": "Has छि header + trailing YourQuote.in garbage + OCR artifacts in lines",
    "yq-p055": "Garbled OCR first line; main content begins mid-poem, incomplete",
    "yq-p062": "URL header + mixed OCR garbage; poem fragments not recoverable",
    "yq-p082": "UI artifact only: '20 ikes » 5 comments ५ 1 share'",
    "yq-p097": "URL header + 'your comment' UI garbage; poem stripped but still unclear",
    "yq-p117": "Excluded by request: incomplete/fragment quote 'मैं 599 मैं कौन हूँ?'",
    "yq-p139": "OCR corruption: 'can atrord', 'ny sanity', 'put i can't'",
    "yq-p144": "OCR artifacts throughout: '. in close friends', '\"Ss having', '- 3 do'",
    "yq-p155": "URL header + almost entirely OCR garbage; only one Hindi phrase recoverable",
    "yq-p180": "Only contains author sig + 'yw\n' + truncated line - incomplete",
    "yq-p197": "URL header + garbled Hindi OCR + Latin noise",
}

# ── Manual recovery: entries with URL headers but clean content after stripping ─
# Format: id -> (lines_to_strip, cleaned_body)
# These have been individually verified as clean after stripping the garbage header.
MANUAL_RECOVER = {
    "yq-p047": (3, "my last words to you\nwill keep circling back,\na shadow over everything —\nwe built from nothing.\nthey'll tear the promise open,\nreduce what once glowed\nto fragments of what we could have been.\nwe didn't land—we crashed hard and\nour relationship came apart on impact.\nand all the light i forced\nout of my own darkness,\nall the jokes, the clumsy attempts\nto make you laugh\nwhen i was breaking inside,\nwill vanish too—\nlost in the wreckage\nof that goodbye i couldn't take back."),
    "yq-p072": (1, "मैं न रहूँ साथ, तो याद मुझे सादगी से करना,\nदेख रहा होऊँगा आसमान की उस ओर से तुमको।\nपर हर पल - तुम आँख मगर गीली मत करना,\nमिलना, बिछड़ना, साथ रहना - ये नसीब की बातें हैं।\nरास्ता अच्छा लगे, तो बेझिझक सफर तय करना,\nमिल जाए कोई जो तुम्हारा घर बन सके\nतो मुझे फूलों की तरह किताबों में दबा देना।\nपर जिस रोज़ वो किताब फिर से खोलो,\nतो पन्नों में दबे उन फूलों को धूल बना देना।"),
}

# ── Cleaning: entries recoverable by stripping the छि prefix ──────────────────
# These have छि\n OCR artifact at start but the rest is clean
STRIP_CCHI = {
    "yq-p029", "yq-p038", "yq-p051", "yq-p053", "yq-p054",
    "yq-p063", "yq-p065", "yq-p183", "yq-p186",
}

# ── Entries where we strip URL headers ────────────────────────────────────────
# This is now handled by MANUAL_RECOVER above.

# ── Exclusion pattern checks ───────────────────────────────────────────────────

CAPTION_PHRASES = [
    "read the full poem in caption",
    "read full poem in caption",
    "read the full story in caption",
    "read full story in caption",
    "(read the full",
    "(read full",
]

UI_ARTIFACTS = [
    "yourquote.in",
    "your@uote.in",
    "your r@uote.in",
    "write your own quotes",
    "show more",
    "@ aga your comment",
    "ikes » 5 comments",
    "20 ikes",
]

URL_HEADER_RE = re.compile(
    r"^(?:10[/\d]|103\d+|10730|\(0802|1030726|0 yush)",
    re.MULTILINE,
)

OCR_GARBAGE_PATTERNS = [
    "AANA", "इयफारए", "l#ti-",
    "HEH ", "VIR है",         # garbled Hindi
    "AA भा तज़ हा रहा ह1",    # specific garbled line
    "can atrord", "ny sanity",  # OCR errors in English
    "yee gence eee",            # OCR noise
    "ikes » 5 comments",        # UI artifacts
    "20 ikes",
    "yw\n",                     # garbage token
]

GARBAGE_BODIES = {
    "0 yush", "छि", "yush", "an |",
    "8", "|", "",
}

def is_empty_garbage(body: str) -> bool:
    stripped = body.strip()
    if stripped in GARBAGE_BODIES:
        return True
    if len(stripped) < 10:
        return True
    return False

def has_caption_dep(body: str) -> bool:
    b = body.lower()
    return any(p in b for p in CAPTION_PHRASES)

def has_ui_artifact(body: str) -> bool:
    b = body.lower()
    return any(p in b for p in UI_ARTIFACTS)

def has_url_header(body: str) -> bool:
    return bool(URL_HEADER_RE.match(body))

def has_ocr_garbage(body: str) -> bool:
    return any(m in body for m in OCR_GARBAGE_PATTERNS)

def strip_cchi(body: str) -> str:
    if body.startswith("छि\n"):
        return body[4:].strip()
    return body

def strip_n_header_lines(body: str, n: int) -> str:
    lines = body.split("\n")
    return "\n".join(lines[n:]).strip()

def classify_entry(item: dict):
    """
    Returns (status: 'PUBLISH'|'EXCLUDE', reason: str, cleaned_body: str|None)
    """
    item_id = item["id"]
    body = item.get("body", "")

    # Manual overrides take highest priority
    if item_id in MANUAL_EXCLUDE:
        return "EXCLUDE", MANUAL_EXCLUDE[item_id], None

    # Manual recovery (curated clean text after stripping garbage headers)
    if item_id in MANUAL_RECOVER:
        return "PUBLISH", "", MANUAL_RECOVER[item_id][1]

    # Empty/garbage-only bodies
    if is_empty_garbage(body):
        return "EXCLUDE", "Empty or garbage-only body", None

    # Caption-dependent previews
    if has_caption_dep(body):
        return "EXCLUDE", "Caption-dependent preview — full work not available", None

    # UI artifacts (Show More, YourQuote URLs)
    if has_ui_artifact(body):
        return "EXCLUDE", "Contains YourQuote UI artifacts (Show More / URL)", None

    # URL header artifacts at start of body
    if has_url_header(body):
        return "EXCLUDE", "URL/timestamp header artifact from page scraper", None

    # OCR corruption
    if has_ocr_garbage(body):
        return "EXCLUDE", "OCR corruption (garbled characters or words)", None

    # Apply approved cleanups
    cleaned = body

    # Strip छि\n prefix (OCR artifact from page edge)
    if item_id in STRIP_CCHI or cleaned.startswith("छि\n"):
        # Only strip if rest is clean
        candidate = strip_cchi(cleaned)
        if not is_empty_garbage(candidate) and not has_ocr_garbage(candidate) and not has_ui_artifact(candidate):
            cleaned = candidate
        elif is_empty_garbage(candidate):
            return "EXCLUDE", "Only छि prefix remains after stripping, no content", None

    return "PUBLISH", "", cleaned


def process_file(input_path: Path):
    with open(input_path) as f:
        items = json.load(f)

    published = []
    excluded = []

    for item in items:
        status, reason, cleaned_body = classify_entry(item)

        if status == "PUBLISH":
            new_item = dict(item)
            new_item["author"] = "Mohit Yenugwar"
            new_item["body"] = cleaned_body
            published.append(new_item)
        else:
            excluded.append({
                "id": item["id"],
                "pageNumber": item.get("pageNumber"),
                "title": item.get("title"),
                "language": item.get("language"),
                "contentType": item.get("contentType"),
                "reason": reason,
                "originalBodyPreview": item.get("body", "")[:200],
                "source": input_path.name,
            })

    return published, excluded


def main():
    print("=" * 60)
    print("CONTENT AUDIT & CLEAN REBUILD — Mohit Yenugwar Archive")
    print("=" * 60)

    quotes_pub, quotes_excl = process_file(QUOTES_IN)
    stories_pub, stories_excl = process_file(STORIES_IN)

    all_excluded = quotes_excl + stories_excl

    print(f"\n📚 QUOTES:  {len(quotes_pub)} publishable, {len(quotes_excl)} excluded")
    print(f"📜 STORIES: {len(stories_pub)} publishable, {len(stories_excl)} excluded")
    print(f"✅ TOTAL:   {len(quotes_pub)+len(stories_pub)} publishable")
    print(f"❌ TOTAL excluded: {len(all_excluded)}")

    print("\n--- Excluded entries ---")
    for e in all_excluded:
        print(f"  [{e['source']}] {e['id']} ({e.get('language','?')}/{e.get('contentType','?')}): {e['reason']}")

    # Language breakdown
    print("\n--- Published language breakdown ---")
    all_pub = quotes_pub + stories_pub
    en = [x for x in all_pub if x.get('language') == 'en']
    hi = [x for x in all_pub if x.get('language') == 'hi']
    other = [x for x in all_pub if x.get('language') not in ('en','hi')]
    print(f"  English: {len(en)}")
    print(f"  Hindi:   {len(hi)}")
    print(f"  Other:   {len(other)}")

    # Content type breakdown
    print("\n--- Published content type breakdown ---")
    from collections import Counter
    ct = Counter(x.get('contentType') for x in all_pub)
    for t, c in sorted(ct.items()):
        print(f"  {t}: {c}")

    # Write clean output files
    QUOTES_OUT.write_text(json.dumps(quotes_pub, ensure_ascii=False, indent=2))
    STORIES_OUT.write_text(json.dumps(stories_pub, ensure_ascii=False, indent=2))

    # Write audit report
    with open(QUOTES_IN) as f:
        total_quotes_in = len(json.load(f))
    with open(STORIES_IN) as f:
        total_stories_in = len(json.load(f))

    report = {
        "summary": {
            "total_input_quotes": total_quotes_in,
            "total_input_stories": total_stories_in,
            "published_quotes": len(quotes_pub),
            "published_stories": len(stories_pub),
            "published_total": len(quotes_pub) + len(stories_pub),
            "excluded_total": len(all_excluded),
            "language_breakdown": {
                "english": len(en),
                "hindi": len(hi),
                "other": len(other),
            },
            "content_type_breakdown": dict(ct),
        },
        "exclusion_categories": {
            "caption_dependent": sum(1 for e in all_excluded if "Caption-dependent" in e["reason"]),
            "ui_artifacts": sum(1 for e in all_excluded if "UI artifact" in e["reason"] or "Show More" in e["reason"]),
            "ocr_corruption": sum(1 for e in all_excluded if "OCR" in e["reason"] or "garbled" in e["reason"]),
            "empty_garbage": sum(1 for e in all_excluded if "Empty" in e["reason"] or "garbage" in e["reason"].lower()),
            "url_header": sum(1 for e in all_excluded if "URL" in e["reason"]),
            "incomplete": sum(1 for e in all_excluded if "incomplete" in e["reason"].lower()),
        },
        "excluded_entries": all_excluded,
    }

    REPORT_OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2))

    print(f"\n📁 Output files written:")
    print(f"  {QUOTES_OUT}")
    print(f"  {STORIES_OUT}")
    print(f"  {REPORT_OUT}")
    print("\n✅ Done!")


if __name__ == "__main__":
    main()
