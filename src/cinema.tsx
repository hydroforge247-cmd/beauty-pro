import { useEffect, useRef, useState } from "react";

export type Cue = { at: number; kicker?: string; title: string; body?: string; cta?: { label: string; href: string; external?: boolean }[] };
type Film = { src: string; poster: string };

/**
 * Autoplay film hero (same player as Pimenta). The whole film downloads first behind a loading screen
 * (user, 18 Nov: never a film that stalls halfway on a weak signal), then plays once, slowly, with the
 * words for each part fading in, and rests on its last frame. Phones only: desktop keeps the scroll film (user, 18 Nov).
 */
export function CinemaHero({ film, cues, brand, id }: { film: Film; cues: Cue[]; brand: string; id: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [cue, setCue] = useState(0); // words on screen
  const [out, setOut] = useState(false); // fading the old words out before the next ones come in
  const target = useRef(0);

  useEffect(() => {
    const ctl = new AbortController();
    let url = "";
    (async () => {
      try {
        const res = await fetch(film.src, { signal: ctl.signal });
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body.getReader();
        const parts: BlobPart[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          got += value.length;
          if (total) setPct(Math.min(99, Math.round((got / total) * 100)));
        }
        url = URL.createObjectURL(new Blob(parts, { type: "video/mp4" }));
        const v = video.current!;
        v.src = url;
        await v.play().catch(() => {}); // muted + playsInline autoplay; if a browser still refuses, the poster stays
      } catch {
        if (ctl.signal.aborted) return; // shortcut: on a failed download the visitor gets the still poster, not a retry
      }
      setPct(100);
      setReady(true);
    })();
    return () => {
      ctl.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [film]);

  const onTime = () => {
    const t = video.current?.currentTime ?? 0;
    let i = 0;
    cues.forEach((c, k) => {
      if (t >= c.at) i = k;
    });
    if (i === target.current) return;
    target.current = i;
    setOut(true); // user, 18 Nov: words were swapped instantly; now fade out, then the next fade in with the film
    setTimeout(() => {
      setCue(target.current);
      setOut(false);
    }, 900);
  };

  const c = cues[cue];
  return (
    <section className="cine" id={id} aria-label={brand}>
      <video ref={video} className="cine-film" poster={film.poster} muted playsInline preload="none" onTimeUpdate={onTime} aria-hidden="true" />
      <div className="cine-shade" aria-hidden="true" />
      <div className="cine-copy" data-show={ready && !out}>
        {c.kicker && <p className="cine-kicker" key={`k${cue}`}>{c.kicker}</p>}
        <h1 className="cine-title" key={cue}>
          {c.title.split(" ").map((w, k) => (
            <span key={k}>
              <span style={{ animationDelay: `${250 + k * 90}ms` }}>{w}</span>{" "}
            </span>
          ))}
        </h1>
        {c.body && <p className="cine-body">{c.body}</p>}
        {c.cta && (
          <div className="cine-cta">
            {c.cta.map((b, k) => (
              <a key={b.href} className={k ? "cine-btn cine-btn--ghost" : "cine-btn"} href={b.href} {...(b.external ? { target: "_blank", rel: "noopener" } : {})}>
                {b.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="cine-loader" data-done={ready} role="status" aria-live="polite">
        <p className="cine-loader-brand">{brand}</p>
        <div className="cine-loader-bar">
          <i style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <p className="cine-loader-note">{ready ? "Welcome" : `Getting your chair ready… ${pct}%`}</p>
      </div>
    </section>
  );
}
