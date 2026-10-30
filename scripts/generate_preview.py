#!/usr/bin/env python3
import json
from scripts.test_clean_items import cleaned_items

# Filter out yq-p021
final_items = [it for it in cleaned_items if it['id'] != 'yq-p021']

print(f"Total verified publishable items: {len(final_items)}")

# Load original metadata (title, dates, tags, etc.)
quotes = {q['id']: q for q in json.load(open('src/lib/quotes/quotes.json'))}
stories = {s['id']: s for s in json.load(open('src/lib/stories/stories.json'))}
all_source = {**quotes, **stories}

with open("scripts/final_catalog_preview.txt", "w") as out:
    for idx, item in enumerate(final_items, 1):
        src = all_source.get(item['id'], {})
        title = src.get('title') or f"Untitled ({item['id']})"
        out.write(f"\n{'='*60}\n")
        out.write(f"#{idx} | ID: {item['id']} | Page: {item['pageNumber']} | Lang: {item['language']} | Type: {item['contentType']}\n")
        out.write(f"Title: {title} | Date: {src.get('visibleDate') or src.get('originalDate')}\n")
        out.write(f"Tags: {', '.join(src.get('tags', []))}\n")
        out.write(f"{'-'*60}\n")
        out.write(item['body'] + "\n")

print("Preview written to scripts/final_catalog_preview.txt")
