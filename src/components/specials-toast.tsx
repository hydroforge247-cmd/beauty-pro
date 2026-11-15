import { useEffect, useState } from "react";

const KEY = "bp-toast-dismissed";

// Slides in once the visitor scrolls past the film; dismissal is remembered for the session.
export function SpecialsToast() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem(KEY)) return; } catch { /* storage blocked: still show */ }
    const onScroll = () => {
      const specials = document.getElementById("specials");
      if (!specials) return;
      const past = window.scrollY > specials.offsetTop + specials.offsetHeight;
      if (past) { setOpen(true); window.removeEventListener("scroll", onScroll); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <aside className="bp-toast" data-open={open} aria-hidden={!open} aria-label="Black Friday special">
      <strong>HIFU full face, R999</strong>
      <p>Black Friday price until 30 November.</p>
      <a href="#book" tabIndex={open ? 0 : -1} onClick={close}>Book this</a>
      <button type="button" onClick={close} aria-label="Close" tabIndex={open ? 0 : -1}>×</button>
    </aside>
  );
}
