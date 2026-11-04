import { Droplets, CalendarDays, Gauge } from "lucide-react";
import { useApp } from "../context";
import { Card, fmt } from "./ui";
import Reasons from "./Reasons";

const TONE = {
  irrigate_now: "from-green-600 to-green-800 text-white",
  irrigate_later: "from-sky-500 to-sky-700 text-white",
  wait: "from-sky-100 to-sky-200 text-sky-900",
  no_water: "from-red-500 to-red-700 text-white",
  none: "from-green-100 to-green-200 text-green-900",
};

export default function PlanCard({ plan, showReasons = true }) {
  const { t, bi, meta } = useApp();
  return (
    <Card title={t("recommendation")} icon={Droplets}>
      <div className={`mb-4 rounded-2xl bg-gradient-to-br p-5 shadow-raised-sm ${TONE[plan.action] || TONE.none}`}>
        <div className="font-display text-3xl font-bold leading-tight">{bi(meta?.actions?.[plan.action])}</div>
        {plan.liters > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-lg">
            <span className="glass flex items-center gap-2 px-3 py-1.5"><Droplets size={20} />{fmt(plan.liters)} {t("litres")} ({plan.gross_mm} {t("mm")})</span>
            <span className="glass flex items-center gap-2 px-3 py-1.5"><CalendarDays size={20} />{plan.date}</span>
          </div>
        )}
        {plan.next_irrigation_in_days && <div className="mt-3 flex items-center gap-2 font-medium"><CalendarDays size={18} />{t("next_in")} ~{plan.next_irrigation_in_days} {t("days")}</div>}
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-sm text-soil-700">
        <span className="neu-in flex items-center gap-1.5 px-3 py-1.5"><Gauge size={16} />{t("stage")}: <b>{bi(meta?.stages?.[plan.stage])}</b></span>
        <span className="neu-in px-3 py-1.5">Kc: <b>{plan.kc}</b></span>
        <span className="neu-in px-3 py-1.5">ETc {t("today")}: <b>{plan.etc_today ?? "–"} {t("mm")}</b></span>
      </div>
      {showReasons && (<><h3 className="mb-2 text-lg font-bold text-green-800">{t("why")}</h3><Reasons items={plan.reasons} warnings={plan.warnings} /></>)}
    </Card>
  );
}
