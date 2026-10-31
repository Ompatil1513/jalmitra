"""Agronomy logic (FAO-56 style). Everything here is rule-based and explainable."""
import math
from datetime import date
import pandas as pd

ACRE_M2 = 4046.86
R = lambda en, mr: {"en": en, "mr": mr}

# key: (English, Marathi, field capacity, wilting point)  [m3/m3]
SOILS = {
    "sandy": ("Sandy", "वालुकामय", 0.15, 0.07),
    "loamy": ("Loamy", "पोयटा (दुमट)", 0.27, 0.12),
    "clay": ("Clay", "चिकणमाती", 0.36, 0.20),
    "black": ("Black (Regur)", "काळी (रेगूर)", 0.40, 0.22),
    "red": ("Red", "लाल", 0.22, 0.10),
}
# key: (efficiency, English, Marathi)
METHODS = {
    "flood": (0.60, "Flood / canal", "पाट पाणी"),
    "sprinkler": (0.75, "Sprinkler", "तुषार सिंचन"),
    "drip": (0.90, "Drip", "ठिबक सिंचन"),
}
# kc = (initial, mid, end); stages = days of (initial, development, mid, late); root = metres (start, max)
# mad = fraction of available water the crop can use before stress; mm = approx. seasonal water need
CROPS = {
    "wheat": dict(en="Wheat", mr="गहू", kc=(0.4, 1.15, 0.4), stages=(20, 30, 40, 30), root=(0.3, 1.0), mad=0.55, seasons=["rabi"], mm=450, soils=["loamy", "black", "clay"]),
    "jowar": dict(en="Jowar (Sorghum)", mr="ज्वारी", kc=(0.35, 1.0, 0.55), stages=(20, 35, 40, 30), root=(0.3, 1.2), mad=0.55, seasons=["kharif", "rabi"], mm=350, soils=["black", "loamy", "red", "clay"]),
    "gram": dict(en="Gram (Chickpea)", mr="हरभरा", kc=(0.4, 1.0, 0.35), stages=(15, 25, 35, 20), root=(0.3, 0.8), mad=0.5, seasons=["rabi"], mm=300, soils=["black", "loamy", "clay"]),
    "soybean": dict(en="Soybean", mr="सोयाबीन", kc=(0.4, 1.15, 0.5), stages=(15, 25, 40, 20), root=(0.3, 0.8), mad=0.5, seasons=["kharif"], mm=450, soils=["black", "loamy", "clay"]),
    "cotton": dict(en="Cotton", mr="कापूस", kc=(0.35, 1.15, 0.7), stages=(30, 50, 55, 45), root=(0.3, 1.2), mad=0.65, seasons=["kharif"], mm=700, soils=["black", "clay", "loamy"]),
    "sugarcane": dict(en="Sugarcane", mr="ऊस", kc=(0.4, 1.25, 0.75), stages=(35, 60, 190, 120), root=(0.4, 1.2), mad=0.65, seasons=["kharif", "rabi", "summer"], mm=1800, soils=["black", "loamy", "clay"]),
    "tomato": dict(en="Tomato", mr="टोमॅटो", kc=(0.6, 1.15, 0.8), stages=(30, 40, 40, 25), root=(0.25, 0.7), mad=0.4, seasons=["kharif", "rabi", "summer"], mm=600, soils=["loamy", "red", "black"]),
    "onion": dict(en="Onion", mr="कांदा", kc=(0.7, 1.05, 0.75), stages=(20, 30, 40, 30), root=(0.2, 0.5), mad=0.35, seasons=["rabi"], mm=450, soils=["loamy", "black", "red"]),
    "groundnut": dict(en="Groundnut", mr="भुईमूग", kc=(0.4, 1.15, 0.6), stages=(25, 35, 45, 25), root=(0.3, 0.8), mad=0.5, seasons=["kharif", "summer"], mm=500, soils=["sandy", "loamy", "red"]),
    "maize": dict(en="Maize", mr="मका", kc=(0.3, 1.2, 0.6), stages=(20, 35, 40, 30), root=(0.3, 1.0), mad=0.55, seasons=["kharif", "rabi"], mm=500, soils=["loamy", "black", "red"]),
    "bajra": dict(en="Bajra (Pearl millet)", mr="बाजरी", kc=(0.3, 1.0, 0.3), stages=(15, 25, 30, 20), root=(0.3, 1.0), mad=0.6, seasons=["kharif", "summer"], mm=300, soils=["sandy", "red", "loamy"]),
    "tur": dict(en="Tur (Pigeon pea)", mr="तूर", kc=(0.4, 1.1, 0.5), stages=(25, 45, 60, 50), root=(0.3, 1.2), mad=0.6, seasons=["kharif"], mm=450, soils=["black", "red", "loamy"]),
}
STAGES = {"not_sown": ("Not sown yet", "पेरणी बाकी"), "initial": ("Initial", "सुरुवातीची"), "development": ("Development", "वाढीची"),
          "mid": ("Mid-season (peak water use)", "मध्य (जास्त पाणी लागते)"), "late": ("Late season", "शेवटची"), "harvest": ("Harvest / cycle complete", "काढणी / हंगाम पूर्ण")}
