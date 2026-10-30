#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path("/home/phoenix/Downloads/mohit-literary-archive")
QUOTES_IN = ROOT / "src/lib/quotes/quotes.json"
STORIES_IN = ROOT / "src/lib/stories/stories.json"
TEXT_DIR = ROOT / "src/lib/quotes and stories/mohit_yenugwar_full_archive/Text"

quotes = json.load(open(QUOTES_IN))
stories = json.load(open(STORIES_IN))

print(f"Total quotes: {len(quotes)}, stories: {len(stories)}")

# Collect all entries by ID
all_items = {}
for q in quotes:
    all_items[q["id"]] = ("quote", q)
for s in stories:
    all_items[s["id"]] = ("story", s)

print(f"Total unique source items: {len(all_items)}")
