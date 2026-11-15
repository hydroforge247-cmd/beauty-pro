import { useState } from "react";

import { MENU } from "@/beauty-pro-data";

const FRESHA =
  "https://www.fresha.com/a/beauty-pro-vanderbijlpark-136a-rossini-boulevard-jw8fj062/booking?entryPoint=venue_see_all_services";

// Mon to Fri 08:00 to 17:00, Sat 07:00 to 15:00, closed Sunday (Fresha listing).
function slotsFor(date: string): string[] {
  if (!date) return [];
  const day = new Date(date + "T12:00:00").getDay();
  if (day === 0) return [];
  const [start, end] = day === 6 ? [7, 14] : [8, 16];
  const out: string[] = [];
  for (let h = start; h <= end; h++) out.push(`${String(h).padStart(2, "0")}:00`);
  return out;
}

export function Booking({ phone }: { phone: string }) {
  const [group, setGroup] = useState(MENU[0].id);
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");

  const items = MENU.find((g) => g.id === group)?.items ?? [];
  const slots = slotsFor(date);
  const sunday = date !== "" && slots.length === 0;

  const message = [
    "Hi Beauty Pro, I'd like to book.",
    service && `Treatment: ${service}`,
    date && `Day: ${date}`,
    time && `Time: ${time}`,
    name && `Name: ${name}`,
  ].filter(Boolean).join("\n");
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <form className="bk" onSubmit={(e) => { e.preventDefault(); window.open(wa, "_blank", "noopener"); }}>
      <fieldset className="bk-step">
        <legend>1. What are you in for?</legend>
        <div className="bk-chips" role="radiogroup" aria-label="Category">
          {MENU.map((g) => (
            <button key={g.id} type="button" role="radio" aria-checked={group === g.id}
              className="bk-chip" onClick={() => { setGroup(g.id); setService(""); }}>
              {g.title}
            </button>
          ))}
        </div>
        <label className="bk-field">
          <span>Treatment</span>
          <select value={service} onChange={(e) => setService(e.target.value)} required>
            <option value="">Choose a treatment</option>
            {items.map((i) => (
              <option key={i.name} value={i.name}>{i.name} ({i.price})</option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="bk-step">
        <legend>2. When suits you?</legend>
        <div className="bk-row">
          <label className="bk-field">
            <span>Day</span>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} required />
          </label>
          <label className="bk-field">
            <span>Time</span>
            <select value={time} onChange={(e) => setTime(e.target.value)} disabled={!slots.length} required>
              <option value="">{sunday ? "Closed on Sundays" : slots.length ? "Choose a time" : "Pick a day first"}</option>
              {slots.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label className="bk-field">
          <span>Your name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="So they know who's coming" />
        </label>
      </fieldset>

      <div className="bk-go">
        <button type="submit" className="bk-wa">Send booking on WhatsApp</button>
        <a className="bk-fresha" href={FRESHA} target="_blank" rel="noopener">
          Or book instantly on Fresha
        </a>
        <p className="bk-note">Nothing is stored on this site. Your request goes straight to the studio.</p>
      </div>
    </form>
  );
}
