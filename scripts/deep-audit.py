#!/usr/bin/env python3
import json
import re

quotes = json.load(open('src/lib/quotes/quotes.clean.json'))
stories = json.load(open('src/lib/stories/stories.clean.json'))

print(f"Loaded {len(quotes)} quotes, {len(stories)} stories.")

def check_entry(item):
    body = item['body']
    iid = item['id']
    issues = []
    
    # 1. UI artifacts
    ui_words = ['yourquote', 'your@uote', 'show more', 'likes', 'comment', 'followers', 'following', 'joined', 'yush', 'open app']
    for w in ui_words:
        if w in body.lower():
            issues.append(f"ui_word:{w}")
            
    # 2. URLs or stamps
    if re.search(r'https?://|\.in/|\.com/|\b\d+/\d+/\d+\b|\b\d+:\d+\s*(?:am|pm)\b', body, re.IGNORECASE):
        issues.append("url_or_timestamp")
        
    # 3. OCR noise characters / fragments
    lines = [l.strip() for l in body.split('\n') if l.strip()]
    if any(len(l) == 1 and not ('\u0900' <= l <= '\u097F') for l in lines):
        issues.append("single_char_latin_symbol_line")
        
    # 4. Mixed script gibberish (e.g. Hindi sentence with stray Latin letters like Fer, fais, Gan, ty, SAH, etc.)
    has_dev = any('\u0900' <= ch <= '\u097F' for ch in body)
    if has_dev:
        # Check for isolated latin words in predominantly hindi text
        latin_words = re.findall(r'\b[a-zA-Z]+\b', body)
        # Filter out common english loanwords if any, but most are OCR noise like 'ya', 'Fer', 'Gan', 'lad', 'SAH'
        if latin_words:
            issues.append(f"latin_in_hindi:{latin_words}")
            
    # 5. Author self-attribution in body
    if re.search(r'[-—~]\s*mohit|@\s*mohit|mohit yenugwar', body, re.IGNORECASE):
        issues.append("author_tag_in_body")
        
    # 6. Garbage tokens
    for token in ['छि', 'yw', 'Saal Fs', '8००७०', '26०01', 'seeyepu', '02655']:
        if token in body:
            issues.append(f"garbage_token:{token}")
            
    return issues

print("\n--- ISSUES IN QUOTES ---")
for q in quotes:
    iss = check_entry(q)
    if iss:
        print(f"[{q['id']}] {iss}")
        for l in q['body'].split('\n')[:5]:
            print(f"    | {l}")

print("\n--- ISSUES IN STORIES ---")
for s in stories:
    iss = check_entry(s)
    if iss:
        print(f"[{s['id']}] {iss}")
        for l in s['body'].split('\n')[:5]:
            print(f"    | {l}")
