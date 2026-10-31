import { useState } from "react";
import { Sprout, Droplets, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useLoad } from "../api";
import { useApp } from "../context";
import { Card, Load, fmt, tip } from "../components/ui";

export default function Crops() {
  const { t, farm, lang, bi } = useApp();
  const [season, setSeason] = useState("");
  const st = useLoad(farm ? `/farms/${farm.id}/crops/recommend${season ? `?season=${season}` : ""}` : null);
  const lvl = { Low: t("low"), Medium: t("medium"), High: t("high") };
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-green-800">{t("nav_crops")}</h1>
        <select className="input max-w-[200px]" value={season} onChange={(e) => setSeason(e.target.value)} aria-label={t("season")}>
          <option value="">{t("season_auto")}</option><option value="kharif">{t("kharif")}</option><option value="rabi">{t("rabi")}</option><option value="summer">{t("summer")}</option>
        </select>
      </div>
      <p className="text-sm text-slate-600">{t("crops_help")}</p>
      <Load state={st}>
        {(d) => (
          <>
            <Card title={`${t("season")}: ${t(d.season)}`} icon={Sprout}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.crops.map((c) => ({ name: c[lang], mm: c.water_mm }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" interval={0} fontSize={12} /><YAxis unit=" mm" width={60} /><Tooltip {...tip} /><Bar dataKey="mm" fill="#16a34a" name={t("season_water")} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              {d.crops.map((c, i) => (
                <Card key={c.key} title={`${i + 1}. ${c[lang]}`} right={<span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">{c.score}/100</span>}>
                  <div className="mb-2 flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1"><Droplets size={16} className="text-sky-600" />{t("water_need")}: <b>{lvl[c.water_level]}</b></span>
                    <span>{fmt(c.season_need_l)} {t("l")} / {t("season")}</span><span>{c.duration_days} {t("days")}</span>
                    {farm.crop === c.key && <span className="rounded bg-sky-100 px-2 text-sky-800">{t("current_crop")}</span>}
                  </div>
                  <ul className="space-y-1 text-sm">{c.reasons.map((r, j) => <li key={j} className="flex gap-2">{(j === 1 ? c.soil_ok : j === 2 ? c.season_ok : true) ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />}{bi(r)}</li>)}</ul>
                </Card>
              ))}
            </div>
          </>
        )}
      </Load>
    </>
  );
}
