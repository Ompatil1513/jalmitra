import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "./api";
import { D } from "./i18n";

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem("lang") || "mr");
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [farms, setFarms] = useState([]);
  const [farmId, setFarmIdState] = useState(Number(localStorage.getItem("farmId")) || null);
  const [meta, setMeta] = useState(null);

  const t = (k) => (D[k] ? D[k][lang === "mr" ? 1 : 0] : k);
  const bi = (o) => (o ? o[lang] || o.en : ""); // pick text from {en, mr}
  const setLang = (l) => { localStorage.setItem("lang", l); setLangState(l); };
  const setFarmId = (id) => { localStorage.setItem("farmId", id); setFarmIdState(id); };

  const loadFarms = useCallback(async () => {
    const f = await api("/farms");
    setFarms(f);
    setFarmIdState((id) => (f.find((x) => x.id === id) ? id : f[0]?.id || null));
    return f;
  }, []);

  const start = async (token, u) => { setToken(token); setUser(u); await loadFarms(); };
  const logout = () => { setToken(null); setUser(null); setFarms([]); };

  useEffect(() => {
    api("/meta").then(setMeta).catch(() => {});
    window.addEventListener("logout", logout);
    if (getToken()) api("/auth/me").then((u) => { setUser(u); return loadFarms(); }).catch(() => setToken(null)).finally(() => setBooting(false));
    return () => window.removeEventListener("logout", logout);
  }, []);

  const farm = farms.find((f) => f.id === farmId) || null;
  const name = (list, key) => { const x = list?.find((i) => i.key === key); return x ? x[lang] : key; };
  return (
    <Ctx.Provider value={{ lang, setLang, t, bi, user, booting, start, logout, farms, farm, farmId, setFarmId, loadFarms, meta, name }}>
      {children}
    </Ctx.Provider>
  );
}
