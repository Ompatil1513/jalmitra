# Deploy JalMitra (Free tier)

You need **two** deployments:
1. **Backend** (FastAPI) → Render.com (free)
2. **Frontend** (React) → Vercel or Netlify (free)

Demo login after deploy: phone **9999999999**, password **demo123**

---

## Step 1 – Put code on GitHub

1. Create a new GitHub repository (public is fine for hackathon).
2. Upload the `JalMitra` folder contents (or this whole project) to that repo.

```bash
cd JalMitra-deploy
git init
git add .
git commit -m "JalMitra ready to deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jalmitra.git
git push -u origin main
```

---

## Step 2 – Deploy backend on Render

1. Go to [https://render.com](https://render.com) → Sign up with GitHub.
2. **New +** → **Web Service**.
3. Connect your `jalmitra` repo.
4. Settings:

| Field | Value |
|--------|--------|
| Name | `jalmitra-api` |
| Root Directory | `backend` |
| Runtime | **Python 3** |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance | **Free** |

5. **Environment Variables** (Add):

| Key | Value |
|-----|--------|
| `SECRET_KEY` | any long random string (e.g. `jalmitra-hackathon-secret-2024`) |
| `DATABASE_URL` | `sqlite:////tmp/jalmitra.db` |
| `WEATHER_MODE` | `auto` |
| `CORS_ORIGINS` | *(leave empty for now; update after frontend is live)* |

6. Click **Create Web Service**. Wait 2–5 minutes.
7. Copy your backend URL, e.g.  
   `https://jalmitra-api.onrender.com`

8. Test in browser:  
   `https://jalmitra-api.onrender.com/docs`  
   You should see FastAPI Swagger docs.

> **Note:** Free Render services **sleep after ~15 min** of no traffic. First request after sleep can take 30–60 seconds. Sample data is re-seeded on each cold start.

---

## Step 3 – Deploy frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) → Sign up with GitHub.
2. **Add New Project** → import the same `jalmitra` repo.
3. Settings:

| Field | Value |
|--------|--------|
| Framework | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. **Environment Variables**:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://jalmitra-api.onrender.com/api` |

   (Use **your** real Render URL + `/api`)

5. Deploy. Copy frontend URL, e.g. `https://jalmitra.vercel.app`

---

## Step 4 – Allow frontend in backend CORS

1. Back on **Render** → your web service → **Environment**.
2. Set:

| Key | Value |
|-----|--------|
| `CORS_ORIGINS` | `https://jalmitra.vercel.app` |

   (no trailing slash; add more origins comma-separated if needed)

3. **Save** → service restarts automatically.

---

## Step 5 – Open the app

Visit your Vercel URL → login with:

- Phone: `9999999999`
- Password: `demo123`

---

## Alternative: Frontend on Netlify

1. [netlify.com](https://netlify.com) → Add new site → import from Git.
2. Base directory: `frontend`
3. Build: `npm run build` · Publish: `dist`
4. Env: `VITE_API_URL` = `https://YOUR-RENDER-URL.onrender.com/api`
5. Deploy, then put the Netlify URL into Render `CORS_ORIGINS`.

---

## Alternative: Backend on Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Root: `backend`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Same env vars as Render.
5. Railway gives a public URL; use it as `VITE_API_URL` base + `/api`.

---

## Local production build test

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (another terminal)
cd frontend
echo VITE_API_URL=http://127.0.0.1:8000/api > .env.production.local
npm install
npm run build
npm run preview
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Frontend shows “Cannot reach the server” | Check `VITE_API_URL` ends with `/api` and backend is awake |
| CORS error in browser console | Set `CORS_ORIGINS` on backend to exact frontend origin (https, no trailing /) |
| 401 on every request | Clear site localStorage and login again |
| Render 502 / slow first load | Free tier cold start – wait 1 minute and refresh |
| Empty data after restart | Expected on free SQLite; seed runs again on startup |

---

## Optional: single-command Docker (VPS)

```bash
cd backend
docker build -t jalmitra-api .
docker run -p 8000:8000 -e SECRET_KEY=mysecret -e CORS_ORIGINS=https://your-frontend.com jalmitra-api
```

Frontend still needs static hosting (Vercel/Netlify/nginx) with `VITE_API_URL` pointing at the API.