ACTIONS = {"irrigate_now": ("Irrigate today", "आजच सिंचन करा"), "irrigate_later": ("Irrigate soon", "लवकरच सिंचन करा"),
           "wait": ("No irrigation needed now", "सध्या सिंचनाची गरज नाही"), "no_water": ("Irrigation needed – but no water stored", "सिंचन हवे – पण पाणी साठा नाही"),
           "none": ("No active crop cycle", "पीक हंगाम सुरू नाही")}


def season_now(d=None):
    m = (d or date.today()).month
    return "rabi" if (m >= 10 or m <= 2) else ("summer" if m <= 5 else "kharif")


def hargreaves(tmax, tmin, lat, d):
    """Reference evapotranspiration (mm/day) from temperature only (used when API gives no ET0)."""
    phi, J = math.radians(lat), d.timetuple().tm_yday
    dr = 1 + 0.033 * math.cos(2 * math.pi * J / 365)
    dec = 0.409 * math.sin(2 * math.pi * J / 365 - 1.39)
    ws = math.acos(max(-1, min(1, -math.tan(phi) * math.tan(dec))))
    ra = 37.6 * dr * (ws * math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.sin(ws)) * 0.408
    return max(0.0, 0.0023 * ((tmax + tmin) / 2 + 17.8) * math.sqrt(max(tmax - tmin, 0)) * ra)


def crop_state(crop, days):
    c = CROPS[crop]
    ini, dev, mid, late = c["stages"]
    k0, k1, k2 = c["kc"]
    r0, r1 = c["root"]
    root = r0 + (r1 - r0) * min(1, max(days, 0) / (ini + dev))
    if days < 0: return dict(stage="not_sown", kc=k0, root=r0)
    if days >= sum(c["stages"]): return dict(stage="harvest", kc=k2, root=r1)
    if days < ini: return dict(stage="initial", kc=k0, root=root)
    if days < ini + dev: return dict(stage="development", kc=k0 + (k1 - k0) * (days - ini) / dev, root=root)
    if days < ini + dev + mid: return dict(stage="mid", kc=k1, root=root)
    return dict(stage="late", kc=k1 + (k2 - k1) * (days - ini - dev - mid) / late, root=root)


def eff_rain(mm):
    """Only part of rainfall reaches the root zone; tiny showers are lost."""
    return mm * 0.75 if mm >= 3 else 0.0


def soil_numbers(farm, today=None):
    st = crop_state(farm.crop, ((today or date.today()) - farm.sowing_date).days)
    _, _, fc, wp = SOILS[farm.soil]
    taw = (fc - wp) * 1000 * st["root"]  # mm of plant-available water in the root zone
    return st, taw


