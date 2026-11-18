import { useEffect, useRef, useState } from "react";

export type Cue = { at: number; kicker?: string; title: string; body?: string; cta?: { label: string; href: string; external?: boolean }[] };
type Film = { src: string; poster: string };

const WIDE = "(min-aspect-ratio: 4/5)";

/**
 * Autoplay film hero (same player as Pimenta). The whole film downloads first behind a loading screen
 * (user, 18 Nov: never a film that stalls halfway on a weak signal), then plays once, slowly, with the
 * words for each part fading in, and rests on its last frame. Phones get the portrait cut, wide screens the 16:9 one.
 */
export function CinemaHero({ phone, wide, cues, brand, id }: { phone: Film; wide: Film; cues: Cue[]; brand: string; id: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [film] = useState(() => (window.matchMedia(WIDE).matches ? wide : phone)); // picked once: switching mid-film would restart it
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [cue, setCue] = useState(0);

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
    if (i !== cue) setCue(i);
  };

  const c = cues[cue];
  return (
    <section className="cine" id={id} aria-label={brand}>
      <video ref={video} className="cine-film" poster={film.poster} muted playsInline preload="none" onTimeUpdate={onTime} aria-hidden="true" />
      <div className="cine-shade" aria-hidden="true" />
      <div className="cine-copy" key={cue} data-show={ready}>
        {c.kicker && <p className="cine-kicker">{c.kicker}</p>}
        <h1 className="cine-title">{c.title}</h1>
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
