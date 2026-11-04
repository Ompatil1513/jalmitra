import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Tractor, CloudSun, Droplets, Waves, Sprout, MessageCircle, Lightbulb, FileText, Menu, X, LogOut, Languages } from "lucide-react";
import { useApp } from "../context";

const NAV = [
  ["/", "nav_dashboard", LayoutDashboard], ["/farms", "nav_farms", Tractor], ["/weather", "nav_weather", CloudSun], ["/irrigation", "nav_irrigation", Droplets],
  ["/water", "nav_water", Waves], ["/crops", "nav_crops", Sprout], ["/assistant", "nav_assistant", MessageCircle], ["/tips", "nav_tips", Lightbulb], ["/reports", "nav_reports", FileText],
];
const BOTTOM = ["/", "/irrigation", "/weather", "/water", "/assistant"];

export default function Layout({ children }) {
  const { t, lang, setLang, user, logout, farms, farm, setFarmId, farmId } = useApp();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const needsFarm = !farm && !["/farms", "/tips"].includes(pathname);

  const links = NAV.map(([to, key, Icon]) => (
    <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}
      className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-[17px] transition ${isActive ? "bg-field font-bold text-green-800 shadow-pressed" : "font-medium text-soil-700 hover:text-green-800"}`}>
      <Icon size={22} /> {t(key)}
    </NavLink>
  ));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-3 left-3 z-30 w-64 transform rounded-3xl bg-field p-3 shadow-raised transition-transform md:sticky md:top-3 md:h-[calc(100vh-1.5rem)] md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-[110%]"}`}>
        <div className="mb-4 flex items-center gap-3 px-2 py-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-green-800 text-white shadow-raised-sm"><Droplets size={26} /></div>
          <div><div className="font-display text-2xl font-bold leading-none text-green-800">{t("app_name")}</div><div className="mt-1 text-xs leading-tight text-soil-600">{t("tagline")}</div></div>
        </div>
        <nav className="space-y-1.5 overflow-y-auto">{links}</nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-soil-900/30 backdrop-blur-[2px] md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-field/85 px-3 py-3 backdrop-blur-md md:px-5">
          <button className="btn-light !min-h-[44px] !px-3 md:hidden" aria-label="menu" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          {farms.length > 0 && (
            <select aria-label={t("farm")} className="input !w-auto max-w-[210px] !py-2.5 font-semibold" value={farmId || ""} onChange={(e) => setFarmId(Number(e.target.value))}>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-soil-700 sm:inline">{user.name}</span>
            <button className="btn-light !min-h-[44px] !px-3.5" onClick={() => setLang(lang === "mr" ? "en" : "mr")}><Languages size={18} />{lang === "mr" ? "English" : "मराठी"}</button>
            <button className="btn-light !min-h-[44px] !px-3.5" onClick={logout} aria-label={t("logout")}><LogOut size={18} /><span className="hidden sm:inline">{t("logout")}</span></button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-3 pb-28 pt-2 md:px-5 md:pb-8">
          {needsFarm ? (
            <div className="neu p-10 text-center">
              <Tractor className="mx-auto mb-3 text-green-700" size={44} />
              <p className="mb-5 text-xl font-semibold">{t("add_farm_first")}</p>
              <Link to="/farms" className="btn">{t("nav_farms")}</Link>
            </div>
          ) : children}
        </main>
      </div>

      {/* Phone bottom bar */}
      <nav className="no-print fixed inset-x-3 bottom-3 z-10 flex justify-around rounded-3xl bg-field p-1.5 shadow-raised md:hidden" aria-label="main">
        {NAV.filter(([to]) => BOTTOM.includes(to)).map(([to, key, Icon]) => (
          <NavLink key={to} to={to} end={to === "/"} aria-label={t(key)}
            className={({ isActive }) => `grid h-14 w-[19%] place-items-center rounded-2xl ${isActive ? "text-green-800 shadow-pressed" : "text-soil-600"}`}>
            <Icon size={24} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
