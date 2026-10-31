import { Link } from "react-router-dom";
import { Sprout, Thermometer, Waves, Droplets, CloudRain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useLoad } from "../api";
import { useApp } from "../context";
import { Card, Stat, Load, SourceTag, fmt, tip } from "../components/ui";
import PlanCard from "../components/PlanCard";

export default function Dashboard() {
  const { t, farm, name, meta, bi } = useApp();
  const st = useLoad(farm ? `/farms/${farm.id}/dashboard` : null);
  return (
    <Load state={st}>
      {(d) => {
        const w = d.weather.days[0], p = d.plan;
        return (
          <>
            <Card className="!bg-green-700 !text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold">{d.farm.name}</h1>
                  <p className="text-green-100">{d.farm.location} · {d.farm.area_acres} {t("acre")} · {name(meta?.crops, d.farm.crop)} · {name(meta?.soils, d.farm.soil)}</p>
                  <p className="text-sm text-green-200">{t("sowing")}: {d.farm.sowing_date} ({p.days_after_sowing} {t("days")})</p>
                </div>
                <Link to="/farms" className="btn-light">{t("edit")}</Link>
              </div>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={Sprout} label={t("soil_moisture")} value={`${d.farm.soil_moisture}%`} sub={<SourceTag source={d.farm.moisture_source} />} tone="green" />
              <Stat icon={Waves} label={t("water_available")} value={`${fmt(d.water.available_l)} ${t("l")}`} sub={`${d.water.percent}% · ${p.water_days_left ?? "–"} ${t("days")}`} tone="blue" />
              <Stat icon={Thermometer} label={t("today")} value={`${w.tmax.toFixed(0)}° / ${w.tmin.toFixed(0)}°`} sub={`${t("humidity")} ${w.humidity}% `} tone="amber" />
              <Stat icon={CloudRain} label={t("rain")} value={`${w.rain.toFixed(0)} ${t("mm")}`} sub={`${w.rain_prob.toFixed(0)}% · ${t("src_" + d.weather.source)}`} tone="blue" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PlanCard plan={p} />
              <div className="space-y-4">
                <Card title={t("rain_forecast")} icon={CloudRain} right={<SourceTag source={d.weather.source} />}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={d.weather.days.map((x) => ({ day: x.day.slice(5), rain: x.rain }))}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis unit=" mm" width={55} /><Tooltip {...tip} /><Bar dataKey="rain" fill="#0ea5e9" name={t("rain")} />
                    </BarChart>
                  </ResponsiveContainer>
                  {d.weather.source === "demo" && <p className="mt-1 text-xs text-amber-700">{t("demo_weather_note")}</p>}
                </Card>
                <Card title={t("water_use_14")} icon={Droplets}>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={d.water.series.map((x) => ({ day: x.day.slice(5), liters: x.liters }))}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis width={55} /><Tooltip {...tip} /><Area dataKey="liters" stroke="#15803d" fill="#bbf7d0" name={t("litres")} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-slate-600">{d.last_irrigation ? `${t("last_irrigation")}: ${d.last_irrigation.day} (${fmt(d.last_irrigation.liters)} ${t("l")})` : t("no_irrigation_yet")}</p>
                </Card>
              </div>
            </div>
          </>
        );
      }}
    </Load>
  );
}
