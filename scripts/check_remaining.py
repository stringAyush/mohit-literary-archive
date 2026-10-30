#!/usr/bin/env python3
import json
import re

quotes = json.load(open('src/lib/quotes/quotes.json'))
stories = json.load(open('src/lib/stories/stories.json'))

# Entries definitely excluded
EXCLUDED_IDS = {
    # Quotes to exclude
    "yq-p017", "yq-p020", "yq-p022", "yq-p024", "yq-p025", "yq-p026",
    "yq-p043", "yq-p045", "yq-p058", "yq-p075", "yq-p078", "yq-p079",
    "yq-p080", "yq-p081", "yq-p082", "yq-p083", "yq-p085", "yq-p086",
    "yq-p087", "yq-p088", "yq-p089", "yq-p090", "yq-p091", "yq-p094",
    "yq-p098", "yq-p101", "yq-p103", "yq-p104", "yq-p108", "yq-p110",
    "yq-p118", "yq-p120", "yq-p123", "yq-p131", "yq-p142", "yq-p145",
    "yq-p151", "yq-p164", "yq-p165", "yq-p168", "yq-p173", "yq-p176",
    "yq-p177", "yq-p178", "yq-p179", "yq-p180", "yq-p195", "yq-p197",
    "yq-p199", "yq-p201", "yq-p204",
    # Stories to exclude
    "yq-p002", "yq-p009", "yq-p016", "yq-p018", "yq-p023", "yq-p027",
    "yq-p030", "yq-p031", "yq-p032", "yq-p033", "yq-p034", "yq-p036",
    "yq-p040", "yq-p041", "yq-p044", "yq-p048", "yq-p049", "yq-p050",
    "yq-p055", "yq-p060", "yq-p061", "yq-p062", "yq-p063", "yq-p064",
    "yq-p066", "yq-p067", "yq-p068", "yq-p069", "yq-p070", "yq-p071",
    "yq-p073", "yq-p074", "yq-p076", "yq-p077", "yq-p084", "yq-p092",
    "yq-p093", "yq-p095", "yq-p096", "yq-p097", "yq-p099", "yq-p100",
    "yq-p113", "yq-p125", "yq-p132", "yq-p133", "yq-p134", "yq-p138",
    "yq-p139", "yq-p140", "yq-p141", "yq-p143", "yq-p144", "yq-p155",
    "yq-p159", "yq-p160", "yq-p161", "yq-p162", "yq-p181", "yq-p185",
    "yq-p187", "yq-p189", "yq-p190", "yq-p191", "yq-p194", "yq-p202",
    "yq-p203",
}

print(f"Total defined exclusions: {len(EXCLUDED_IDS)}")

all_works = quotes + stories
candidates = [w for w in all_works if w['id'] not in EXCLUDED_IDS]
print(f"Remaining candidates to check: {len(candidates)}")

for w in candidates:
    body = w.get('body', '')
    iid = w['id']
    # Check for any suspicious tokens or indicators
    has_cap = any(p in body.lower() for p in ['caption', 'पूरी', 'शीर्षक', 'अनुशीर्षक', 'show more', 'yourquote'])
    if has_cap:
        print(f"WARNING [has_cap]: {iid} -> {repr(body[:80])}")
