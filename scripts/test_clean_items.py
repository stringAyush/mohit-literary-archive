#!/usr/bin/env python3
import json
import re

# Read all 83 candidates
with open('scripts/candidates_dump.txt') as f:
    text = f.read()

entries = text.split('='*50)

print(f"Total entries: {len(entries)-1}")

def clean_body(iid, body):
    # Manual recoveries
    if iid == "yq-p047":
        return ("en", "POEM", "my last words to you\nwill keep circling back,\na shadow over everything —\nwe built from nothing.\nthey'll tear the promise open,\nreduce what once glowed\nto fragments of what we could have been.\nwe didn’t land—we crashed hard and\nour relationship came apart on impact.\nand all the light i forced\nout of my own darkness,\nall the jokes, the clumsy attempts\nto make you laugh\nwhen i was breaking inside,\nwill vanish too—\nlost in the wreckage\nof that goodbye i couldn't take back.")
    if iid == "yq-p072":
        return ("hi", "POEM", "मैं न रहूँ साथ, तो याद मुझे सादगी से करना,\nदेख रहा होऊँगा आसमान की उस ओर से तुमको।\nपर हर पल - तुम आँख मगर गीली मत करना,\nमिलना, बिछड़ना, साथ रहना - ये नसीब की बातें हैं।\nरास्ता अच्छा लगे, तो बेझिझक सफर तय करना,\nमिल जाए कोई जो तुम्हारा घर बन सके\nतो मुझे फूलों की तरह किताबों में दबा देना।\nपर जिस रोज़ वो किताब फिर से खोलो,\nतो पन्नों में दबे उन फूलों को धूल बना देना।")
    if iid == "yq-p114":
        return ("hi", "POEM", "उसके घर से मेरे घर तक बस एक गाने भर की\nदूरी है, पर उसका मन मेरे मन से कई प्रकाश वर्ष\nकी दूरी पार कर चुका है। फिर भी मैं निर्लज्ज सा\nआसमान तकता पाया जाता हूँ।")
    if iid == "yq-p116":
        return ("hi", "POEM", "तुम हर वो चीज कर रही हो\nजिसे करने से मैने तुम्हे रोके रखा था।\nजैसे कि अपने बालों को लाल करना।\nकिसी वजह से मलाल करना।\nमीठी बातों को संसार करना।\nअपने आधे सच का बुरा हाल करना।\nमेरे अच्छे सपनों का इंतिक़ाल करना।\nकहीं भीड़ में खुद को अलग कर मेरा हाल बेहाल करना।\nऔर सबसे जरूरी, मेरे दिल के टुकड़े चार करना।\nतब भी मैं आज भी वही खड़ा हूँ जहां गले लगाते हुए तुमने हम दोनों की\nधड़कनों को एक किया था।")
    if iid == "yq-p124":
        return ("hi", "REFLECTION", "लगभग सभी भाषाओं में मौन आकर्षित करता है\nवहीं कहाँ क्या बोलना है कि समझ न होने पर शब्द\nविकर्षित करते है।")
    if iid == "yq-p128":
        return ("en", "POEM", "i have died\na number of times\nand everytime i did\ncoming back to life\nfelt a little bit harder\nthan the previous time.")
    if iid == "yq-p130":
        return ("hi", "PROSE", "सुनता था, बोलता था, महसूस कर लेता था, वो मैं\nनहीं मेरा प्रेत था।\nमैं अब जो हूँ वो मैं हूँ। जो न हंसता है, न खेलता है,\nन सुनता है, न बोलता है, महसूस करने के नाम पर\nबस दर्द से दिल्‍लगी कर लेता है, जो सिर्फ सोचता है,\nपढ़ता है, लिखने को बैठो तो blank सा फील करता\nहै, जो प्यार को परिभाषित नहीं कर सकता, जो इतना\nconfuse है कि ठीक कोई एक व्यक्ति की तरफ\nउंगली नहीं कर सकता की हाँ ये है वो जो मेरा आधा\nसच है और बाकी मैं हूँ।")
    if iid == "yq-p137":
        return ("hi", "QUOTE", "मैं जीए जा चुके और बाकी जिए जाने के बीचो-बीच\nफंसा हुआ हूँ। और मुझे यक़ीन है कि मेरी पीठ से\nपश्चाताप का बेताल लटका हुआ है।")
    if iid == "yq-p158":
        return ("hi", "QUOTE", "कुछ लोग इश्क़ में होते हुए भी चुन चुन कर\nबातें करते है “मोहित” ;\nमुझे साथी ऐसा चाहिए जिसे एक बार चुन लूं\nतो फिर सारी बातें उसी से हो")
    if iid == "yq-p196":
        return ("en", "QUOTE", "she was my\nprimary focus\ni was her\nback-up plan.")
    if iid == "yq-p200":
        return ("en", "QUOTE", "we loved each other\njust not enough\nfor it to last\nuntil the end\nof time.")
    if iid == "yq-p029":
        return ("en", "QUOTE", "each passing second you let go becomes\na lost opportunity.")
    if iid == "yq-p037":
        return ("en", "POEM", "very frequently,\ni find myself\nlooking at her\nas if it’s the last time—\nas if it’s the final minute of my life—\nand all i want\nis to press every ounce of her\ninto my consciousness,\nto hold her there\nbefore my body gives way,\nso her memory stays with me\nfor all of eternity.")
    if iid == "yq-p038":
        return ("en", "POEM", "i want to be a bonfire\non a night that cuts\nto the bone,\nor a jacket\npulling you into its warmth\nlike it was made only for you.\ni want to be that simple—\nthat necessary—\nthat impossibly irreplaceable in your life.")
    if iid == "yq-p054":
        return ("en", "POEM", "my senses are failing drastically\nto make sense of the world\nthat i almost feel\nlike my soul is gone\nand my existence\ncomprises of\njust flesh and bones.")
    if iid == "yq-p057":
        return ("mixed", "POEM", "“और तो यार, इन मुश्किल हालातों का सामना भी\nकरना पड़ा,\nजाने किस ज़माने के थे, जाने कितने ज़मानों से\nगुज़रना पड़ा...”\n\n\"aur tou yaar, in mushkil haalaton ka\nsamna bhi karna pada,\nJaane kis zamane ke the, jaane kitne\nzamaano se guzarna pada...\"")
    if iid == "yq-p186":
        return ("en", "REFLECTION", "to think that someone, who you were\nin love with, who loved you back, who\nwas within your grasp, probably a few\ndoors away, now is no longer in your\nreach.\nif this doesn’t break you, i don’t know\nwhat will")
    if iid == "yq-p175":
        return ("hi", "SHORT_STORY", "आज से कुछ साल बाद जब हम मिले किसी\nअजनबी शहर में शायद मैं ना रहूं वैसा जैसा तुमने\nमुझे खोया था और शायद तुम भी ना रहो वैसी\nजैसा मैने तुमको पाया था।")
        
    # Standard cleanup
    c = body.strip()
    if c.startswith("छि\n"):
        c = c[4:].strip()
    
    # Strip trailing attribution like "— Mohit Yenugwar" if present
    c = re.sub(r'[\n\r]+\s*[-—~]\s*Mohit\s*Yenugwar.*$', '', c, flags=re.IGNORECASE).strip()
    
    # Detect language
    has_dev = any('\u0900' <= ch <= '\u097F' for ch in c)
    has_lat = any('a' <= ch.lower() <= 'z' for ch in c)
    lang = "en"
    if has_dev and has_lat:
        lang = "mixed"
    elif has_dev:
        lang = "hi"
    else:
        lang = "en"
        
    return (lang, None, c)

cleaned_items = []
for e in entries:
    lines = [l for l in e.strip().split('\n') if l]
    if not lines: continue
    header = lines[0]
    body = '\n'.join(lines[1:]).strip()
    m = re.match(r'\[(\d+)\]\s+(yq-p\d+)\s+\(page\s+(\d+),\s+lang=([^,]+),\s+type=([^)]+)\)', header)
    if not m: continue
    idx, iid, page, def_lang, def_type = m.groups()
    
    # Skip those we know are bad
    if iid in ["yq-p157", "yq-p051", "yq-p183"]:
        continue
        
    lang, ctype, clean = clean_body(iid, body)
    if not ctype:
        ctype = def_type
        
    cleaned_items.append({
        "id": iid,
        "pageNumber": int(page),
        "language": lang,
        "contentType": ctype,
        "body": clean
    })

print(f"Clean publishable items: {len(cleaned_items)}")
from collections import Counter
print("Language counts:", Counter(c["language"] for c in cleaned_items))
print("Content type counts:", Counter(c["contentType"] for c in cleaned_items))
