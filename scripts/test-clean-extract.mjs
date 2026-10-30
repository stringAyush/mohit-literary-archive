import fs from "node:fs";
import path from "node:path";

const dir = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes and stories/mohit_yenugwar_full_archive/Text";

const MANUAL_PAGE_FIXES = {
  3: "i made myself a prodigy,\njust for life to nerf me later.",
  4: "सालों को गिनना भूल गया,\nउनका पता-सा भूल गया,\nशायद मैं लिखना भूल गया,\nअब भी काग़ज़ सामने है,\nबस दर्द को लिखना भूल गया...",
  5: "चाहा था इक दफ़ा उसे अपना नाम दें,\nलफ़्ज़ होंठों तक आए, मगर ठहर न सके...",
  7: "मैंने लिखा \"हम फिर अजनबी हो गये\"\nऔर कलम की नोक टूट गई...\nस्याही फैली है पन्ने पर इस कदर,\nकि वो मुझे फिर से सौंप गई...\nमैं कहता रहा यही बस वस्ल-ए-यार...",
  8: "मुझे मरने का इतना शौक है\nकि इक रोज़\nतेज़ गाड़ी के सामने आऊँगा\nऔर ठहर जाऊँगा...\nशायद वो भी\nमेरी तरह थकी होगी;\nआखिरी सफ़र पर...",
  10: "दिल नहीं करता अब तुझ पे कोई गीत गाने को।\nमेरी आँखें घिरी हुई हैं दुष्कर हालातों से,\nकौन आएगा अब अँधेरे के दीप जलाने को?\nएक उम्मीद का धागा भी धीरे से खो दिया;\nबस एक आखिरी बार गले लगाने को।\nअब तो आदत-सी है टूट जाने की मोहित,\nकौन रोकेगा तुझे यूँ बिखर जाने को?",
  12: "ऐसे दिनों,\nकिन्हीं हालातों में\nजब मैं बिखर जाता हूँ\nमैं तुमसे प्यार करता हूँ।",
  13: "रात नहीं है यह\nसच को छुपाने की,\nदूर, निर्वाक चाँद से\nनज़रें चुराने की।\nरात नहीं है यह\nदिल दुखाने की,\nतेरे आकर\nयूँ ही लौट जाने की।\nरात नहीं है यह\nसपनों के बह जाने की...",
  14: "इतना भी दिखावा ठीक नहीं\nरोने को हो तुम--चेहरे पर ये हँसी का मुखौटा ठीक नहीं।\nदुःख-दर्द भी हिस्से हैं ज़िंदगी के,\nउन्हें मन में यूँ दबाना ठीक नहीं।\nतुम सोचती होगी--लिखता है कुछ,\nहाँ, शायद मुझे ही जैसा कुछ,\nफिर तुम्हारा ये अकड़ दिखाना ठीक नहीं।\nमैं भी सोया नहीं, तुम भी खोई-सी रहती हो,\nयूँ किसी की नींद चुराना ठीक नहीं।\nमोहब्बत है तो कह दो साफ़-साफ़,\nयूँ छुप-छुपकर स्टॉक करना ठीक नहीं।\nइश्क़ होते हुए महबूब से किनारा करके,\nयूँ दिल को दुखाना ठीक नहीं।",
  15: "समझौता कर लेते हैं\nदो प्यारी बातें आज फिर कर लेते हैं।\nतुम भी खुश नहीं, मैं भी उदास हूँ,\nआज फिर एक मुलाक़ात तय कर लेते हैं।",
  19: "मैं नहीं चाहता तुझे किसी से कोई फ़रियाद हो,\nचाहे मैं बर्बाद हो जाऊँ, तेरी दुनिया मगर आबाद हो...",
  198: "ना जाने ये जान कर कितना सुकून पहुंचे,\nकी उसके बाद तबाह हो गया हूं मैं..."
};

function extractCleanWork(content, pageNum) {
  if (MANUAL_PAGE_FIXES[pageNum]) {
    return MANUAL_PAGE_FIXES[pageNum];
  }

  const ocrParts = content.split("```text");
  const ocr = ocrParts.length > 1 ? ocrParts[1].split("```")[0].trim() : "";
  const lines = ocr.split("\n");

  const bodyLines = [];
  for (let l of lines) {
    let t = l.trim();
    if (!t) continue;

    // Stop at author attribution
    if (/^[-—~]\s*Mohit\s*Yenugwar/i.test(t) || /^Mohit\s*Yenugwar$/i.test(t)) {
      break;
    }

    // Skip print / UI noise
    if (/\d+\/\d+\/\d+.*YourQuote/i.test(t)) continue;
    if (/https?:\/\//i.test(t)) continue;
    if (/\b\d+\/207\b/.test(t)) continue;
    if (/Search people & hashtags/i.test(t)) continue;
    if (/Write your own quotes/i.test(t)) continue;
    if (/Open App/i.test(t)) continue;
    if (/Add your comment/i.test(t)) continue;
    if (/^\d+\s*likes?/i.test(t)) continue;
    if (/^Your@?uote(\.in)?$/i.test(t)) continue;
    if (/^HomeExploreBookstore/i.test(t)) continue;
    if (/^Follow\b/i.test(t)) continue;
    if (/^\d+\s*Followers/i.test(t)) continue;
    if (/^Joined\s+\d+/i.test(t)) continue;
    if (/^Quotes\s+\d+/i.test(t)) continue;
    if (/^Testimonials\s+\d+/i.test(t)) continue;
    if (/^Ayush\b/i.test(t)) continue;
    if (/^A yush\b/i.test(t)) continue;
    if (/^401 yush\b/i.test(t)) continue;
    if (/^C yush\b/i.test(t)) continue;
    if (/^©\s*$/i.test(t)) continue;
    if (/^[e® छि छ ° \(\)]\s*$/i.test(t)) continue;
    if (/^#\S+/i.test(t)) continue;

    bodyLines.push(t);
  }

  // Strip leading short junk (floating dandelion seeds, watermark icon)
  while (bodyLines.length > 0 && bodyLines[0].length <= 3 && !/[\u0900-\u097F]/.test(bodyLines[0])) {
    bodyLines.shift();
  }

  return bodyLines.join("\n").trim();
}

for (let i = 2; i <= 20; i++) {
  const p = String(i).padStart(3, "0");
  const file = `page_${p}.md`;
  const content = fs.readFileSync(path.join(dir, file), "utf8");
  const cleaned = extractCleanWork(content, i);
  console.log(`\n=== PAGE ${i} ===`);
  console.log(cleaned);
}
