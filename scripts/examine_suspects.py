#!/usr/bin/env python3
import re
from pathlib import Path

pages = [
    'page_031.md', 'page_034.md', 'page_036.md', 'page_037.md',
    'page_044.md', 'page_057.md', 'page_060.md', 'page_064.md',
    'page_066.md', 'page_071.md', 'page_099.md', 'page_113.md',
    'page_124.md', 'page_130.md', 'page_132.md', 'page_133.md',
    'page_134.md', 'page_140.md', 'page_141.md', 'page_143.md',
    'page_160.md', 'page_161.md', 'page_162.md', 'page_181.md',
    'page_185.md', 'page_187.md', 'page_189.md', 'page_190.md',
    'page_191.md', 'page_194.md', 'page_203.md'
]

text_dir = Path("src/lib/quotes and stories/mohit_yenugwar_full_archive/Text")

for p in pages:
    f = text_dir / p
    if not f.exists():
        continue
    content = f.read_text(encoding="utf-8")
    m = re.search(r"OCR transcription.*?\n```text\n(.*?)\n```", content, re.DOTALL)
    ocr = m.group(1).strip() if m else "NO OCR"
    print(f"\n{'='*20} {p} {'='*20}")
    print(ocr)
