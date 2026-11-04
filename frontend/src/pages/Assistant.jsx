import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context";
import { Card, Msg } from "../components/ui";

export default function Assistant() {
  const { t, lang, farm } = useApp();
  const [msgs, setMsgs] = useState([{ role: "bot", text: t("assistant_hello") }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef();
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (m) => {
    const message = (m ?? text).trim();
    if (!message || busy) return;
    setText(""); setErr(""); setBusy(true); setMsgs((x) => [...x, { role: "me", text: message }]);
    try {
      const r = await api("/assistant/chat", { method: "POST", body: { message, farm_id: farm?.id, lang } });
      setMsgs((x) => [...x, { role: "bot", text: r.reply }]);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const chips = ["q_irrigate", "q_weather", "q_water", "q_crop", "q_drip", "q_mulch", "q_rain"];

  return (
    <>
      <h1 className="text-2xl font-bold text-green-800">{t("nav_assistant")}</h1>
      <Card>
        <div className="mb-3 h-[55vh] space-y-3 overflow-y-auto neu-in p-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "me" ? "justify-end" : ""}`}>
              {m.role === "bot" && <Bot className="mt-1 shrink-0 text-green-700" />}
              <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 ${m.role === "me" ? "bg-gradient-to-br from-green-600 to-green-800 text-white shadow-raised-sm" : "bg-field shadow-raised-sm"}`}>{m.text}</div>
              {m.role === "me" && <User className="mt-1 shrink-0 text-slate-500" />}
            </div>
          ))}
          {busy && <div className="text-sm text-slate-500">{t("loading")}</div>}
          <div ref={end} />
        </div>
        <Msg>{err}</Msg>
        <div className="mb-3 flex flex-wrap gap-2">{chips.map((c) => <button key={c} className="btn-light !min-h-[40px] !rounded-full !px-4 !py-1.5 text-sm" onClick={() => send(t(c))}>{t(c)}</button>)}</div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input className="input" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={t("ask_placeholder")} aria-label={t("ask_placeholder")} />
          <button className="btn" disabled={busy}><Send size={18} />{t("send")}</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">{t("assistant_note")}</p>
      </Card>
    </>
  );
}
