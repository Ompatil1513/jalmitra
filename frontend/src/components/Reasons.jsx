import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useApp } from "../context";

// Explanation list ({en, mr} items) – shows WHY the system recommends something
export default function Reasons({ items = [], warnings = [] }) {
  const { bi } = useApp();
  return (
    <div className="space-y-2">
      {items.map((r, i) => <div key={i} className="flex gap-2 text-sm"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" /><span>{bi(r)}</span></div>)}
      {warnings.map((r, i) => <div key={"w" + i} className="flex gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><span>{bi(r)}</span></div>)}
    </div>
  );
}
