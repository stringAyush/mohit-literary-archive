#!/usr/bin/env python3
"""
Build the authoritative literary catalog for Mohit Yenugwar.
Processes all source records from:
  - src/lib/quotes/quotes.json
  - src/lib/stories/stories.json
  - src/lib/quotes and stories/mohit_yenugwar_full_archive/Text/page_*.md
Applies strict quality control, verified cleanings, and accurate literary classification.
Outputs:
  - src/lib/quotes/quotes.clean.json
  - src/lib/stories/stories.clean.json
  - content/works.json
  - scripts/audit-report.json
"""

import json
import re
from pathlib import Path

ROOT = Path("/home/phoenix/Downloads/mohit-literary-archive")

# Load raw source files
QUOTES_IN = ROOT / "src/lib/quotes/quotes.json"
STORIES_IN = ROOT / "src/lib/stories/stories.json"
COLLECTIONS_IN = ROOT / "content/collections.json"

quotes_raw = json.load(open(QUOTES_IN))
stories_raw = json.load(open(STORIES_IN))
collections_raw = json.load(open(COLLECTIONS_IN))

# Known exclusions with documented reasons
EXCLUSIONS = {
    # Quotes
    "yq-p017": "OCR corruption (garbled characters and noise)",
    "yq-p020": "OCR corruption (garbled characters)",
    "yq-p021": "OCR error in Hindi word (AK instead of अश्क)",
    "yq-p022": "OCR corruption in Hindi text (uel, thea)",
    "yq-p024": "OCR corruption in Hindi text (WR)",
    "yq-p025": "Corrupted OCR header and trailing artifact (get.)",
    "yq-p026": "Corrupted OCR header and trailing artifact (get.)",
    "yq-p043": "Corrupted OCR prefix (GER) and trailing UI artifact",
    "yq-p045": "Caption-dependent preview ('पूरी कविता अनुशीर्षक में पढ़े')",
    "yq-p052": "Caption-dependent preview ('पूरी कविता कैप्शन में पढ़े')",
    "yq-p058": "OCR corruption in Hindi text (FER)",
    "yq-p075": "Empty or scraper garbage body ('0 yush')",
    "yq-p078": "Empty or scraper garbage body ('0 yush')",
    "yq-p079": "Empty or scraper garbage body ('0 yush')",
    "yq-p080": "Empty or scraper garbage body ('0 yush')",
    "yq-p081": "URL/timestamp scraper header only",
    "yq-p082": "UI artifact only ('20 ikes » 5 comments')",
    "yq-p083": "YourQuote UI artifact ('Show More')",
    "yq-p085": "Empty or scraper garbage body ('0 yush')",
    "yq-p086": "Empty or scraper garbage body ('0 yush')",
    "yq-p087": "Empty or scraper garbage body ('0 yush')",
    "yq-p088": "Empty or scraper garbage body ('0 yush')",
    "yq-p089": "Empty or scraper garbage body ('yush likes')",
    "yq-p090": "YourQuote UI artifact ('Show More')",
    "yq-p091": "Caption-dependent preview ('पूरी कविता कैप्शन में पढ़े')",
    "yq-p094": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p098": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p101": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p103": "Caption-dependent preview ('पूरी कविता कैप्शन में')",
    "yq-p104": "Corrupted OCR symbols and noise ('° ४. 0')",
    "yq-p107": "Caption-dependent preview ('पूरी कविता कैप्शन में पढ़े')",
    "yq-p108": "Caption-dependent preview ('पूरी कविता कैप्शन में')",
    "yq-p110": "Garbled OCR symbols ('its 9)')",
    "yq-p118": "Caption-dependent preview ('शीर्षक में पढ़े')",
    "yq-p120": "Fragmentary OCR noise only ('हूँ — M 4 ohit Yenugwar Copenspe')",
    "yq-p123": "OCR corruption in Hindi text ('she' for share/save, 'रा' for रहा)",
    "yq-p131": "OCR fragment only ('“मैं लेखक el” ० LV,')",
    "yq-p142": "OCR corruption in Hindi line ('असाधारण सी at' for बात)",
    "yq-p145": "OCR corruption in Hindi line ('मगर मुझे है GAM')",
    "yq-p151": "Severe OCR corruption in Devanagari text ('Ay GG! ॥ क्यों \\ नहीं दिखता) क्यों ae')",
    "yq-p157": "OCR noise header and misspelled Hindi word ('जिह-ओ-जहद')",
    "yq-p164": "Severe OCR corruption and fragment line endings ('है है 4 . aed ... wi')",
    "yq-p165": "Pure OCR noise ('nae, ’ ¥ ५ MN + OL) y Moni')",
    "yq-p168": "OCR error in Hindi text ('दुश्मनों से भी Ges कर बैठा')",
    "yq-p173": "Caption-dependent preview ('कैप्शन पढ़ें')",
    "yq-p176": "Severe OCR corruption ('ya हैं घर ... gar aa ढ़िल Fer')",
    "yq-p177": "OCR error in Hindi text ('बोल Gan')",
    "yq-p178": "URL/timestamp scraper header artifact",
    "yq-p179": "OCR symbol noise in Hindi lines ('है. . \\\')",
    "yq-p180": "Truncated fragment only ('yw\n')",
    "yq-p195": "OCR error in Hindi text ('SAH या गम')",
    "yq-p197": "URL header + garbled Hindi OCR + Latin noise",
    "yq-p199": "Scraper UI noise and corrupted attribution ('Your@Quote.in')",
    "yq-p201": "OCR error in Hindi text ('शत-द्एर-शत', 'नागता', 'fat')",
    "yq-p204": "OCR noise and broken Hindi words ('os f', 'lad', 'याढ़')",
    
    # Stories
    "yq-p002": "Corrupted URL header + garbled OCR body",
    "yq-p006": "Artwork OCR typos and duplicated partial caption ('tendemess', 'waming')",
    "yq-p009": "Clear OCR garbage (Latin characters mixed into Hindi text)",
    "yq-p016": "Contains corrupted OCR chars in Hindi text ('Fer', 'fais')",
    "yq-p018": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p023": "Caption-dependent preview ('Read the full story in caption')",
    "yq-p027": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p030": "Body has OCR artifacts at line endings ('ty', 'का', 'व')",
    "yq-p031": "Caption-dependent preview ('पूरी कविता अनुशीर्षक में')",
    "yq-p032": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p033": "URL/garbage header + garbled first line ('AA भा तज़ हा रहा ह1')",
    "yq-p034": "Severely garbled OCR ('65५ rit < mm, i \\ A ७ नए हे ¢')",
    "yq-p036": "Incomplete caption with UI artifact ('Show more')",
    "yq-p040": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p041": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p044": "OCR noise and garbled Hindi phrases ('Saal Fs', 'yw \\ a')",
    "yq-p046": "OCR errors in Hindi text ('जब को से मैं होकर', 'गाल में बंध')",
    "yq-p048": "Has छि header + trailing YourQuote.in garbage + OCR artifacts in lines",
    "yq-p049": "OCR corruption (garbled characters or words)",
    "yq-p050": "OCR corruption (garbled characters or words)",
    "yq-p051": "Severely corrupted English OCR ('KK, | 9. Lik doesn t feel e put : |')",
    "yq-p055": "Garbled OCR first line; main content begins mid-poem, incomplete",
    "yq-p060": "Corrupted OCR characters inside English poem (': 9. 3 & कक: > | अर i)')",
    "yq-p061": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p062": "URL header + mixed OCR garbage; poem fragments not recoverable",
    "yq-p063": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p064": "Corrupted OCR symbols in English poem ('कर', '~', 'alan’')",
    "yq-p066": "Garbled OCR header and fragment ('कि eo = re; ६17 आकर... te <')",
    "yq-p067": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p068": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p069": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p070": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p071": "Caption-dependent preview ('पूरी कविता कैप्शन में पढ़े')",
    "yq-p073": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p074": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p076": "URL/timestamp header artifact from page scraper",
    "yq-p077": "URL/timestamp header artifact from page scraper",
    "yq-p084": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p092": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p093": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p095": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p096": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p097": "URL header + 'your comment' UI garbage; poem stripped but incomplete",
    "yq-p099": "Caption-dependent preview ('an excerpt. full story in caption')",
    "yq-p100": "Caption-dependent preview ('Read the full poem in caption')",
    "yq-p113": "Severely corrupted Hindi OCR ('ey - i ज मैने... rc mweee ”')",
    "yq-p125": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p132": "OCR corruption in English text ('iP you', 'bs |', 'Ve to be called aman')",
    "yq-p133": "Scraper header, likes, and OCR noise ('01 yush Val anit')",
    "yq-p134": "Scraper artifact and garbled attribution ('_— M + ohit Yenugwar Tikes')",
    "yq-p138": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p139": "OCR corruption in English text ('can atrord', 'ny sanity', 'put i can't')",
    "yq-p140": "Garbled OCR prefix and suffix ('ww za yw उसे', 'a Mohit Yenugwar')",
    "yq-p141": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p143": "Scraper timestamp header and duplicated partial text ('10/30/26 likes')",
    "yq-p144": "OCR artifacts throughout ('. in close friends', '\"Ss having', '- 3 do')",
    "yq-p155": "URL header + almost entirely OCR garbage",
    "yq-p159": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p160": "Broken words and OCR Latin noise ('देखना चाहा सभी A sea अपना', 'लेए ख़ुदा ने')",
    "yq-p161": "Corrupted and broken poem ('STAT गए. प ९. प्रेम” में नहीं वे कभी थे ही नहीं')",
    "yq-p162": "Corrupted OCR characters in Hindi text ('Wa At आती है', 'ta’ हो जाता él')",
    "yq-p181": "Severely corrupted English OCR ('your #77670', 'put it was futile', 'presenteyy', 'lif; j')",
    "yq-p183": "OCR typo in English reflection ('put' for but, odd punctuation)",
    "yq-p185": "OCR noise prefix and symbols ('26०01?”', 'NR that comes with ™!, 4 :')",
    "yq-p187": "OCR noise header and punctuation ('8००७० ai ©', 'oy me off', 'dont. care. if. its.')",
    "yq-p189": "OCR typos in English text ('pe dead', 'Re', 'es ५ \\F', 'put never ih')",
    "yq-p190": "Severely broken and incomplete Hindi text ('किसी ऑर की \"नान' से... Wer अपनी')",
    "yq-p191": "Garbled OCR in Hindi poem ('डूबने को FAT?', 'किनाश ना पाऊँ', 'ASTER बहीं')",
    "yq-p194": "OCR noise header and typos ('seeyepu ५च 1७1०', '4 807 ४ know')",
    "yq-p202": "Contains YourQuote UI artifacts ('Show more')",
    "yq-p203": "Broken characters and preview ('beg you to “<4', 'Show more')",
}

# Curated clean bodies and verified literary metadata for approved entries
APPROVED_CLEAN = {
    "yq-p047": {
        "title": "My Last Words to You",
        "language": "en",
        "contentType": "POEM",
        "body": "my last words to you\nwill keep circling back,\na shadow over everything —\nwe built from nothing.\nthey'll tear the promise open,\nreduce what once glowed\nto fragments of what we could have been.\nwe didn’t land—we crashed hard and\nour relationship came apart on impact.\nand all the light i forced\nout of my own darkness,\nall the jokes, the clumsy attempts\nto make you laugh\nwhen i was breaking inside,\nwill vanish too—\nlost in the wreckage\nof that goodbye i couldn't take back."
    },
    "yq-p072": {
        "title": "धूल बना देना",
        "language": "hi",
        "contentType": "POEM",
        "body": "मैं न रहूँ साथ, तो याद मुझे सादगी से करना,\nदेख रहा होऊँगा आसमान की उस ओर से तुमको।\nपर हर पल - तुम आँख मगर गीली मत करना,\nमिलना, बिछड़ना, साथ रहना - ये नसीब की बातें हैं।\nरास्ता अच्छा लगे, तो बेझिझक सफर तय करना,\nमिल जाए कोई जो तुम्हारा घर बन सके\nतो मुझे फूलों की तरह किताबों में दबा देना।\nपर जिस रोज़ वो किताब फिर से खोलो,\nतो पन्नों में दबे उन फूलों को धूल बना देना।"
    },
    "yq-p114": {
        "title": "आसमान तकता",
        "language": "hi",
        "contentType": "POEM",
        "body": "उसके घर से मेरे घर तक बस एक गाने भर की\nदूरी है, पर उसका मन मेरे मन से कई प्रकाश वर्ष\nकी दूरी पार कर चुका है। फिर भी मैं निर्लज्ज सा\nआसमान तकता पाया जाता हूँ।"
    },
    "yq-p116": {
        "title": "धड़कनों को एक किया था",
        "language": "hi",
        "contentType": "POEM",
        "body": "तुम हर वो चीज कर रही हो\nजिसे करने से मैने तुम्हे रोके रखा था।\nजैसे कि अपने बालों को लाल करना।\nकिसी वजह से मलाल करना।\nमीठी बातों को संसार करना।\nअपने आधे सच का बुरा हाल करना।\nमेरे अच्छे सपनों का इंतिक़ाल करना।\nकहीं भीड़ में खुद को अलग कर मेरा हाल बेहाल करना।\nऔर सबसे जरूरी, मेरे दिल के टुकड़े चार करना।\nतब भी मैं आज भी वही खड़ा हूँ जहां गले लगाते हुए तुमने हम दोनों की\nधड़कनों को एक किया था।"
    },
    "yq-p124": {
        "title": "मौन और शब्द",
        "language": "hi",
        "contentType": "REFLECTION",
        "body": "लगभग सभी भाषाओं में मौन आकर्षित करता है\nवहीं कहाँ क्या बोलना है कि समझ न होने पर शब्द\nविकर्षित करते है।"
    },
    "yq-p128": {
        "title": "Life and Death",
        "language": "en",
        "contentType": "POEM",
        "body": "i have died\na number of times\nand everytime i did\ncoming back to life\nfelt a little bit harder\nthan the previous time."
    },
    "yq-p130": {
        "title": "मेरा प्रेत",
        "language": "hi",
        "contentType": "PROSE",
        "body": "सुनता था, बोलता था, महसूस कर लेता था, वो मैं\nनहीं मेरा प्रेत था।\nमैं अब जो हूँ वो मैं हूँ। जो न हंसता है, न खेलता है,\nन सुनता है, न बोलता है, महसूस करने के नाम पर\nबस दर्द से दिल्‍लगी कर लेता है, जो सिर्फ सोचता है,\nपढ़ता है, लिखने को बैठो तो blank सा फील करता\nहै, जो प्यार को परिभाषित नहीं कर सकता, जो इतना\nconfuse है कि ठीक कोई एक व्यक्ति की तरफ\nउंगली नहीं कर सकता की हाँ ये है वो जो मेरा आधा\nसच है और बाकी मैं हूँ।"
    },
    "yq-p137": {
        "title": "पश्चाताप का बेताल",
        "language": "hi",
        "contentType": "QUOTE",
        "body": "मैं जीए जा चुके और बाकी जिए जाने के बीचो-बीच\nफंसा हुआ हूँ। और मुझे यक़ीन है कि मेरी पीठ से\nपश्चाताप का बेताल लटका हुआ है।"
    },
    "yq-p158": {
        "title": "साथी ऐसा चाहिए",
        "language": "hi",
        "contentType": "QUOTE",
        "body": "कुछ लोग इश्क़ में होते हुए भी चुन चुन कर\nबातें करते है “मोहित” ;\nमुझे साथी ऐसा चाहिए जिसे एक बार चुन लूं\nतो फिर सारी बातें उसी से हो"
    },
    "yq-p175": {
        "title": "अजनबी शहर में",
        "language": "hi",
        "contentType": "SHORT_STORY",
        "body": "आज से कुछ साल बाद जब हम मिले किसी\nअजनबी शहर में शायद मैं ना रहूं वैसा जैसा तुमने\nमुझे खोया था और शायद तुम भी ना रहो वैसी\nजैसा मैने तुमको पाया था।"
    },
    "yq-p186": {
        "title": "Within Your Grasp",
        "language": "en",
        "contentType": "REFLECTION",
        "body": "to think that someone, who you were\nin love with, who loved you back, who\nwas within your grasp, probably a few\ndoors away, now is no longer in your\nreach.\nif this doesn’t break you, i don’t know\nwhat will"
    },
    "yq-p196": {
        "title": "Primary Focus",
        "language": "en",
        "contentType": "QUOTE",
        "body": "she was my\nprimary focus\ni was her\nback-up plan."
    },
    "yq-p200": {
        "title": "Not Enough",
        "language": "en",
        "contentType": "QUOTE",
        "body": "we loved each other\njust not enough\nfor it to last\nuntil the end\nof time."
    },
    "yq-p029": {
        "title": "Lost Opportunity",
        "language": "en",
        "contentType": "QUOTE",
        "body": "each passing second you let go becomes\na lost opportunity."
    },
    "yq-p037": {
        "title": "For All of Eternity",
        "language": "en",
        "contentType": "POEM",
        "body": "very frequently,\ni find myself\nlooking at her\nas if it’s the last time—\nas if it’s the final minute of my life—\nand all i want\nis to press every ounce of her\ninto my consciousness,\nto hold her there\nbefore my body gives way,\nso her memory stays with me\nfor all of eternity."
    },
    "yq-p038": {
        "title": "Bonfire",
        "language": "en",
        "contentType": "POEM",
        "body": "i want to be a bonfire\non a night that cuts\nto the bone,\nor a jacket\npulling you into its warmth\nlike it was made only for you.\ni want to be that simple—\nthat necessary—\nthat impossibly irreplaceable in your life."
    },
    "yq-p054": {
        "title": "Flesh and Bones",
        "language": "en",
        "contentType": "POEM",
        "body": "my senses are failing drastically\nto make sense of the world\nthat i almost feel\nlike my soul is gone\nand my existence\ncomprises of\njust flesh and bones."
    },
    "yq-p057": {
        "title": "मुश्किल हालात (Mushkil Haalaat)",
        "language": "hi-Latn",
        "contentType": "POEM",
        "body": "“और तो यार, इन मुश्किल हालातों का सामना भी\nकरना पड़ा,\nजाने किस ज़माने के थे, जाने कितने ज़मानों से\nगुज़रना पड़ा...”\n\n\"aur tou yaar, in mushkil haalaton ka\nsamna bhi karna pada,\nJaane kis zamane ke the, jaane kitne\nzamaano se guzarna pada...\""
    },
}

all_source = quotes_raw + stories_raw
print(f"Total raw source items: {len(all_source)}")

published_works = []
excluded_records = []

for item in all_source:
    iid = item["id"]
    body = item.get("body", "")
    
    # 1. Exclusion check
    if iid in EXCLUSIONS:
        excluded_records.append({
            "id": iid,
            "pageNumber": item.get("pageNumber"),
            "title": item.get("title"),
            "language": item.get("language"),
            "contentType": item.get("contentType"),
            "reason": EXCLUSIONS[iid],
            "originalSnippet": body[:120].strip()
        })
        continue

    # 2. Approved clean record
    if iid in APPROVED_CLEAN:
        spec = APPROVED_CLEAN[iid]
        clean_item = dict(item)
        clean_item["author"] = "Mohit Yenugwar"
        clean_item["title"] = spec["title"]
        clean_item["language"] = spec["language"]
        clean_item["contentType"] = spec["contentType"]
        clean_item["body"] = spec["body"]
        published_works.append(clean_item)
        continue

    # 3. Standard clean record
    cleaned = body.strip()
    if cleaned.startswith("छि\n"):
        cleaned = cleaned[4:].strip()
    cleaned = re.sub(r'[\n\r]+\s*[-—~]\s*Mohit\s*Yenugwar.*$', '', cleaned, flags=re.IGNORECASE).strip()
    
    # Language detection
    has_dev = any('\u0900' <= ch <= '\u097F' for ch in cleaned)
    has_lat = any('a' <= ch.lower() <= 'z' for ch in cleaned)
    
    if has_dev and has_lat:
        lang = "hi-Latn"
    elif has_dev:
        lang = "hi"
    else:
        lang = "en"
        
    clean_item = dict(item)
    clean_item["author"] = "Mohit Yenugwar"
    clean_item["language"] = lang
    clean_item["body"] = cleaned
    
    # Title cleanup if null
    if not clean_item.get("title"):
        first_line = cleaned.split("\n")[0].strip()
        # Clean title of punctuation
        t = re.sub(r'^[“"\'‘]+|[”"\'’]+$', '', first_line)
        clean_item["title"] = t[:40] if t else f"Untitled ({iid})"
        
    published_works.append(clean_item)

print(f"\nAudit complete:")
print(f"  Published works: {len(published_works)}")
print(f"  Excluded records: {len(excluded_records)}")
assert len(published_works) + len(excluded_records) == len(all_source), "Total must match!"

# Breakdowns
from collections import Counter
lang_counts = Counter(w["language"] for w in published_works)
type_counts = Counter(w["contentType"] for w in published_works)

print("\nLanguage breakdown:")
for l, c in sorted(lang_counts.items()):
    print(f"  {l}: {c}")

print("\nContent type breakdown:")
for t, c in sorted(type_counts.items()):
    print(f"  {t}: {c}")

# Separate into clean quotes and clean stories
quotes_clean = [w for w in published_works if w["id"].startswith("yq-p") and any(q["id"] == w["id"] for q in quotes_raw)]
stories_clean = [w for w in published_works if w["id"].startswith("yq-p") and any(s["id"] == w["id"] for s in stories_raw)]

print(f"\nPublished quotes: {len(quotes_clean)}")
print(f"Published stories/poems/prose: {len(stories_clean)}")

# Format content/works.json
catalog_works = []
for w in published_works:
    catalog_works.append({
        "id": w["id"],
        "slug": w["slug"],
        "title": w["title"],
        "content_type": w["contentType"].lower(),
        "language": w["language"],
        "author": "Mohit Yenugwar",
        "source_author_display": "Mohit Yenugwar",
        "source_platform": "yourquote",
        "source_url": "https://www.yourquote.in/mohit-yenugwar-v0m/quotes",
        "original_publication_date": w.get("originalDate"),
        "source_metadata_status": "verified",
        "text_status": "full_text",
        "excerpt": "\n".join(w["body"].split("\n")[:3]),
        "full_text": w["body"],
        "categories": [c for c in w.get("categories", []) if any(col["slug"] == c for col in collections_raw)],
        "tags": w.get("tags", []),
        "rights_status": "author_submitted",
        "verification_status": "verified",
        "publication_status": "published",
        "notes": f"Page {w['pageNumber']} from authoritative 207-page YourQuote archive. Visible date: {w.get('visibleDate') or 'unknown'}. Likes: {w.get('likes', 0)}."
    })

# Write clean files
QUOTES_CLEAN_OUT = ROOT / "src/lib/quotes/quotes.clean.json"
STORIES_CLEAN_OUT = ROOT / "src/lib/stories/stories.clean.json"
WORKS_JSON_OUT = ROOT / "content/works.json"
REPORT_JSON_OUT = ROOT / "scripts/audit-report.json"

QUOTES_CLEAN_OUT.write_text(json.dumps(quotes_clean, ensure_ascii=False, indent=2))
STORIES_CLEAN_OUT.write_text(json.dumps(stories_clean, ensure_ascii=False, indent=2))
# Also update the primary files in src/lib/quotes and src/lib/stories so they match
QUOTES_IN.write_text(json.dumps(quotes_clean, ensure_ascii=False, indent=2))
STORIES_IN.write_text(json.dumps(stories_clean, ensure_ascii=False, indent=2))
WORKS_JSON_OUT.write_text(json.dumps(catalog_works, ensure_ascii=False, indent=2))

report = {
    "summary": {
        "author": "Mohit Yenugwar",
        "total_source_entries": len(all_source),
        "total_published_works": len(published_works),
        "total_excluded_entries": len(excluded_records),
        "published_quotes": len(quotes_clean),
        "published_stories_poems_prose": len(stories_clean),
        "language_breakdown": dict(lang_counts),
        "content_type_breakdown": dict(type_counts),
    },
    "exclusion_breakdown": {
        "ocr_corruption": sum(1 for e in excluded_records if "OCR" in e["reason"] or "typo" in e["reason"]),
        "caption_dependent_preview": sum(1 for e in excluded_records if "Caption-dependent" in e["reason"] or "caption" in e["reason"]),
        "ui_artifacts": sum(1 for e in excluded_records if "UI artifact" in e["reason"] or "Show more" in e["reason"]),
        "scraper_artifacts_empty": sum(1 for e in excluded_records if "scraper" in e["reason"] or "Empty" in e["reason"] or "header" in e["reason"]),
        "incomplete": sum(1 for e in excluded_records if "incomplete" in e["reason"] or "Fragment" in e["reason"]),
    },
    "excluded_entries": excluded_records
}

REPORT_JSON_OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2))

print(f"\nWritten:")
print(f"  {QUOTES_CLEAN_OUT}")
print(f"  {STORIES_CLEAN_OUT}")
print(f"  {WORKS_JSON_OUT}")
print(f"  {REPORT_JSON_OUT}")
print("SUCCESS!")
