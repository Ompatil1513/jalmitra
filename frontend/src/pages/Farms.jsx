import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Save } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context";
import { Card, Field, Msg } from "../components/ui";

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { name: "", area_acres: 1, location: "", latitude: 18.52, longitude: 73.85, soil: "black", crop: "onion", irrigation_method: "flood", sowing_date: today(), water_capacity_l: 100000, water_available_l: 50000 };

export default function Farms() {
  const { t, farms, loadFarms, setFarmId, meta, name, bi } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "number" ? e.target.value : e.target.value });

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg({ ok: true, text: "" });
    const body = { ...form, area_acres: +form.area_acres, latitude: +form.latitude, longitude: +form.longitude, water_capacity_l: +form.water_capacity_l, water_available_l: +form.water_available_l };
    try {
      const r = await api(editId ? `/farms/${editId}` : "/farms", { method: editId ? "PUT" : "POST", body });
      await loadFarms(); setFarmId(r.id); setForm(null); setEditId(null); setMsg({ ok: true, text: t("saved") });
    } catch (x) { setMsg({ ok: false, text: x.message }); } finally { setBusy(false); }
  };
  const remove = async (f) => {
    if (!window.confirm(t("confirm_delete"))) return;
    try { await api(`/farms/${f.id}`, { method: "DELETE" }); await loadFarms(); } catch (x) { setMsg({ ok: false, text: x.message }); }
  };
  const gps = () => navigator.geolocation?.getCurrentPosition((p) => setForm((f) => ({ ...f, latitude: +p.coords.latitude.toFixed(4), longitude: +p.coords.longitude.toFixed(4) })), () => setMsg({ ok: false, text: t("gps_failed") }));
  const sel = (k, list) => <select className="input" value={form[k]} onChange={set(k)}>{list?.map((o) => <option key={o.key} value={o.key}>{bi(o)}</option>)}</select>;

  return (
    <>
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-green-800">{t("nav_farms")}</h1>
        {!form && <button className="btn" onClick={() => { setForm(EMPTY); setEditId(null); }}><Plus size={18} />{t("add_farm")}</button>}</div>
      <Msg ok={msg.ok}>{msg.text}</Msg>
      {form && (
        <Card title={editId ? t("edit_farm") : t("add_farm")}>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("farm_name")}><input className="input" required minLength={2} value={form.name} onChange={set("name")} /></Field>
            <Field label={t("area")}><input className="input" type="number" step="0.1" min="0.1" required value={form.area_acres} onChange={set("area_acres")} /></Field>
            <Field label={t("location")}><input className="input" required value={form.location} onChange={set("location")} placeholder="Village, District" /></Field>
            <Field label={t("latitude")}><input className="input" type="number" step="0.0001" required value={form.latitude} onChange={set("latitude")} /></Field>
            <Field label={t("longitude")}><input className="input" type="number" step="0.0001" required value={form.longitude} onChange={set("longitude")} /></Field>
            <div className="flex items-end"><button type="button" className="btn-light w-full" onClick={gps}><MapPin size={18} />{t("use_gps")}</button></div>
            <Field label={t("soil")}>{sel("soil", meta?.soils)}</Field>
            <Field label={t("crop")}>{sel("crop", meta?.crops)}</Field>
            <Field label={t("method")}>{sel("irrigation_method", meta?.methods)}</Field>
            <Field label={t("sowing")}><input className="input" type="date" required value={form.sowing_date} onChange={set("sowing_date")} /></Field>
            <Field label={t("capacity")}><input className="input" type="number" min="0" required value={form.water_capacity_l} onChange={set("water_capacity_l")} /></Field>
            <Field label={t("available")}><input className="input" type="number" min="0" required value={form.water_available_l} onChange={set("water_available_l")} /></Field>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <button className="btn" disabled={busy}><Save size={18} />{busy ? t("loading") : t("save")}</button>
              <button type="button" className="btn-light" onClick={() => { setForm(null); setEditId(null); }}>{t("cancel")}</button>
            </div>
          </form>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {farms.map((f) => (
          <Card key={f.id} title={f.name} right={<div className="flex gap-2">
            <button className="btn-light !p-2" aria-label={t("edit")} onClick={() => { setForm({ ...f }); setEditId(f.id); window.scrollTo(0, 0); }}><Pencil size={16} /></button>
            <button className="btn-light !p-2 !text-red-700" aria-label={t("delete")} onClick={() => remove(f)}><Trash2 size={16} /></button></div>}>
            <p className="text-slate-600">{f.location} · {f.area_acres} {t("acre")}</p>
            <p>{name(meta?.crops, f.crop)} · {name(meta?.soils, f.soil)} · {name(meta?.methods, f.irrigation_method)}</p>
            <p className="text-sm text-slate-500">{t("sowing")}: {f.sowing_date}</p>
          </Card>
        ))}
      </div>
      {!farms.length && !form && <p className="text-center text-slate-500">{t("no_farms")}</p>}
    </>
  );
}
