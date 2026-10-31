import { Droplets, Leaf, CloudRain, Sunrise, Gauge, Sprout } from "lucide-react";
import { useLoad } from "../api";
import { useApp } from "../context";
import { Card, Load } from "../components/ui";

const ICONS = { droplets: Droplets, leaf: Leaf, "cloud-rain": CloudRain, sunrise: Sunrise, gauge: Gauge, sprout: Sprout };

export default function Tips() {
  const { t, bi } = useApp();
  const st = useLoad("/tips");
  return (
    <>
      <h1 className="text-2xl font-bold text-green-800">{t("nav_tips")}</h1>
      <Load state={st}>
        {(tips) => (
          <div className="grid gap-4 md:grid-cols-2">
            {tips.map((x) => { const I = ICONS[x.icon] || Droplets; return (
              <Card key={x.id} title={bi(x.title)} icon={I} right={<span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">{t("saves")} {x.saving}</span>}>
                <p className="leading-relaxed">{bi(x.body)}</p>
              </Card>); })}
          </div>
        )}
      </Load>
      <p className="text-xs text-slate-500">{t("tips_note")}</p>
    </>
  );
}
