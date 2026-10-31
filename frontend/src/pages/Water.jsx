import { useState } from "react";
import { Waves, PlusCircle, Settings2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { api, useLoad } from "../api";
import { useApp } from "../context";
import { Card, Stat, Field, Load, Msg, fmt, tip } from "../components/ui";

export default function Water() {
  const { t, farm, loadFarms } = useApp();
  const st = useLoad(farm ? `/farms/${farm.id}/water` : null);
  const [lvl, setLvl] = useState(null);
  const [use, setUse] = useState({ liters: "", note: "" });
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const act = async (fn) => { setMsg({ ok: true, text: "" }); try { await fn(); await loadFarms(); st.reload(); setMsg({ ok: true, text: t("saved") }); } catch (e) { setMsg({ ok: false, text: e.message }); } };

  return (
    <>
      <h1 className="text-2xl font-bold text-green-800">{t("nav_water")}</h1>
      <Msg ok={msg.ok}>{msg.text}</Msg>
      <Load state={st}>
        {(w) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={Waves} tone="blue" label={t("water_available")} value={`${fmt(w.available_l)} ${t("l")}`} sub={`${w.percent}% / ${fmt(w.capacity_l)} ${t("l")}`} />
              <Stat icon={Waves} tone="amber" label={t("used_today")} value={`${fmt(w.used_today)} ${t("l")}`} />
              <Stat icon={Waves} tone="green" label={t("used_7d")} value={`${fmt(w.used_7d)} ${t("l")}`} sub={`${t("avg")} ${fmt(w.avg_daily_7d)} ${t("l")}/${t("day")}`} />
              <Stat icon={Waves} tone={w.days_left_at_current_use < 7 ? "red" : "green"} label={t("lasts")} value={w.days_left_at_current_use ?? "–"} sub={t("days")} />
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-sky-100"><div className="h-full bg-sky-500" style={{ width: `${Math.min(100, w.percent)}%` }} /></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title={t("log_usage")} icon={PlusCircle}>
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); act(async () => { await api(`/farms/${farm.id}/water/usage`, { method: "POST", body: { liters: +use.liters, note: use.note } }); setUse({ liters: "", note: "" }); }); }}>
                  <Field label={t("litres")}><input className="input" type="number" min="1" required value={use.liters} onChange={(e) => setUse({ ...use, liters: e.target.value })} /></Field>
                  <Field label={t("note")}><input className="input" maxLength={100} value={use.note} onChange={(e) => setUse({ ...use, note: e.target.value })} /></Field>
                  <button className="btn">{t("save")}</button>
                </form>
              </Card>
              <Card title={t("set_level")} icon={Settings2}>
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); act(() => api(`/farms/${farm.id}/water/level`, { method: "PUT", body: { available_l: +(lvl?.a ?? w.available_l), capacity_l: +(lvl?.c ?? w.capacity_l) } })); }}>
                  <Field label={t("available")}><input className="input" type="number" min="0" value={lvl?.a ?? w.available_l} onChange={(e) => setLvl({ a: e.target.value, c: lvl?.c ?? w.capacity_l })} /></Field>
                  <Field label={t("capacity")}><input className="input" type="number" min="0" value={lvl?.c ?? w.capacity_l} onChange={(e) => setLvl({ a: lvl?.a ?? w.available_l, c: e.target.value })} /></Field>
                  <button className="btn">{t("save")}</button>
                </form>
              </Card>
            </div>
            <Card title={t("water_use_14")}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={w.series.map((x) => ({ day: x.day.slice(5), liters: x.liters }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis width={65} /><Tooltip {...tip} /><Bar dataKey="liters" fill="#0ea5e9" name={t("litres")} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title={t("recent_usage")} className="overflow-x-auto">
              <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-2">{t("date")}</th><th>{t("litres")}</th><th>{t("note")}</th></tr></thead>
                <tbody>{w.recent.map((r) => <tr key={r.id} className="border-b last:border-0"><td className="py-2">{r.day}</td><td>{fmt(r.liters)}</td><td>{r.note}</td></tr>)}</tbody></table>
            </Card>
          </>
        )}
      </Load>
    </>
  );
}
