import { Droplets, CalendarDays, Gauge } from "lucide-react";
import { useApp } from "../context";
import { Card, fmt } from "./ui";
import Reasons from "./Reasons";

const TONE = { irrigate_now: "bg-green-700 text-white", irrigate_later: "bg-sky-600 text-white", wait: "bg-sky-100 text-sky-900", no_water: "bg-red-600 text-white", none: "bg-slate-200" };

export default function PlanCard({ plan, showReasons = true }) {
  const { t, bi, meta } = useApp();
  return (
    <Card title={t("recommendation")} icon={Droplets}>
      <div className={`mb-3 rounded-xl p-4 ${TONE[plan.action]}`}>
        <div className="text-2xl font-bold">{bi(meta?.actions?.[plan.action])}</div>
        {plan.liters > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-lg">
            <span className="flex items-center gap-1"><Droplets size={20} />{fmt(plan.liters)} {t("litres")} ({plan.gross_mm} {t("mm")})</span>
            <span className="flex items-center gap-1"><CalendarDays size={20} />{plan.date}</span>
          </div>
        )}
        {plan.next_irrigation_in_days && <div className="mt-1 flex items-center gap-1"><CalendarDays size={18} />{t("next_in")} ~{plan.next_irrigation_in_days} {t("days")}</div>}
      </div>
      <div className="mb-3 flex flex-wrap gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1"><Gauge size={16} />{t("stage")}: <b>{bi(meta?.stages?.[plan.stage])}</b></span>
        <span>Kc: <b>{plan.kc}</b></span>
        <span>ETc {t("today")}: <b>{plan.etc_today ?? "–"} {t("mm")}</b></span>
      </div>
      {showReasons && (<><h3 className="mb-2 font-bold">{t("why")}</h3><Reasons items={plan.reasons} warnings={plan.warnings} /></>)}
    </Card>
  );
}
