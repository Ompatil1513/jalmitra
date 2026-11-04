import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useApp } from "../context";

// Explanation list ({en, mr} items) – shows WHY the system recommends something
export default function Reasons({ items = [], warnings = [] }) {
  const { bi } = useApp();
  return (
    <div className="space-y-2.5">
      {items.map((r, i) => <div key={i} className="neu-in flex gap-2.5 p-3 text-[15px]"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" /><span>{bi(r)}</span></div>)}
      {warnings.map((r, i) => <div key={"w" + i} className="flex gap-2.5 rounded-2xl border border-wheat-400/60 bg-wheat-100 p-3 text-[15px] text-soil-800"><AlertTriangle size={20} className="mt-0.5 shrink-0 text-wheat-600" /><span>{bi(r)}</span></div>)}
    </div>
  );
}
