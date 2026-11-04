import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useApp } from "../context";

export const Card = ({ title, icon: Icon, right, children, className = "" }) => (
  <section className={`neu p-5 ${className}`}>
    {(title || right) && (
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-xl font-bold text-green-800">
          {Icon && <span className="neu-in grid h-9 w-9 place-items-center text-green-700"><Icon size={19} /></span>}
          {title}
        </h2>
        {right}
      </div>
    )}
    {children}
  </section>
);

const TONES = {
  green: "text-green-700", blue: "text-sky-600", amber: "text-wheat-600", red: "text-red-600",
};
export const Stat = ({ label, value, sub, icon: Icon, tone = "green" }) => (
  <div className="neu-sm flex items-center gap-3 p-4">
    {Icon && <div className={`neu-in grid h-14 w-14 shrink-0 place-items-center ${TONES[tone]}`}><Icon size={26} /></div>}
    <div className="min-w-0">
      <div className="text-sm font-medium text-soil-600">{label}</div>
      <div className="font-display text-2xl font-bold leading-tight text-soil-800">{value}</div>
      {sub && <div className="text-sm text-soil-600">{sub}</div>}
    </div>
  </div>
);

// Circular gauge, e.g. soil moisture. value 0-100.
export const Ring = ({ value = 0, label, sub, color = "#3F7A2C", size = 150 }) => {
  const r = 52, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center text-center">
      <div className="neu-in grid place-items-center rounded-full p-2.5" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`${label}: ${v}%`}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="#d3ddc3" strokeWidth="11" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: "stroke-dashoffset .8s ease" }} />
          <text x="60" y="60" transform="rotate(90 60 60)" textAnchor="middle" dominantBaseline="central"
            className="fill-soil-800 font-display" style={{ fontSize: 26, fontWeight: 700 }}>{Math.round(v)}%</text>
        </svg>
      </div>
      <div className="mt-2 font-semibold text-soil-800">{label}</div>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  );
};

// Horizontal tank for stored water. percent 0-100.
export const Tank = ({ percent = 0, label, value, sub }) => {
  const p = Math.max(0, Math.min(100, percent));
  const color = p < 20 ? "from-red-400 to-red-600" : p < 45 ? "from-wheat-400 to-wheat-600" : "from-sky-300 to-sky-600";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-semibold text-soil-800">{label}</span>
        <span className="font-display text-xl font-bold text-sky-700">{value}</span>
      </div>
      <div className="neu-in h-8 overflow-hidden p-1.5">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.max(p, 4)}%`, transition: "width .8s ease" }} />
      </div>
      {sub && <div className="mt-1.5 text-sm text-soil-600">{sub}</div>}
    </div>
  );
};

export const Spinner = () => { const { t } = useApp(); return <div className="flex items-center gap-2 p-6 font-medium text-green-700"><Loader2 className="animate-spin" /> {t("loading")}</div>; };

export const ErrorBox = ({ msg, onRetry }) => {
  const { t } = useApp();
  return (
    <div role="alert" className="neu-in flex items-start gap-2 !rounded-2xl border border-red-300/60 p-4 text-red-800">
      <AlertTriangle size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1">{msg}</div>
      {onRetry && <button onClick={onRetry} className="flex items-center gap-1 font-semibold underline"><RefreshCw size={14} />{t("retry")}</button>}
    </div>
  );
};

// Shows spinner / error, otherwise the children
export const Load = ({ state, children }) =>
  state.loading && !state.data ? <Spinner /> : state.error ? <ErrorBox msg={state.error} onRetry={state.reload} /> : state.data ? children(state.data) : null;

const SRC = { live: "bg-green-100 text-green-800", manual: "bg-green-100 text-green-800", estimated: "bg-sky-100 text-sky-800", demo: "bg-wheat-100 text-wheat-600", simulated: "bg-wheat-100 text-wheat-600", sample: "bg-wheat-100 text-wheat-600", assumed: "bg-wheat-100 text-wheat-600" };
export const SourceTag = ({ source }) => {
  const { t } = useApp();
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SRC[source] || "bg-slate-100"}`}>{t("src_" + source)}</span>;
};

export const Field = ({ label, children }) => (
  <label className="block text-sm font-semibold text-soil-700">
    <span className="mb-1.5 block">{label}</span>
    {children}
  </label>
);

export const Msg = ({ ok, children }) => children ? <div role="status" className={`rounded-2xl p-3 text-sm font-medium ${ok ? "bg-green-100 text-green-800" : "bg-red-50 text-red-800"}`}>{children}</div> : null;

export const fmt = (n) => Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
export const tip = { contentStyle: { borderRadius: 14, border: "none", background: "#F1F6E9", boxShadow: "4px 4px 10px rgba(86,108,62,.25)", fontFamily: "Mukta" } };
export const axis = { tick: { fill: "#6B4A2F", fontSize: 12 }, axisLine: false, tickLine: false };
