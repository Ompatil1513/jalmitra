"""Simple rule-based Marathi/English farming assistant. It answers from the farm's real data (no LLM)."""
from .agri import plan, ACTIONS, STAGES, CROPS, SOILS, recommend_crops
from .tips import TIPS


def _has(m, words): return any(w in m for w in words)


def reply(farm, wx, msg, lang):
    m, mr = msg.lower().strip(), lang == "mr"
    L = lambda en, m_: m_ if mr else en
    tip = lambda i: next(t for t in TIPS if t["id"] == i)
    k = "mr" if mr else "en"
    if m in ("hi", "hello", "hey", "नमस्कार", "नमस्ते", "हॅलो"):
        return L("Hello! Ask me about irrigation, weather, water stock, crops or water-saving tips.", "नमस्कार! सिंचन, हवामान, पाणी साठा, पिके किंवा पाणी बचतीबद्दल विचारा.")
    if _has(m, ["ठिबक", "drip"]): t = tip("drip"); return f"{t['title'][k]}: {t['body'][k]}"
    if _has(m, ["आच्छादन", "मल्चिंग", "mulch"]): t = tip("mulch"); return f"{t['title'][k]}: {t['body'][k]}"
    if _has(m, ["पावसाचे पाणी", "साठवण", "शेततळ", "rainwater", "harvest"]): t = tip("rain"); return f"{t['title'][k]}: {t['body'][k]}"
    if _has(m, ["बचत", "टिप", "save water", "saving", "tips"]):
        return L("Ways to save water:\n", "पाणी बचतीचे मार्ग:\n") + "\n".join(f"• {t['title'][k]} ({t['saving']})" for t in TIPS)
    if not farm:
        return L("Please add a farm first so I can give advice for your field.", "तुमच्या शेतासाठी सल्ला देण्यासाठी आधी शेत जोडा.")
    crop = CROPS[farm.crop][k]
    if _has(m, ["सिंचन", "पाणी द्या", "पाणी कधी", "कधी", "किती", "irrigat", "when", "how much", "water now"]):
        p = plan(farm, wx)
        a = ACTIONS[p["action"]][1 if mr else 0]
        s = L(f"{farm.name} ({crop}, {STAGES[p['stage']][0]}): {a}.", f"{farm.name} ({crop}, {STAGES[p['stage']][1]} अवस्था): {a}.")
        if p["liters"]:
            s += L(f" Apply about {p['liters']:,} litres ({p['gross_mm']} mm) on {p['date']}.", f" {p['date']} रोजी सुमारे {p['liters']:,} लिटर ({p['gross_mm']} मिमी) पाणी द्यावे.")
        return s + "\n" + "\n".join("• " + r[k] for r in p["reasons"][:4])
    if _has(m, ["हवामान", "पाऊस", "तापमान", "weather", "rain", "temp"]):
        s = "\n".join(L(f"{w['day']}: {w['tmin']:.0f}–{w['tmax']:.0f}°C, rain {w['rain']:.0f} mm ({w['rain_prob']:.0f}%)",
                        f"{w['day']}: {w['tmin']:.0f}–{w['tmax']:.0f}°C, पाऊस {w['rain']:.0f} मिमी ({w['rain_prob']:.0f}%)") for w in wx[:4])
        return L("Forecast for your farm:\n", "तुमच्या शेतासाठी अंदाज:\n") + s
    if _has(m, ["साठा", "शिल्लक", "टाकी", "tank", "remaining", "available", "stock"]):
        p = plan(farm, wx)
        return L(f"Stored water: {farm.water_available_l:,.0f} of {farm.water_capacity_l:,.0f} litres. It lasts about {p['water_days_left']} days for {crop}.",
                 f"साठवलेले पाणी: {farm.water_capacity_l:,.0f} पैकी {farm.water_available_l:,.0f} लिटर. {crop} पिकाला ते सुमारे {p['water_days_left']} दिवस पुरेल.")
    if _has(m, ["पीक", "crop", "पेरणी", "कोणते"]):
        season, rows = recommend_crops(farm)
        names = ", ".join(r[k] for r in rows[:4])
        return L(f"Best low-water crops for your soil and the {season} season: {names}.", f"तुमची जमीन व {season} हंगामासाठी कमी पाण्याची योग्य पिके: {names}.")
    return L("I can help with: when/how much to irrigate, weather, stored water, crop choice, drip, mulching and rainwater harvesting.",
             "मी या विषयांत मदत करू शकतो: सिंचन केव्हा व किती, हवामान, पाणी साठा, पीक निवड, ठिबक, आच्छादन आणि पावसाच्या पाण्याची साठवण.")
