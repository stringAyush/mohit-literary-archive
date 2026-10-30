#!/usr/bin/env python3
import re
from pathlib import Path

pages = [
    'page_031.md', 'page_034.md', 'page_036.md', 'page_037.md',
    'page_044.md', 'page_057.md', 'page_060.md', 'page_064.md',
    'page_066.md', 'page_071.md', 'page_099.md', 'page_113.md',
    'page_124.md', 'page_130.md', 'page_132.md'
]

text_dir = Path("src/lib/quotes and stories/mohit_yenugwar_full_archive/Text")

for p in pages:
    f = text_dir / p
    if not f.exists():
        continue
    content = f.read_text(encoding="utf-8")
    parts = content.split("```text\n")
    ocr = parts[1].split("\n```")[0] if len(parts) > 1 else "NO OCR"
    print(f"\n===== {p} =====")
    print(ocr)
