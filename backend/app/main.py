from collections import defaultdict
from datetime import date, datetime, timedelta
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from . import agri, weather, assistant, ml, schemas, seed
from .database import Base, engine, get_db, SessionLocal
from .models import Farmer, Farm, WaterUsage, IrrigationLog
from .security import hash_pw, check_pw, make_token, current_farmer
from .tips import TIPS

Base.metadata.create_all(engine)
with SessionLocal() as _db:
    seed.seed(_db)

app = FastAPI(title="JalMitra API", version="1.0")

# CORS: allow local dev + any origins set in CORS_ORIGINS (comma-separated).
# In production set CORS_ORIGINS to your frontend URL, e.g. https://jalmitra.vercel.app
import os as _os
_cors = [o.strip() for o in _os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
_cors += ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors if _cors else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api = APIRouter(prefix="/api")


@app.exception_handler(Exception)
async def unexpected(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": f"Server error: {exc}"})


# ---------- helpers ----------
def own_farm(db, farmer, fid):
    f = db.get(Farm, fid)
    if not f or f.farmer_id != farmer.id:
        raise HTTPException(404, "Farm not found")
    return f


def farm_out(f):
    return dict(id=f.id, name=f.name, area_acres=f.area_acres, location=f.location, latitude=f.latitude, longitude=f.longitude, soil=f.soil, crop=f.crop,
                irrigation_method=f.irrigation_method, sowing_date=f.sowing_date.isoformat(), soil_moisture=f.soil_moisture, moisture_source=f.moisture_source,
                moisture_updated=f.moisture_updated.isoformat() if f.moisture_updated else None, water_capacity_l=f.water_capacity_l, water_available_l=f.water_available_l)


def weather_pack(db, f, force=False):
    rows = weather.get_forecast(db, f, force)
    days = [dict(day=r.day, tmax=r.tmax, tmin=r.tmin, humidity=r.humidity, rain=r.rain, rain_prob=r.rain_prob, et0=r.et0) for r in rows]
    return dict(source=rows[0].source, note=rows[0].note, fetched_at=rows[0].fetched_at, days=days)


def daily_usage(db, f, n):
    since = date.today() - timedelta(days=n - 1)
    per = defaultdict(float)
    for u in db.query(WaterUsage).filter(WaterUsage.farm_id == f.id, WaterUsage.day >= since):
        per[u.day] += u.liters
    return [dict(day=(since + timedelta(i)).isoformat(), liters=round(per.get(since + timedelta(i), 0))) for i in range(n)]


def water_pack(db, f):
    series = daily_usage(db, f, 14)
    last7 = [s["liters"] for s in series[-7:]]
    avg = sum(last7) / 7
    recent = db.query(WaterUsage).filter_by(farm_id=f.id).order_by(WaterUsage.day.desc(), WaterUsage.id.desc()).limit(15).all()
    cap = f.water_capacity_l or 0
    return dict(capacity_l=cap, available_l=f.water_available_l, percent=round(f.water_available_l / cap * 100) if cap else 0,
                used_today=series[-1]["liters"], used_7d=sum(last7), avg_daily_7d=round(avg),
                days_left_at_current_use=round(f.water_available_l / avg, 1) if avg else None, series=series,
                recent=[dict(id=u.id, day=u.day.isoformat(), liters=u.liters, note=u.note) for u in recent])


def spend(db, f, liters, day, note):
    if liters > f.water_available_l:
        raise HTTPException(400, f"Not enough water in storage (available {f.water_available_l:,.0f} L)")
    f.water_available_l -= liters
    db.add(WaterUsage(farm_id=f.id, day=day or date.today(), liters=liters, note=note))


# ---------- auth ----------
@api.post("/auth/register", status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(Farmer).filter_by(phone=body.phone).first():
        raise HTTPException(409, "This phone number is already registered")
    f = Farmer(name=body.name, phone=body.phone, password_hash=hash_pw(body.password), language=body.language)
    db.add(f); db.commit()
    return dict(token=make_token(f.id), farmer=dict(id=f.id, name=f.name, phone=f.phone, language=f.language))


@api.post("/auth/login")
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    f = db.query(Farmer).filter_by(phone=body.phone).first()
    if not f or not check_pw(body.password, f.password_hash):
        raise HTTPException(401, "Wrong phone number or password")
    return dict(token=make_token(f.id), farmer=dict(id=f.id, name=f.name, phone=f.phone, language=f.language))


@api.get("/auth/me")
def me(farmer: Farmer = Depends(current_farmer)):
    return dict(id=farmer.id, name=farmer.name, phone=farmer.phone, language=farmer.language)


# ---------- meta / tips ----------
@api.get("/meta")
def meta():
    return dict(crops=[dict(key=k, en=c["en"], mr=c["mr"]) for k, c in agri.CROPS.items()],
                soils=[dict(key=k, en=v[0], mr=v[1]) for k, v in agri.SOILS.items()],
                methods=[dict(key=k, en=v[1], mr=v[2], efficiency=v[0]) for k, v in agri.METHODS.items()],
                stages={k: dict(en=v[0], mr=v[1]) for k, v in agri.STAGES.items()}, actions={k: dict(en=v[0], mr=v[1]) for k, v in agri.ACTIONS.items()},
                season=agri.season_now())


@api.get("/tips")
def tips():
    return TIPS


# ---------- farms ----------
@api.get("/farms")
def list_farms(farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    return [farm_out(f) for f in db.query(Farm).filter_by(farmer_id=farmer.id).order_by(Farm.id)]


@api.post("/farms", status_code=201)
def add_farm(body: schemas.FarmIn, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = Farm(farmer_id=farmer.id, soil_moisture=70, moisture_source="assumed", moisture_updated=datetime.now(), **body.model_dump())
    db.add(f); db.commit(); db.refresh(f)
    return farm_out(f)


@api.put("/farms/{fid}")
def edit_farm(fid: int, body: schemas.FarmIn, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    for k, v in body.model_dump().items():
        setattr(f, k, v)
    for r in list(f.weather): db.delete(r)  # location may have changed -> refetch weather
    db.commit(); db.refresh(f)
    return farm_out(f)


@api.delete("/farms/{fid}", status_code=204)
def delete_farm(fid: int, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    db.delete(own_farm(db, farmer, fid)); db.commit()


@api.get("/farms/{fid}/dashboard")
def dashboard(fid: int, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    wx = weather_pack(db, f)
    last = db.query(IrrigationLog).filter_by(farm_id=f.id).order_by(IrrigationLog.day.desc(), IrrigationLog.id.desc()).first()
    return dict(farm=farm_out(f), weather=wx, plan=agri.plan(f, wx["days"]), water=water_pack(db, f), season=agri.season_now(),
                last_irrigation=dict(day=last.day.isoformat(), liters=last.liters) if last else None)


# ---------- weather / irrigation ----------
@api.get("/farms/{fid}/weather")
def get_weather(fid: int, refresh: bool = False, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    return weather_pack(db, own_farm(db, farmer, fid), refresh)


@api.get("/farms/{fid}/irrigation/plan")
def get_plan(fid: int, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    return agri.plan(f, weather_pack(db, f)["days"])


@api.get("/farms/{fid}/irrigation/history")
def history(fid: int, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    rows = db.query(IrrigationLog).filter_by(farm_id=f.id).order_by(IrrigationLog.day.desc(), IrrigationLog.id.desc()).limit(30).all()
    return [dict(id=r.id, day=r.day.isoformat(), liters=r.liters, mm=r.mm, note=r.note, source=r.source) for r in rows]


@api.post("/farms/{fid}/irrigation", status_code=201)
def log_irrigation(fid: int, body: schemas.UsageIn, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    spend(db, f, body.liters, body.day, "Irrigation")
    _, taw = agri.soil_numbers(f)
    mm = body.liters * agri.METHODS[f.irrigation_method][0] / (f.area_acres * agri.ACRE_M2)
    f.soil_moisture = round(min(100, f.soil_moisture + mm / taw * 100), 1) if taw else f.soil_moisture
    f.moisture_source, f.moisture_updated = "estimated", datetime.now()
    db.add(IrrigationLog(farm_id=f.id, day=body.day or date.today(), liters=body.liters, mm=round(mm, 1), note=body.note, source="manual"))
    db.commit()
    return dict(ok=True, soil_moisture=f.soil_moisture, water_available_l=f.water_available_l)


@api.post("/farms/{fid}/moisture")
def set_moisture(fid: int, body: schemas.MoistureIn, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    f.soil_moisture, f.moisture_source, f.moisture_updated = body.value, "manual", datetime.now()
    db.commit()
    return farm_out(f)


@api.post("/farms/{fid}/moisture/simulate")
def simulate_sensor(fid: int, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    w = weather_pack(db, f)["days"][0]
    f.soil_moisture, f.moisture_source, f.moisture_updated = agri.moisture_step(f, w), "simulated", datetime.now()
    db.commit()
    return farm_out(f)


# ---------- water ----------
@api.get("/farms/{fid}/water")
def get_water(fid: int, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    return water_pack(db, own_farm(db, farmer, fid))


@api.put("/farms/{fid}/water/level")
def set_level(fid: int, body: schemas.LevelIn, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    f.water_available_l, f.water_capacity_l = body.available_l, body.capacity_l
    db.commit()
    return water_pack(db, f)


@api.post("/farms/{fid}/water/usage", status_code=201)
def add_usage(fid: int, body: schemas.UsageIn, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    spend(db, f, body.liters, body.day, body.note or "Water use")
    db.commit()
    return water_pack(db, f)


# ---------- crops / assistant / report ----------
@api.get("/farms/{fid}/crops/recommend")
def crops(fid: int, season: str = None, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    if season and season not in ("kharif", "rabi", "summer"):
        raise HTTPException(422, "season must be kharif, rabi or summer")
    s, rows = agri.recommend_crops(own_farm(db, farmer, fid), season)
    return dict(season=s, crops=rows)


@api.post("/assistant/chat")
def chat(body: schemas.ChatIn, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, body.farm_id) if body.farm_id else None
    wx = weather_pack(db, f)["days"] if f else []
    return dict(reply=assistant.reply(f, wx, body.message, body.lang))


@api.get("/farms/{fid}/report")
def report(fid: int, farmer: Farmer = Depends(current_farmer), db: Session = Depends(get_db)):
    f = own_farm(db, farmer, fid)
    wx = weather_pack(db, f)
    p = agri.plan(f, wx["days"])
    series = daily_usage(db, f, 30)
    irr = db.query(IrrigationLog).filter(IrrigationLog.farm_id == f.id, IrrigationLog.day >= date.today() - timedelta(days=29)).all()
    irr_l, total = sum(i.liters for i in irr), sum(s["liters"] for s in series)
    recs = []
    eff = agri.METHODS[f.irrigation_method][0]
    if f.irrigation_method != "drip" and irr_l:
        recs.append(agri.R(f"Switching from {agri.METHODS[f.irrigation_method][1]} to drip could save roughly {irr_l * (1 - eff / 0.9):,.0f} litres per month at your current irrigation level.",
                           f"{agri.METHODS[f.irrigation_method][2]}ऐवजी ठिबक सिंचन वापरल्यास सध्याच्या वापरानुसार महिन्याला सुमारे {irr_l * (1 - eff / 0.9):,.0f} लिटर पाणी वाचू शकते."))
    rain3 = sum(w["rain"] for w in wx["days"][:3])
    if rain3 >= 10:
        recs.append(agri.R(f"{rain3:.0f} mm rain is expected in 3 days – avoid unnecessary irrigation.", f"३ दिवसांत {rain3:.0f} मिमी पाऊस अपेक्षित आहे – अनावश्यक सिंचन टाळा."))
    if p["water_days_left"] is not None and p["water_days_left"] < 10:
        recs.append(agri.R(f"Stored water lasts only ~{p['water_days_left']} days. Plan refilling or deficit irrigation.", f"साठवलेले पाणी फक्त सुमारे {p['water_days_left']} दिवस पुरेल. पुनर्भरण किंवा कमी पाण्याचे नियोजन करा."))
    if f.moisture_source in ("assumed", "sample", "simulated"):
        recs.append(agri.R("Enter a real soil-moisture reading to improve accuracy.", "अचूकतेसाठी जमिनीतील ओलाव्याची प्रत्यक्ष नोंद करा."))
    recs.append(agri.R("Mulch the soil to cut evaporation by up to a third.", "आच्छादन करून बाष्पीभवन एक-तृतीयांशपर्यंत कमी करा."))
    return dict(farm=farm_out(f), period_days=30, total_used_l=round(total), irrigation_l=round(irr_l), irrigation_count=len(irr),
                avg_daily_l=round(total / 30), series=series, prediction=ml.forecast_usage(series), plan=p, recommendations=recs, weather_source=wx["source"],
                history=[dict(day=i.day.isoformat(), liters=i.liters, mm=i.mm, source=i.source, note=i.note) for i in sorted(irr, key=lambda x: x.day, reverse=True)],
                generated_at=datetime.now().isoformat(timespec="seconds"))


app.include_router(api)
