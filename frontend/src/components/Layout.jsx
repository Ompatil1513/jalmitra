import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Tractor, CloudSun, Droplets, Waves, Sprout, MessageCircle, Lightbulb, FileText, Menu, X, LogOut, Languages } from "lucide-react";
import { useApp } from "../context";

const NAV = [
  ["/", "nav_dashboard", LayoutDashboard], ["/farms", "nav_farms", Tractor], ["/weather", "nav_weather", CloudSun], ["/irrigation", "nav_irrigation", Droplets],
  ["/water", "nav_water", Waves], ["/crops", "nav_crops", Sprout], ["/assistant", "nav_assistant", MessageCircle], ["/tips", "nav_tips", Lightbulb], ["/reports", "nav_reports", FileText],
];

export default function Layout({ children }) {
  const { t, lang, setLang, user, logout, farms, farm, setFarmId, farmId } = useApp();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const needsFarm = !farm && !["/farms", "/tips"].includes(pathname);

  const links = NAV.map(([to, key, Icon]) => (
    <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}
      className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-base ${isActive ? "bg-white font-bold text-green-800" : "text-green-50 hover:bg-green-700"}`}>
      <Icon size={22} /> {t(key)}
    </NavLink>
  ));

  return (
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-green-800 p-3 transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-4 flex items-center gap-2 px-2 py-3 text-white">
          <Droplets size={30} className="text-sky-300" />
          <div><div className="text-xl font-bold leading-none">{t("app_name")}</div><div className="text-xs text-green-200">{t("tagline")}</div></div>
        </div>
        <nav className="space-y-1">{links}</nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-sky-100 bg-white px-3 py-2">
          <button className="md:hidden" aria-label="menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          {farms.length > 0 && (
            <select aria-label={t("farm")} className="input max-w-[200px]" value={farmId || ""} onChange={(e) => setFarmId(Number(e.target.value))}>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
            <button className="btn-light !px-3 !py-1.5" onClick={() => setLang(lang === "mr" ? "en" : "mr")}><Languages size={18} />{lang === "mr" ? "English" : "मराठी"}</button>
            <button className="btn-light !px-3 !py-1.5" onClick={logout} aria-label={t("logout")}><LogOut size={18} /><span className="hidden sm:inline">{t("logout")}</span></button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4">
          {needsFarm ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <Tractor className="mx-auto mb-2 text-green-700" size={40} />
              <p className="mb-4 text-lg">{t("add_farm_first")}</p>
              <Link to="/farms" className="btn">{t("nav_farms")}</Link>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  );
}
