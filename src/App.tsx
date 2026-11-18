import { useEffect, useState } from "react";
import { CinemaHero } from "./cinema";
import { Booking } from "@/components/booking";
import { SpecialsToast } from "@/components/specials-toast";
import { MENU, SPECIALS, TRAINING } from "@/beauty-pro-data";
import { film } from "./scenes";

const PHONE = "27683460928";
const PHONE_DISPLAY = "068 346 0928";
const WHATSAPP =
  `https://wa.me/${PHONE}?text=` + encodeURIComponent("Hi Beauty Pro, I'd like to book an appointment.");
const DIRECTIONS =
  "https://www.google.com/maps/search/?api=1&query=136A%20Rossini%20Boulevard%2C%20Vanderbijlpark%2C%201911";
const FACEBOOK = "https://www.facebook.com/beautyproforu/";
const SEDGEFIELD_POST =
  "https://www.facebook.com/beautyproforu/posts/1144139541454122/";

const HOURS = [
  { day: "Monday to Friday", time: "08:00 to 17:00" },
  { day: "Saturday", time: "07:00 to 15:00" },
  { day: "Sunday", time: "Closed" },
];

function ThemeSwitch() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("bp-theme", next); } catch { /* private mode: still switches for this visit */ }
    setDark(!dark);
  };
  return (
    <button type="button" className="bp-theme" onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
      )}
    </button>
  );
}

/** The phone Book button stays hidden while the film shows its own buttons. */
function useAfterFilm() {
  const [after, setAfter] = useState(false);
  useEffect(() => {
    const film = document.querySelector(".cine");
    if (!film) return;
    const io = new IntersectionObserver(([e]) => setAfter(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(film);
    return () => io.disconnect();
  }, []);
  return after;
}

export default function App() {
  const afterFilm = useAfterFilm();
  return (
    <main className="bp">
      <header className="bp-nav">
        <a className="bp-logo" href="#studio" aria-label="Beauty Pro home">
          Beauty <em>Pro</em>
        </a>
        <nav className="bp-nav-links" aria-label="Sections">
          <a href="#menu">Menu</a>
          <a href="#specials">Specials</a>
          <a href="#visit">Visit</a>
        </nav>
        <ThemeSwitch />
        <a className="bp-nav-book" href="#book">Book now</a>
      </header>

      <CinemaHero phone={film.phone} wide={film.wide} cues={film.cues} brand="Beauty Pro" id="studio" />

      <section className="bp-specials" id="specials" aria-labelledby="specials-title">
        <div className="bp-specials-pin">
          <div className="bp-wrap">
            <p className="bp-tag">15 to 30 November</p>
            <h2 id="specials-title" className="bp-h2 bp-h2--light">Black Friday specials</h2>
            <p className="bp-specials-hint">Swipe for every deal <span className="bp-swipe" aria-hidden="true" /></p>
          </div>
          <div className="bp-marquee-viewport">
            <div className="bp-marquee" role="list">
              {SPECIALS.map((s) => (
                <a key={s.name} role="listitem" className="bp-special" href="#book">
                  <span className="bp-special-price">{s.price}</span>
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="bp-specials-bar" aria-hidden="true"><span /></div>
        </div>
      </section>

      <section className="bp-menu" id="menu" aria-labelledby="menu-title">
        <div className="bp-wrap">
          <h2 id="menu-title" className="bp-h2">The full menu</h2>
          <p className="bp-lede">
            Over 140 treatments on our booking menu. Here are the favourites.
          </p>
          <div className="bp-deck">
            {MENU.map((g, i) => (
              <article key={g.id} className="bp-card" style={{ ["--i" as string]: i }}>
                <header className="bp-card-head">
                  <span className="bp-card-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="bp-h3">{g.title}</h3>
                    <p className="bp-card-blurb">{g.blurb}</p>
                  </div>
                </header>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.name} className="bp-item">
                      <span>{it.name}</span>
                      <span className="bp-price">{it.price}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bp-proof" aria-labelledby="proof-title">
        <div className="bp-wrap bp-proof-inner">
          <p className="bp-score" aria-hidden="true">4.9</p>
          <div>
            <h2 id="proof-title" className="bp-h2 bp-h2--light">Rated 4.9 from 699 reviews.</h2>
            <p className="bp-proof-copy">
              A team of seven therapists, and clients who keep coming back.
            </p>
          </div>
        </div>
      </section>

      <section className="bp-book" id="book" aria-labelledby="book-title">
        <div className="bp-wrap bp-book-grid">
          <div>
            <h2 id="book-title" className="bp-h2">Book in a minute</h2>
            <p className="bp-lede">
              Pick a treatment and a time. We'll open WhatsApp with your booking written out, ready to send.
            </p>
          </div>
          <Booking phone={PHONE} />
        </div>
      </section>

      <section className="bp-visit" id="visit" aria-labelledby="visit-title">
        <div className="bp-wrap bp-visit-grid">
          <div>
            <h2 id="visit-title" className="bp-h2">Visit the studio</h2>
            <p className="bp-lede">136A Rossini Blvd, Vanderbijlpark</p>
            <dl className="bp-hours">
              {HOURS.map((h) => (
                <div key={h.day} className="bp-hours-row">
                  <dt>{h.day}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bp-actions">
            <a className="bp-cta-whatsapp" href={WHATSAPP} target="_blank" rel="noopener">
              <span>WhatsApp the studio</span>
              <small>{PHONE_DISPLAY}</small>
            </a>
            <a className="bp-cta-call" href={`tel:+${PHONE}`}>Call {PHONE_DISPLAY}</a>
            <a className="bp-cta-map" href={DIRECTIONS} target="_blank" rel="noopener">Get directions</a>
          </div>
        </div>
      </section>

      <section className="bp-academy" aria-labelledby="academy-title">
        <div className="bp-wrap bp-academy-grid">
          <div>
            <p className="bp-tag bp-tag--rose">Beauty Pro Training Academy</p>
            <h2 id="academy-title" className="bp-h2">Learn the trade from the team.</h2>
            <p className="bp-lede">Hands-on workshops with a certificate. Ask on WhatsApp for the next dates.</p>
          </div>
          <ul className="bp-academy-list">
            {TRAINING.map((t) => (
              <li key={t.name} className="bp-item">
                <span>{t.name}</span>
                <span className="bp-price">{t.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bp-branch" aria-labelledby="branch-title">
        <div className="bp-wrap bp-branch-inner">
          <p className="bp-tag">New branch</p>
          <h2 id="branch-title" className="bp-h2 bp-h2--light">Now open in Sedgefield.</h2>
          <p className="bp-proof-copy">
            Beauty Pro has opened its doors in Sedgefield, Western Cape. Same care, new coast.
          </p>
          <a className="bp-link-light" href={SEDGEFIELD_POST} target="_blank" rel="noopener">
            See the Sedgefield opening
          </a>
        </div>
      </section>

      <footer className="bp-foot">
        <div className="bp-wrap bp-foot-inner">
          <p>Beauty Pro, 136A Rossini Blvd, Vanderbijlpark</p>
          <a href={FACEBOOK} target="_blank" rel="noopener">Facebook</a>
          <p className="bp-credit">Demo site by NFC Software Solutions</p>
        </div>
      </footer>

      <SpecialsToast />

      <a className="bp-float" data-hidden={!afterFilm} href="#book" aria-label="Book an appointment">Book</a>
    </main>
  );
}