def plan(farm, wx, today=None):
    """Return an explained irrigation recommendation. wx = list of daily weather dicts (today first)."""
    today = today or date.today()
    c = CROPS[farm.crop]
    days = (today - farm.sowing_date).days
    st, taw = soil_numbers(farm, today)
    raw = c["mad"] * taw
    dep = (1 - farm.soil_moisture / 100) * taw
    eff = METHODS[farm.irrigation_method][0]
    area = farm.area_acres * ACRE_M2
    avail = farm.water_available_l or 0
    out = dict(stage=st["stage"], kc=round(st["kc"], 2), days_after_sowing=days, taw_mm=round(taw, 1), raw_mm=round(raw, 1),
               depletion_mm=round(dep, 1), efficiency=eff, moisture_source=farm.moisture_source, forecast=[], reasons=[], warnings=[],
               action="wait", date=None, net_mm=0, gross_mm=0, liters=0, water_days_left=None, et0_today=None, etc_today=None)
    why, warn = out["reasons"], out["warnings"]
    if st["stage"] in ("harvest", "not_sown"):
        out["action"] = "none"
        why.append(R("The crop is not in an active growing period (sowing date is in the future or the crop cycle is complete). Update the sowing date or crop on the Farms page.",
                     "पीक सध्या वाढीच्या कालावधीत नाही (पेरणीची तारीख पुढील आहे किंवा हंगाम पूर्ण झाला). 'शेत' पानावर पेरणी तारीख किंवा पीक बदला."))
        return out
    et0, etc0 = wx[0]["et0"], wx[0]["et0"] * st["kc"]
    out.update(et0_today=round(et0, 1), etc_today=round(etc0, 1))
    why.append(R(f"Crop is in the {STAGES[st['stage']][0]} stage (day {days}) with crop coefficient Kc = {st['kc']:.2f}. Today's crop water use = ET0 {et0:.1f} mm × Kc = {etc0:.1f} mm.",
                 f"पीक {STAGES[st['stage']][1]} अवस्थेत आहे (दिवस {days}), पीक गुणांक Kc = {st['kc']:.2f}. आजचा पिकाचा पाणी वापर = ET0 {et0:.1f} मिमी × Kc = {etc0:.1f} मिमी."))
    why.append(R(f"Roots ({st['root']:.2f} m) in {SOILS[farm.soil][0]} soil hold {taw:.0f} mm of usable water. Stress starts after {c['mad']*100:.0f}% is used ({raw:.0f} mm).",
                 f"{SOILS[farm.soil][1]} जमिनीत मुळांच्या ({st['root']:.2f} मी) भागात {taw:.0f} मिमी उपयुक्त पाणी राहते. {c['mad']*100:.0f}% ({raw:.0f} मिमी) वापरल्यावर पिकावर ताण येतो."))
    why.append(R(f"Soil moisture is {farm.soil_moisture:.0f}% ({farm.moisture_source}), so {dep:.0f} mm has already been used.",
                 f"जमिनीतील ओलावा {farm.soil_moisture:.0f}% ({farm.moisture_source}) आहे, म्हणजे {dep:.0f} मिमी पाणी आधीच वापरले गेले आहे."))
    if farm.moisture_source in ("assumed", "sample", "simulated"):
        warn.append(R("Soil moisture is not a real measurement. Enter a manual reading for an accurate result.", "जमिनीतील ओलावा प्रत्यक्ष मोजलेला नाही. अचूक निकालासाठी स्वतः नोंद करा."))
    if farm.moisture_updated and (today - farm.moisture_updated.date()).days >= 3:
        warn.append(R("Soil moisture reading is more than 3 days old.", "जमिनीतील ओलाव्याची नोंद ३ दिवसांपेक्षा जुनी आहे."))

    run, idx = dep, None
    for i, w in enumerate(wx[:5]):
        etc, er = w["et0"] * st["kc"], eff_rain(w["rain"])
        out["forecast"].append(dict(day=w["day"].isoformat(), start_depletion=round(run, 1), etc=round(etc, 1), rain=round(w["rain"], 1), eff_rain=round(er, 1)))
        if run >= raw:
            if er >= max(4, 0.4 * raw):
                why.append(R(f"Irrigation was due on {w['day']}, but {w['rain']:.0f} mm rain is forecast – wait for the rain.",
                             f"{w['day']} रोजी सिंचन आवश्यक होते, पण {w['rain']:.0f} मिमी पावसाचा अंदाज आहे – पावसाची वाट पहा."))
            else:
                idx = i
                break
        run = max(0, run + etc - er)

    if idx is None:
        extra, last = 0, wx[min(4, len(wx) - 1)]["et0"] * st["kc"]
        while run < raw and extra < 20 and last > 0:
            run += last; extra += 1
        out["next_irrigation_in_days"] = min(5 + extra, 25)
        why.append(R(f"Moisture will stay above the stress limit for the next 5 days (rain counted). Without rain, the next irrigation will be needed in about {out['next_irrigation_in_days']} days.",
                     f"पुढील ५ दिवस ओलावा ताण मर्यादेच्या वर राहील (पाऊस धरून). पाऊस न पडल्यास सुमारे {out['next_irrigation_in_days']} दिवसांत पुढील सिंचन लागेल."))
    else:
        later = sum(eff_rain(w["rain"]) for w in wx[idx + 1: idx + 3])
        net = max(0.0, min(run, taw) - later)
        gross = net / eff
        liters = gross * area
        out.update(date=(today.replace() if idx == 0 else wx[idx]["day"]).isoformat(), action="irrigate_now" if idx == 0 else "irrigate_later",
                   net_mm=round(net, 1), gross_mm=round(gross, 1), liters=round(liters))
        why.append(R(f"Water used reaches the stress limit ({raw:.0f} mm) on {out['date']}. Refilling the root zone needs {net:.0f} mm; with {METHODS[farm.irrigation_method][1]} ({eff*100:.0f}% efficient) you must apply {gross:.0f} mm = {liters:,.0f} litres for {farm.area_acres} acre.",
                     f"{out['date']} रोजी वापरलेले पाणी ताण मर्यादेपर्यंत ({raw:.0f} मिमी) पोहोचते. मुळांचा भाग भरण्यास {net:.0f} मिमी लागते; {METHODS[farm.irrigation_method][2]} ({eff*100:.0f}% कार्यक्षम) असल्याने {gross:.0f} मिमी = {liters:,.0f} लिटर पाणी {farm.area_acres} एकरसाठी द्यावे."))
        if later > 0:
            why.append(R(f"{later:.0f} mm of rain expected in the next 2 days was already subtracted.", f"पुढील २ दिवसांत अपेक्षित {later:.0f} मिमी पाऊस आधीच वजा केला आहे."))
        tmax = wx[idx]["tmax"]
        why.append(R("Best time: early morning or evening to reduce evaporation." + (" It will be very hot, so avoid midday." if tmax >= 36 else ""),
                     "सर्वोत्तम वेळ: बाष्पीभवन कमी करण्यासाठी पहाटे किंवा संध्याकाळी." + (" खूप उष्णता असेल, दुपारी टाळा." if tmax >= 36 else "")))
        if avail <= 0:
            out["action"] = "no_water"; out["liters"] = 0
            warn.append(R("No water is stored in the tank/well. Update the water level on the Water page.", "साठ्यात पाणी नाही. 'पाणी' पानावर पाणी पातळी अद्ययावत करा."))
        elif liters > avail:
            frac = avail / liters
            out.update(liters=round(avail), net_mm=round(net * frac, 1), gross_mm=round(gross * frac, 1))
            warn.append(R(f"Only {avail:,.0f} L is available ({frac*100:.0f}% of the need). Apply it as deficit irrigation – prefer the root zone with drip or small basins, and refill the tank.",
                          f"फक्त {avail:,.0f} लि. पाणी उपलब्ध आहे (गरजेच्या {frac*100:.0f}%). हे कमी पाणी (डेफिसिट सिंचन) मुळांजवळ द्या व साठा भरून घ्या."))
    daily_l = etc0 / eff * area
    if daily_l > 0:
        out["water_days_left"] = round(avail / daily_l, 1)
        if out["water_days_left"] < 7:
            warn.append(R(f"Stored water covers only about {out['water_days_left']} days of this crop's need.", f"साठवलेले पाणी या पिकाला फक्त सुमारे {out['water_days_left']} दिवस पुरेल."))
    return out


