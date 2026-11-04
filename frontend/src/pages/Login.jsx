import { useState } from "react";
import { Droplets, Sprout } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context";
import { Field, Msg } from "../components/ui";

export default function Login() {
  const { t, lang, setLang, start } = useApp();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const body = mode === "login" ? { phone: f.phone, password: f.password } : { ...f, language: lang };
      const r = await api(`/auth/${mode}`, { method: "POST", body });
      await start(r.token, r.farmer);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Field panel */}
      <div className="field-rows relative hidden flex-col justify-end overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-900 p-12 text-white lg:flex">
        <div className="absolute right-16 top-16 h-40 w-40 rounded-full bg-wheat-200/50 blur-2xl" aria-hidden />
        <Sprout size={56} className="mb-4 text-green-200" />
        <h2 className="font-display text-5xl font-bold leading-tight">{t("app_name")}</h2>
        <p className="mt-2 max-w-sm text-xl text-green-100">{t("tagline")}</p>
      </div>

      <div className="grid place-items-center p-5">
        <div className="neu w-full max-w-md p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-green-800 text-white shadow-raised-sm"><Droplets size={30} /></div>
            <div><h1 className="font-display text-3xl font-bold leading-none text-green-800">{t("app_name")}</h1><p className="mt-1 text-sm text-soil-600 lg:hidden">{t("tagline")}</p></div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && <Field label={t("name")}><input className="input" value={f.name} onChange={set("name")} required minLength={2} /></Field>}
            <Field label={t("phone")}><input className="input" inputMode="numeric" pattern="\d{10}" title="10 digits" value={f.phone} onChange={set("phone")} required /></Field>
            <Field label={t("password")}><input className="input" type="password" minLength={6} value={f.password} onChange={set("password")} required /></Field>
            <Msg>{err}</Msg>
            <button className="btn w-full" disabled={busy}>{busy ? t("loading") : mode === "login" ? t("login") : t("register")}</button>
          </form>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm font-semibold">
            <button className="text-green-800 underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>{mode === "login" ? t("create_account") : t("have_account")}</button>
            <button className="text-green-800 underline" onClick={() => setLang(lang === "mr" ? "en" : "mr")}>{lang === "mr" ? "English" : "मराठी"}</button>
          </div>
          {mode === "login" && (
            <button className="btn-light mt-5 w-full" onClick={() => setF({ ...f, phone: "9999999999", password: "demo123" })}>{t("use_demo")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
