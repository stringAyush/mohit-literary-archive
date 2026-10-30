#!/usr/bin/env python3
from scripts.test_clean_items import cleaned_items

for it in cleaned_items:
    if it['id'] in ['yq-p021']:
        continue
    body = it['body']
    for l in body.split('\n'):
        # Check suspicious symbols
        for ch in ['~', '^', '`', '{', '}', '<', '>', '®', '©', '°', '¢', '£', '¥', '§', '¶', '¿']:
            if ch in l:
                print(f"SUSPICIOUS SYMBOL in {it['id']}: {repr(l)}")
        for w in ['yourquote', 'mohit', 'show more', 'likes', 'comment', 'http']:
            if w in l.lower():
                print(f"SUSPICIOUS UI WORD in {it['id']}: {repr(l)}")

print("Done symbol/word scan.")
