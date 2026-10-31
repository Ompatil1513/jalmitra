# JalMitra – जलमित्र
AI Smart Irrigation & Water Management System (React + Vite + Tailwind · FastAPI · SQLite · Pandas/scikit-learn · Recharts)

## Install and run (Windows CMD)
Needs **Python 3.10+** and **Node.js 18+** installed.

```cmd
cd JalMitra
setup.bat
```
Then open **two** CMD windows:
```cmd
:: Window 1 - backend (http://localhost:8000, API docs at /docs)
start-backend.bat

:: Window 2 - frontend (http://localhost:5173)
start-frontend.bat
```
Open http://localhost:5173 and click **"Use demo farmer login"** (phone `9999999999`, password `demo123`).

Manual commands (same thing, without the .bat files):
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
```cmd
cd frontend
npm install
npm run dev
```
To reset all data: stop the backend and delete `backend\jalmitra.db` (sample data is re-created on next start).

## How the irrigation advice is calculated (FAO-56 water balance, rule-based)
1. **ET0** (reference evapotranspiration) comes from Open-Meteo; if missing it is computed with the Hargreaves formula.
2. **ETc = ET0 x Kc**. Kc depends on the crop and its growth stage (days since sowing).
3. **Usable soil water** = (field capacity - wilting point) x root depth; root depth grows with the crop.
4. Irrigation is due when water used from the root zone reaches the crop's allowed depletion (e.g. 35% for onion).
5. The next 5 days are simulated day by day with forecast ET and **effective rain**; if useful rain is coming, irrigation is postponed.
6. Quantity = missing mm / method efficiency (flood 60%, sprinkler 75%, drip 90%) x farm area. If stored water is less than needed, the plan is cut to what is available and a warning is shown.

Every recommendation lists its reasons in Marathi and English.

**ML:** a linear-regression model (scikit-learn) trained on the farm's own daily water-use history forecasts the next 7 days (Reports page). It says so when there is not enough data.

## What is real, what is sample
| Item | Status |
|---|---|
| Weather | **Live** from Open-Meteo (free, no API key). If offline it is tagged **Demo data** (typical monthly climate). Set `WEATHER_MODE=demo` in `backend/.env` to force it. |
| Soil moisture | Entered **manually**, or "Simulate sensor" (a water-balance calculation, tagged *Simulated*). No hardware is faked. |
| Sample farmer, farm, 3 weeks of usage/irrigation | Tagged **Sample data**; edit or delete freely. |
| Marathi assistant | Rule-based; answers from your farm's real data. Not a general chatbot. |
| Crop table (Kc, stage days, root depth, season water) | Typical FAO-style values, simplified. Check with a local agriculture officer before real use. |

## Structure
```
backend/app/   main.py (API), models.py, schemas.py, agri.py (irrigation + crop logic), weather.py, ml.py, assistant.py, tips.py, seed.py, security.py
frontend/src/  pages/, components/, api.js, context.jsx, i18n.js (Marathi/English)
```
