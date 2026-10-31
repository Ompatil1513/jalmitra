import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useApp } from "../context";

export const Card = ({ title, icon: Icon, right, children, className = "" }) => (
  <section className={`rounded-xl border border-sky-100 bg-white p-4 shadow-sm ${className}`}>
    {(title || right) && (
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-green-800">{Icon && <Icon size={20} />}{title}</h2>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const Stat = ({ label, value, sub, icon: Icon, tone = "green" }) => {
  const tones = { green: "bg-green-100 text-green-700", blue: "bg-sky-100 text-sky-700", amber: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700" };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
      {Icon && <div className={`rounded-full p-3 ${tones[tone]}`}><Icon size={26} /></div>}
      <div className="min-w-0">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="text-sm text-slate-500">{sub}</div>}
      </div>
    </div>
  );
};

export const Spinner = () => { const { t } = useApp(); return <div className="flex items-center gap-2 p-6 text-green-700"><Loader2 className="animate-spin" /> {t("loading")}</div>; };

export const ErrorBox = ({ msg, onRetry }) => {
  const { t } = useApp();
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
      <AlertTriangle size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1">{msg}</div>
      {onRetry && <button onClick={onRetry} className="flex items-center gap-1 underline"><RefreshCw size={14} />{t("retry")}</button>}
    </div>
  );
};

// Shows spinner / error, otherwise the children
export const Load = ({ state, children }) =>
  state.loading && !state.data ? <Spinner /> : state.error ? <ErrorBox msg={state.error} onRetry={state.reload} /> : state.data ? children(state.data) : null;

const SRC = { live: "bg-green-100 text-green-800", manual: "bg-green-100 text-green-800", estimated: "bg-sky-100 text-sky-800", demo: "bg-amber-100 text-amber-800", simulated: "bg-amber-100 text-amber-800", sample: "bg-amber-100 text-amber-800", assumed: "bg-amber-100 text-amber-800" };
export const SourceTag = ({ source }) => {
  const { t } = useApp();
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SRC[source] || "bg-slate-100"}`}>{t("src_" + source)}</span>;
};

export const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-slate-700">
    <span className="mb-1 block">{label}</span>
    {children}
  </label>
);

export const Msg = ({ ok, children }) => children ? <div role="status" className={`rounded-lg p-2 text-sm ${ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{children}</div> : null;

export const fmt = (n) => Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
export const tip = { contentStyle: { borderRadius: 8, border: "1px solid #bae6fd" } };
