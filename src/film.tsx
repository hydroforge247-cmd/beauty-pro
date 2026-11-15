// NFC Software Solutions scroll-film player: the visitor's scroll scrubs a
// film split into consecutive chapter clips, with chapter copy pinned over it.
import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface ScrollScrubScene {
  id: string;
  label: string;
  clip: string;
  mobileClip?: string;
  poster: string;
  mobilePoster?: string;
  title: string;
  body: string;
  kicker?: string;
  tags?: string[];
  align?: "left" | "right";
  /** Viewport heights of scrolling this chapter takes. */
  scroll?: number;
}

export interface ScrollScrubTheme {
  background: string;
  ink: string;
  muted: string;
  accent: string;
}

const BASE = import.meta.env.BASE_URL;
const asset = (p: string) => BASE + p.replace(/^\//, "");
const MOBILE_QUERY = "(hover: none) and (pointer: coarse), (max-width: 860px)";

export function ScrollScrub({ scenes, theme }: { scenes: ScrollScrubScene[]; theme: ScrollScrubTheme }) {
  const rootRef = useRef<HTMLElement>(null);
  const jumpRef = useRef<(i: number) => void>(() => {});
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const layers = [...root.querySelectorAll<HTMLElement>("[data-film-layer]")];
    const videos = layers.map((l) => l.querySelector("video")!);
    const bands = [...root.querySelectorAll<HTMLElement>("[data-film-band]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia(MOBILE_QUERY).matches;
    const urls: string[] = [];
    const ctrl = new AbortController();
    const want = new Array<number>(scenes.length).fill(0); // latest target time per clip
    const seeking = new Array<boolean>(scenes.length).fill(false);
    let current = -1;
    let frame = 0;

    function seek(i: number) {
      const v = videos[i];
      if (!v.src || v.readyState < 1 || seeking[i]) return;
      const t = Math.min(want[i], Math.max(0, (v.duration || 0) - 0.04));
      if (Math.abs(v.currentTime - t) < 0.01) return;
      seeking[i] = true;
      v.currentTime = t;
    }

    const onSeeked = videos.map((_, i) => () => {
      seeking[i] = false;
      layers[i].dataset.videoPainted = "true";
      seek(i); // catch up with the newest scroll position
    });
    videos.forEach((v, i) => v.addEventListener("seeked", onSeeked[i]));

    // Clips load as blobs so seeking is instant; first chapter first.
    if (!reduced) {
      (async () => {
        for (let i = 0; i < scenes.length; i++) {
          try {
            const s = scenes[i];
            const res = await fetch(asset(mobile && s.mobileClip ? s.mobileClip : s.clip), { signal: ctrl.signal });
            if (!res.ok) throw new Error(String(res.status));
            const url = URL.createObjectURL(await res.blob());
            urls.push(url);
            videos[i].src = url;
            videos[i].addEventListener("loadedmetadata", () => update(), { once: true });
          } catch {
            return; // aborted or offline: the posters stay up
          }
        }
      })();
    }

    function update() {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const top = root!.getBoundingClientRect().top + y;
      const total = Math.max(1, root!.offsetHeight - vh);
      root!.style.setProperty("--ss-progress", String(Math.min(1, Math.max(0, (y - top) / total))));

      let idx = 0;
      bands.forEach((b, i) => {
        const bTop = b.getBoundingClientRect().top + y;
        const p = Math.min(1, Math.max(0, (y - bTop) / Math.max(1, b.offsetHeight)));
        if (y >= bTop - 1) idx = i;
        want[i] = p * (videos[i].duration || 0);
        seek(i);
      });
      if (idx !== current) {
        current = idx;
        layers.forEach((l, i) => {
          l.style.opacity = i === idx ? "1" : "0";
        });
        setActive(idx);
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // iOS only paints seeked frames once a gesture has touched the video.
    const prime = () => videos.forEach((v) => v.play().then(() => v.pause()).catch(() => {}));
    window.addEventListener("touchstart", prime, { once: true, passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    jumpRef.current = (i: number) => {
      const b = bands[i];
      if (b) {
        window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY + 2, behavior: reduced ? "auto" : "smooth" });
      }
    };

    return () => {
      ctrl.abort();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("touchstart", prime);
      videos.forEach((v, i) => v.removeEventListener("seeked", onSeeked[i]));
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [scenes]);

  const style = {
    "--ss-accent": theme.accent,
    "--ss-bg": theme.background,
    "--ss-ink": theme.ink,
    "--ss-muted": theme.muted,
  } as CSSProperties;

  return (
    <section className="scroll-scrub" ref={rootRef} style={style}>
      <div className="scroll-scrub__stage">
        <div className="scroll-scrub__media" aria-hidden="true">
          {scenes.map((s, i) => (
            <figure key={s.id} className="scroll-scrub__layer" data-film-layer="" style={{ opacity: i === 0 ? 1 : 0 }}>
              <picture className="scroll-scrub__picture">
                {s.mobilePoster ? <source media={MOBILE_QUERY} srcSet={asset(s.mobilePoster)} /> : null}
                <img
                  className="scroll-scrub__poster"
                  src={asset(s.poster)}
                  alt=""
                  decoding="async"
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              </picture>
              <video className="scroll-scrub__video" muted playsInline preload="auto" />
            </figure>
          ))}
        </div>
        <div className="scroll-scrub__progress" aria-hidden="true">
          <span />
        </div>
        <nav className="scroll-scrub__route" aria-label="Scroll chapters">
          {scenes.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="scroll-scrub__route-button"
              aria-current={active === i ? "step" : undefined}
              onClick={() => jumpRef.current(i)}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="scroll-scrub__story">
        {scenes.map((s, i) => {
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <article
              key={s.id}
              id={s.id}
              className="scroll-scrub__chapter"
              data-align={s.align ?? "left"}
              data-film-band=""
              style={{ minHeight: `${(s.scroll ?? 1) * 100}dvh` }}
            >
              <div className="scroll-scrub__chapter-pin">
                <div className="scroll-scrub__copy">
                  {s.kicker ? <p className="scroll-scrub__kicker">{s.kicker}</p> : null}
                  <Heading className="scroll-scrub__title">{s.title}</Heading>
                  <p className="scroll-scrub__body">{s.body}</p>
                  {s.tags?.length ? (
                    <ul className="scroll-scrub__tags">
                      {s.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
