"use client";

import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/I18nProvider";
import { useRooms } from "@/lib/data";
import FloorMap from "./FloorMap";
import RoomPlan from "./RoomPlan";
import { Plus } from "../home/Rulers";

export default function Steps() {
  const m = useRooms();
  const ui = useT();
  const t = ui.steps;
  if (!m) return null;
  const { steps } = m;
  const roomName = (id: string) => fmt(ui.units.room, { id });
  // illustrate with a real free room: the first available unit, on its own level
  const room = m.allUnits.find((u) => u.status === "available") ?? m.allUnits[0];
  const level = m.floors.find((f) => f.level === room.level) ?? m.floors[0];
  const tier = m.tierById[room.tier];

  return (
    <section aria-label={t.aria} className="border-t border-line">
      <div className="grid md:grid-cols-6">
        <h2 className="t-h2 flex items-center px-[clamp(16px,2.3vw,44px)] py-[clamp(24px,2.3vw,44px)] md:col-span-4 md:border-r md:border-line">
          {fmt(t.title, { n: steps.length })}
        </h2>
        <div className="flex flex-col justify-center gap-4 px-[clamp(16px,1.9vw,36px)] py-[clamp(24px,2.3vw,44px)] md:col-span-2">
          <p className="t-body text-ink/85">{t.body}</p>
        </div>
      </div>

      {/* the plan, the room and the key, side by side */}
      <div className="relative hidden border-t border-line md:block">
        <div aria-hidden="true" className="sq-grid absolute inset-0 opacity-30" />
        <Plus className="left-3 top-3" />
        <Plus className="right-3 top-3" />
        <Plus className="bottom-3 left-3" />
        <Plus className="bottom-3 right-3" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-[1.5fr_1fr] items-center gap-6 px-10 py-[clamp(40px,4vw,80px)]">
          <div className="border border-ink/70 bg-paper p-2 shadow-[0_4px_0_var(--ink)]">
            <p className="t-mono-xs flex justify-between border-b border-line px-1 pb-2">
              {level.name} <span className="text-accent">{fmt(t.selected, { room: roomName(room.id) })}</span>
            </p>
            <FloorMap floor={level} highlight={room.tier} selected={room.id} className="w-full" />
          </div>
          <div className="relative border border-ink bg-paper shadow-[0_4px_0_var(--ink)]">
            <p className="t-mono-xs flex justify-between bg-ink px-2 py-1.5 text-paper">
              {roomName(room.id)} · {tier.name} <span>{tier.area} m²</span>
            </p>
            <RoomPlan tier={room.tier} className="h-[clamp(220px,20vw,360px)] w-full p-3" />
            <p className="t-mono-xs absolute -bottom-3 -right-3 bg-accent px-2 py-1 text-white">{t.viewing}</p>
          </div>
        </div>
      </div>

      <ol className="grid border-t border-line md:grid-cols-3">
        {steps.map(({ title: a, subtitle: b, text }, i) => (
          <li key={a} className={`flex flex-col border-b border-line md:border-b-0 ${i < steps.length - 1 ? "md:border-r" : ""}`}>
            <p className="t-mono flex justify-between border-b border-dashed border-line px-[clamp(16px,1.75vw,34px)] py-[clamp(10px,0.9vw,16px)]">
              {t.step} <span>[{String(i + 1).padStart(2, "0")}]</span>
            </p>
            <div className="flex flex-1 flex-col justify-between gap-10 px-[clamp(16px,1.75vw,34px)] py-[clamp(20px,2vw,40px)]">
              <h3 className="t-h3 text-[clamp(24px,2vw,40px)]!">
                {a}
                <br />
                {b}
              </h3>
              <p className="t-body max-w-[26em] text-[clamp(14px,1.05vw,20px)]!">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
