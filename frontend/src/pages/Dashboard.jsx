import { Link } from "react-router-dom";
import { Thermometer, Droplets, CloudRain, CalendarClock, Sprout, MapPin, Layers, CalendarDays, Pencil } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useLoad } from "../api";
import { useApp } from "../context";
import { Card, Stat, Ring, Tank, Load, SourceTag, fmt, tip, axis } from "../components/ui";
import PlanCard from "../components/PlanCard";

export default function Dashboard() {
  const { t, farm, name, meta } = useApp();
  const st = useLoad(farm ? `/farms/${farm.id}/dashboard` : null);
  return (
    <Load state={st}>
      {(d) => {
        const w = d.weather.days[0], p = d.plan;
        const moistColor = d.farm.soil_moisture < 30 ? "#C0392B" : d.farm.soil_moisture < 50 ? "#D9B650" : "#3F7A2C";
        return (
          <>
            {/* Hero: green field with crop rows, frosted info chips */}
            <section className="field-rows relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-green-700 to-green-900 p-6 text-white shadow-raised md:p-8">
              <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-wheat-200/40 blur-2xl" aria-hidden />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{d.farm.name}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-green-100"><MapPin size={16} />{d.farm.location}</p>
                </div>
                <Link to="/farms" className="glass flex min-h-[44px] items-center gap-2 px-4 font-semibold hover:bg-white/25"><Pencil size={16} />{t("edit")}</Link>
              </div>
              <div className="relative mt-5 flex flex-wrap gap-2.5">
                <span className="glass flex items-center gap-2 px-3.5 py-2"><Sprout size={18} />{name(meta?.crops, d.farm.crop)}</span>
                <span className="glass flex items-center gap-2 px-3.5 py-2"><Layers size={18} />{name(meta?.soils, d.farm.soil)}</span>
                <span className="glass px-3.5 py-2">{d.farm.area_acres} {t("acre")}</span>
                <span className="glass flex items-center gap-2 px-3.5 py-2"><CalendarDays size={18} />{t("sowing")}: {d.farm.sowing_date} · {p.days_after_sowing} {t("days")}</span>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2"><PlanCard plan={p} /></div>
              <Card title={t("soil_moisture")} icon={Droplets} className="flex flex-col gap-6">
                <Ring value={d.farm.soil_moisture} label={t("soil_moisture")} color={moistColor} sub={<SourceTag source={d.farm.moisture_source} />} />
                <Tank percent={d.water.percent} label={t("water_available")} value={`${fmt(d.water.available_l)} ${t("l")}`}
                  sub={`${d.water.percent}% · ${t("lasts")} ${p.water_days_left ?? "–"} ${t("days")}`} />
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat icon={Thermometer} label={t("today")} value={`${w.tmax.toFixed(0)}° / ${w.tmin.toFixed(0)}°`} sub={`${t("humidity")} ${w.humidity}%`} tone="amber" />
              <Stat icon={CloudRain} label={t("rain")} value={`${w.rain.toFixed(0)} ${t("mm")}`} sub={`${w.rain_prob.toFixed(0)}% · ${t("src_" + d.weather.source)}`} tone="blue" />
              <Stat icon={CalendarClock} label={t("last_irrigation")} value={d.last_irrigation ? d.last_irrigation.day.slice(5) : "–"}
                sub={d.last_irrigation ? `${fmt(d.last_irrigation.liters)} ${t("l")}` : t("no_irrigation_yet")} tone="green" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title={t("rain_forecast")} icon={CloudRain} right={<SourceTag source={d.weather.source} />}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d.weather.days.map((x) => ({ day: x.day.slice(5), rain: x.rain }))}>
                    <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#c9d6b6" />
                    <XAxis dataKey="day" {...axis} /><YAxis unit=" mm" width={55} {...axis} /><Tooltip {...tip} cursor={{ fill: "rgba(46,134,157,.08)" }} />
                    <Bar dataKey="rain" fill="#2E869D" radius={[8, 8, 0, 0]} name={t("rain")} />
                  </BarChart>
                </ResponsiveContainer>
                {d.weather.source === "demo" && <p className="mt-2 rounded-xl bg-wheat-100 p-2.5 text-sm text-soil-800">{t("demo_weather_note")}</p>}
              </Card>
              <Card title={t("water_use_14")} icon={Droplets}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={d.water.series.map((x) => ({ day: x.day.slice(5), liters: x.liters }))}>
                    <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5B8C32" stopOpacity={0.55} /><stop offset="100%" stopColor="#5B8C32" stopOpacity={0.05} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#c9d6b6" />
                    <XAxis dataKey="day" {...axis} /><YAxis width={55} {...axis} /><Tooltip {...tip} />
                    <Area type="monotone" dataKey="liters" stroke="#2F6226" strokeWidth={3} fill="url(#gr)" name={t("litres")} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        );
      }}
    </Load>
  );
}
