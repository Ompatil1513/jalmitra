import { useState } from "react";
import { RefreshCw, Thermometer, Droplets, CloudRain, Umbrella } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { api, useLoad } from "../api";
import { useApp } from "../context";
import { Card, Stat, Load, SourceTag, Msg, tip } from "../components/ui";

export default function Weather() {
  const { t, farm } = useApp();
  const st = useLoad(farm ? `/farms/${farm.id}/weather` : null);
  const [fresh, setFresh] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const refresh = async () => { setBusy(true); setErr(""); try { setFresh(await api(`/farms/${farm.id}/weather?refresh=true`)); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

  return (
    <Load state={st}>
      {(d0) => {
        const d = fresh || d0, w = d.days[0];
        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-green-800">{t("nav_weather")} – {farm.location} <SourceTag source={d.source} /></h1>
              <button className="btn" onClick={refresh} disabled={busy}><RefreshCw size={18} className={busy ? "animate-spin" : ""} />{t("refresh")}</button>
            </div>
            <Msg>{err}</Msg>
            {d.source === "demo" && <Msg>{t("demo_weather_note")} ({d.note})</Msg>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={Thermometer} tone="amber" label={t("temperature")} value={`${w.tmax.toFixed(0)}° / ${w.tmin.toFixed(0)}°C`} />
              <Stat icon={Droplets} tone="blue" label={t("humidity")} value={`${w.humidity}%`} />
              <Stat icon={CloudRain} tone="blue" label={t("rain")} value={`${w.rain.toFixed(1)} ${t("mm")}`} />
              <Stat icon={Umbrella} tone="green" label={t("rain_prob")} value={`${w.rain_prob.toFixed(0)}%`} />
            </div>
            <Card title={t("forecast7")}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={d.days.map((x) => ({ day: x.day.slice(5), tmax: x.tmax, tmin: x.tmin, rain: x.rain }))}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis yAxisId="t" unit="°" width={45} /><YAxis yAxisId="r" orientation="right" unit=" mm" width={55} /><Tooltip {...tip} /><Legend />
                  <Bar yAxisId="r" dataKey="rain" fill="#38bdf8" name={t("rain")} />
                  <Line yAxisId="t" dataKey="tmax" stroke="#dc2626" name="Max °C" /><Line yAxisId="t" dataKey="tmin" stroke="#15803d" name="Min °C" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
            <Card className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b text-slate-500"><th className="py-2">{t("date")}</th><th>{t("temperature")}</th><th>{t("humidity")}</th><th>{t("rain")}</th><th>{t("rain_prob")}</th><th>ET0</th></tr></thead>
                <tbody>{d.days.map((x) => (
                  <tr key={x.day} className="border-b last:border-0"><td className="py-2">{x.day}</td><td>{x.tmax.toFixed(0)}° / {x.tmin.toFixed(0)}°</td><td>{x.humidity}%</td><td>{x.rain.toFixed(1)} {t("mm")}</td><td>{x.rain_prob.toFixed(0)}%</td><td>{x.et0.toFixed(1)}</td></tr>))}</tbody>
              </table>
            </Card>
          </>
        );
      }}
    </Load>
  );
}
