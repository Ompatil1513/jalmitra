import { Printer, FileText } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { useLoad } from "../api";
import { useApp } from "../context";
import { Card, Stat, Load, SourceTag, fmt, tip } from "../components/ui";
import Reasons from "../components/Reasons";

export default function Reports() {
  const { t, farm, bi, meta } = useApp();
  const st = useLoad(farm ? `/farms/${farm.id}/report` : null);
  return (
    <Load state={st}>
      {(r) => {
        const pred = r.prediction;
        const data = [...r.series.map((s) => ({ day: s.day.slice(5), used: s.liters })), ...(pred ? pred.next7.map((s) => ({ day: s.day.slice(5), forecast: s.liters })) : [])];
        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-green-800">{t("nav_reports")} – {r.farm.name}</h1>
              <button className="btn no-print" onClick={() => window.print()}><Printer size={18} />{t("print")}</button>
            </div>
            <p className="text-sm text-slate-500">{t("generated")}: {r.generated_at} · {t("weather_source")}: <SourceTag source={r.weather_source} /></p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={FileText} tone="blue" label={t("total_use_30")} value={`${fmt(r.total_used_l)} ${t("l")}`} />
              <Stat icon={FileText} tone="green" label={t("irrigation_use")} value={`${fmt(r.irrigation_l)} ${t("l")}`} sub={`${r.irrigation_count} ${t("times")}`} />
              <Stat icon={FileText} tone="amber" label={t("avg")} value={`${fmt(r.avg_daily_l)} ${t("l")}/${t("day")}`} />
              <Stat icon={FileText} tone="blue" label={t("water_available")} value={`${fmt(r.farm.water_available_l)} ${t("l")}`} />
            </div>
            <Card title={t("consumption_chart")}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" interval={3} /><YAxis width={65} /><Tooltip {...tip} /><Legend />
                  <Bar dataKey="used" fill="#0ea5e9" name={t("litres")} /><Line dataKey="forecast" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={3} dot name={t("ml_forecast")} /></ComposedChart>
              </ResponsiveContainer>
              <p className="mt-2 text-sm text-slate-600">{pred ? `${t("ml_note")} R² = ${pred.r2}, ${t("trend")} ${pred.trend_l_per_day > 0 ? "+" : ""}${pred.trend_l_per_day} ${t("l")}/${t("day")}.` : t("ml_not_enough")}</p>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title={t("recommendations")}><Reasons items={r.recommendations} /></Card>
              <Card title={t("current_plan")}>
                <p className="mb-2 text-lg font-bold">{bi(meta?.actions?.[r.plan.action])} {r.plan.liters ? `– ${fmt(r.plan.liters)} ${t("l")} (${r.plan.date})` : ""}</p>
                <Reasons items={r.plan.reasons} />
              </Card>
            </div>
            <Card title={t("irrigation_history")} className="overflow-x-auto">
              <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-2">{t("date")}</th><th>{t("litres")}</th><th>{t("mm")}</th><th>{t("source")}</th></tr></thead>
                <tbody>{r.history.map((h, i) => <tr key={i} className="border-b last:border-0"><td className="py-2">{h.day}</td><td>{fmt(h.liters)}</td><td>{h.mm}</td><td><SourceTag source={h.source === "sample" ? "sample" : "manual"} /></td></tr>)}</tbody></table>
            </Card>
          </>
        );
      }}
    </Load>
  );
}
