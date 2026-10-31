import os, math, hashlib
from datetime import date, datetime, timedelta
from statistics import mean
import httpx
from .agri import hargreaves
from .models import WeatherRecord

URL = os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")
KEY = os.getenv("WEATHER_API_KEY", "")
MODE = os.getenv("WEATHER_MODE", "auto")


def fetch_live(lat, lon):
    params = {"latitude": lat, "longitude": lon, "timezone": "auto", "forecast_days": 7, "hourly": "relative_humidity_2m",
              "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration"}
    if KEY: params["apikey"] = KEY
    r = httpx.get(URL, params=params, timeout=10)
    r.raise_for_status()
    j = r.json()
    hum = {}
    for t, h in zip(j["hourly"]["time"], j["hourly"]["relative_humidity_2m"]):
        if h is not None: hum.setdefault(t[:10], []).append(h)
    d, out = j["daily"], []
    for i, ds in enumerate(d["time"]):
        day, tmax, tmin = date.fromisoformat(ds), d["temperature_2m_max"][i], d["temperature_2m_min"][i]
        et0 = d["et0_fao_evapotranspiration"][i]
        out.append(dict(day=day, tmax=tmax, tmin=tmin, humidity=round(mean(hum.get(ds, [60]))), rain=d["precipitation_sum"][i] or 0,
                        rain_prob=d["precipitation_probability_max"][i] or 0, et0=et0 if et0 is not None else hargreaves(tmax, tmin, lat, day)))
    return out


# Typical Maharashtra monthly climate (Jan..Dec) used ONLY for demo mode when no internet is available
_TMAX = [30, 32, 35, 37, 37, 32, 29, 28, 30, 32, 31, 29]
_TMIN = [14, 15, 18, 21, 23, 22, 21, 21, 20, 19, 16, 13]
_RAINY = [0.01, 0.01, 0.02, 0.05, 0.12, 0.45, 0.6, 0.55, 0.4, 0.2, 0.05, 0.01]
_HUM = [45, 40, 38, 40, 50, 75, 85, 85, 78, 62, 52, 48]


def demo(lat, today):
    out = []
    for i in range(7):
        d = today + timedelta(days=i)
        u = int(hashlib.md5(f"{d}{round(lat,1)}".encode()).hexdigest()[:6], 16) / 0xFFFFFF  # deterministic 0..1
        m = d.month - 1
        tmax, tmin = _TMAX[m] + (u - 0.5) * 4, _TMIN[m] + (u - 0.5) * 2
        rainy = u < _RAINY[m]
        rain = round((5 + 20 * (1 - u / max(_RAINY[m], 0.01))) if rainy else 0, 1)
        out.append(dict(day=d, tmax=round(tmax, 1), tmin=round(tmin, 1), humidity=_HUM[m], rain=rain,
                        rain_prob=round(min(95, _RAINY[m] * 100 + (40 if rainy else 0))), et0=round(hargreaves(tmax, tmin, lat, d), 2)))
    return out


def get_forecast(db, farm, force=False):
    rows = db.query(WeatherRecord).filter_by(farm_id=farm.id).order_by(WeatherRecord.day).all()
    if rows and not force and rows[0].day == date.today() and datetime.now() - rows[0].fetched_at < timedelta(hours=3):
        return rows
    note, source = "", "live"
    try:
        if MODE == "demo": raise RuntimeError("WEATHER_MODE=demo")
        data = fetch_live(farm.latitude, farm.longitude)
    except Exception as e:
        data, source, note = demo(farm.latitude, date.today()), "demo", str(e)[:120]
    for r in rows: db.delete(r)
    now = datetime.now()
    rows = [WeatherRecord(farm_id=farm.id, source=source, note=note, fetched_at=now, **d) for d in data]
    db.add_all(rows)
    db.commit()
    return rows
