import { useState } from "react";
import { Droplets } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-100 to-sky-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3 text-green-800">
          <Droplets size={40} className="text-sky-500" />
          <div><h1 className="text-2xl font-bold">{t("app_name")} – JalMitra</h1><p className="text-sm text-slate-500">{t("tagline")}</p></div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && <Field label={t("name")}><input className="input" value={f.name} onChange={set("name")} required minLength={2} /></Field>}
          <Field label={t("phone")}><input className="input" inputMode="numeric" pattern="\d{10}" title="10 digits" value={f.phone} onChange={set("phone")} required /></Field>
          <Field label={t("password")}><input className="input" type="password" minLength={6} value={f.password} onChange={set("password")} required /></Field>
          <Msg>{err}</Msg>
          <button className="btn w-full" disabled={busy}>{busy ? t("loading") : mode === "login" ? t("login") : t("register")}</button>
        </form>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
          <button className="text-green-800 underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>{mode === "login" ? t("create_account") : t("have_account")}</button>
          <button className="text-green-800 underline" onClick={() => setLang(lang === "mr" ? "en" : "mr")}>{lang === "mr" ? "English" : "मराठी"}</button>
        </div>
        {mode === "login" && (
          <button className="btn-light mt-4 w-full" onClick={() => setF({ ...f, phone: "9999999999", password: "demo123" })}>{t("use_demo")}</button>
        )}
      </div>
    </div>
  );
}