def moisture_step(farm, w):
    """One-day water balance used by the 'simulated sensor' button."""
    st, taw = soil_numbers(farm)
    if taw <= 0: return farm.soil_moisture
    change = (eff_rain(w["rain"]) - w["et0"] * st["kc"]) / taw * 100
    return round(min(100, max(0, farm.soil_moisture + change)), 1)


def recommend_crops(farm, season=None):
    season = season or season_now()
    eff, area, avail = METHODS[farm.irrigation_method][0], farm.area_acres * ACRE_M2, farm.water_available_l or 0
    rows = []
    for k, c in CROPS.items():
        days = sum(c["stages"])
        need = c["mm"] * area / eff
        rows.append(dict(key=k, en=c["en"], mr=c["mr"], soil_ok=farm.soil in c["soils"], season_ok=season in c["seasons"], water_mm=c["mm"],
                         season_need_l=round(need), duration_days=days, cover_days=round(avail / (need / days), 1)))
    df = pd.DataFrame(rows)
    low = 1 - (df.water_mm - df.water_mm.min()) / (df.water_mm.max() - df.water_mm.min())
    df["score"] = (df.soil_ok * 30 + df.season_ok * 30 + low * 30 + (df.cover_days / 30).clip(upper=1) * 10).round(0)
    out = []
    for r in df.sort_values("score", ascending=False).head(8).itertuples():
        lvl = "Low" if r.water_mm <= 400 else ("Medium" if r.water_mm <= 700 else "High")
        lvl_mr = {"Low": "कमी", "Medium": "मध्यम", "High": "जास्त"}[lvl]
        why = [R(f"Water need: {lvl} (~{r.water_mm} mm per season).", f"पाण्याची गरज: {lvl_mr} (हंगामात सुमारे {r.water_mm} मिमी).")]
        why.append(R("Suits your soil." if r.soil_ok else "Not ideal for your soil type.", "तुमच्या जमिनीला योग्य." if r.soil_ok else "तुमच्या जमिनीसाठी आदर्श नाही."))
        why.append(R(f"Good for the {season} season." if r.season_ok else f"Not a usual {season}-season crop.", f"{season} हंगामासाठी योग्य." if r.season_ok else f"{season} हंगामातील नेहमीचे पीक नाही."))
        why.append(R(f"Your stored water covers about {r.cover_days:.0f} days of its average need.", f"तुमचा साठा त्याच्या सरासरी गरजेचे सुमारे {r.cover_days:.0f} दिवस पुरेल."))
        out.append(dict(key=r.key, en=r.en, mr=r.mr, score=float(r.score), water_mm=int(r.water_mm), water_level=lvl, season_need_l=int(r.season_need_l),
                        duration_days=int(r.duration_days), cover_days=float(r.cover_days), soil_ok=bool(r.soil_ok), season_ok=bool(r.season_ok), reasons=why))
    return season, out
