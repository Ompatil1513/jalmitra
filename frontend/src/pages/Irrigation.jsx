import { useState } from "react";
import { Sprout, Cpu, CheckCircle2, History } from "lucide-react";
import { ComposedChart, Bar, Line, ReferenceLine, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { api, useLoad } from "../api";
import { useApp } from "../context";
import { Card, Field, Load, Msg, SourceTag, fmt, tip } from "../components/ui";
import PlanCard from "../components/PlanCard";

export default function Irrigation() {
  const { t, farm, loadFarms } = useApp();
  const plan = useLoad(farm ? `/farms/${farm.id}/irrigation/plan` : null);
  const hist = useLoad(farm ? `/farms/${farm.id}/irrigation/history` : null);
  const [moist, setMoist] = useState(farm?.soil_moisture ?? 50);
  const [liters, setLiters] = useState("");
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const [busy, setBusy] = useState("");

  const run = async (key, fn, done) => {
    setBusy(key); setMsg({ ok: true, text: "" });
    try { await fn(); await loadFarms(); plan.reload(); hist.reload(); setMsg({ ok: true, text: done }); } catch (e) { setMsg({ ok: false, text: e.message }); } finally { setBusy(""); }
  };
  const saveMoist = () => run("m", async () => api(`/farms/${farm.id}/moisture`, { method: "POST", body: { value: +moist } }), t("saved"));
  const simulate = () => run("s", async () => { const f = await api(`/farms/${farm.id}/moisture/simulate`, { method: "POST" }); setMoist(f.soil_moisture); }, t("simulated_done"));
  const logIrr = (l) => run("i", () => api(`/farms/${farm.id}/irrigation`, { method: "POST", body: { liters: +l } }), t("irrigation_logged"));

  return (
    <>
      <h1 className="text-2xl font-bold text-green-800">{t("nav_irrigation")}</h1>
      <Msg ok={msg.ok}>{msg.text}</Msg>
      <Load state={plan}>
        {(p) => (
          <div className="grid gap-4 lg:grid-cols-2">
            <PlanCard plan={p} />
            <div className="space-y-4">
              <Card title={t("soil_moisture")} icon={Sprout} right={<SourceTag source={farm.moisture_source} />}>
                <p className="mb-2 text-sm text-slate-600">{t("moisture_help")}</p>
                <input type="range" min="0" max="100" value={moist} onChange={(e) => setMoist(e.target.value)} className="w-full accent-green-700" aria-label={t("soil_moisture")} />
                <div className="mb-3 flex items-center gap-3"><input className="input w-24" type="number" min="0" max="100" value={moist} onChange={(e) => setMoist(e.target.value)} /><span className="text-xl font-bold">%</span></div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={saveMoist} disabled={!!busy}>{busy === "m" ? t("loading") : t("save_reading")}</button>
                  <button className="btn-light" onClick={simulate} disabled={!!busy}><Cpu size={18} />{busy === "s" ? t("loading") : t("simulate_sensor")}</button>
                </div>
                <p className="mt-2 text-xs text-amber-700">{t("simulate_note")}</p>
              </Card>
              <Card title={t("mark_done")} icon={CheckCircle2}>
                <Field label={t("litres_applied")}><input className="input" type="number" min="1" value={liters} placeholder={p.liters ? String(p.liters) : ""} onChange={(e) => setLiters(e.target.value)} /></Field>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn" disabled={!!busy || !(liters || p.liters)} onClick={() => logIrr(liters || p.liters)}>{busy === "i" ? t("loading") : t("log_irrigation")}</button>
                </div>
              </Card>
            </div>
            <Card title={t("depletion_forecast")} className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={p.forecast.map((x) => ({ day: x.day.slice(5), depletion: x.start_depletion, etc: x.etc, rain: x.eff_rain }))}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis unit=" mm" width={60} /><Tooltip {...tip} /><Legend />
                  <Bar dataKey="etc" fill="#fbbf24" name={t("crop_use")} /><Bar dataKey="rain" fill="#38bdf8" name={t("eff_rain")} />
                  <Line dataKey="depletion" stroke="#15803d" strokeWidth={3} name={t("used_water")} />
                  <ReferenceLine y={p.raw_mm} stroke="#dc2626" strokeDasharray="5 5" label={{ value: t("stress_limit"), fill: "#dc2626", position: "insideTopLeft" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </Load>
      <Card title={t("irrigation_history")} icon={History} className="overflow-x-auto">
        <Load state={hist}>
          {(rows) => rows.length ? (
            <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-2">{t("date")}</th><th>{t("litres")}</th><th>{t("mm")}</th><th>{t("source")}</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r.id} className="border-b last:border-0"><td className="py-2">{r.day}</td><td>{fmt(r.liters)}</td><td>{r.mm}</td><td><SourceTag source={r.source === "sample" ? "sample" : "manual"} /></td></tr>)}</tbody></table>
          ) : <p className="text-slate-500">{t("no_irrigation_yet")}</p>}
        </Load>
      </Card>
    </>
  );
}
