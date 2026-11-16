// NFC Software Solutions scroll-film player: the visitor's scroll scrubs a
// film split into consecutive chapter clips, with chapter copy pinned over it.
// A single animation-frame loop eases each clip toward the scroll position and
// only asks for a new frame once the browser has finished the previous seek,
// which is what keeps phones (iOS Safari, Android Chrome) from stalling.
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
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

interface Clip {
  layer: HTMLElement;
  band: HTMLElement;
  start: number; // px from the top of the film section
  end: number;
  target: number; // 0..1 where the scroll wants this clip
  current: number; // eased 0..1 actually shown
  visible: boolean;
  video?: HTMLVideoElement;
  ready: boolean;
  loading: boolean;
  url?: string;
}

export function ScrollScrub({ scenes, theme }: { scenes: ScrollScrubScene[]; theme: ScrollScrubTheme }) {
  const rootRef = useRef<HTMLElement>(null);
  const jumpRef = useRef<(i: number) => void>(() => {});
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const layers = [...root.querySelectorAll<HTMLElement>("[data-film-layer]")];
    const bands = [...root.querySelectorAll<HTMLElement>("[data-film-band]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const mobile = window.matchMedia(MOBILE_QUERY).matches;
    const epsilon = mobile ? 0.02 : 0.008;
    const clips: Clip[] = layers.map((layer, i) => ({
      layer, band: bands[i], start: 0, end: 0, target: 0, current: 0,
      visible: i === 0, ready: false, loading: false,
    }));

    let destroyed = false;
    let dirty = true;
    let frame = 0;
    let rootTop = 0;
    let total = 1;
    let vh = window.innerHeight;
    let layoutWidth = window.innerWidth;
    let userReady = false;
    let shown = -1;

    const prime = (v?: HTMLVideoElement) => {
      if (v) v.play().then(() => v.pause()).catch(() => {});
    };

    function layout() {
      vh = window.innerHeight;
      layoutWidth = window.innerWidth;
      const y = window.scrollY;
      rootTop = root!.getBoundingClientRect().top + y;
      for (const c of clips) {
        c.start = c.band.getBoundingClientRect().top + y - rootTop;
        c.end = c.start + c.band.offsetHeight;
      }
      total = Math.max(clips.at(-1)?.end ?? vh, vh);
      dirty = true;
    }

    async function load(i: number) {
      const c = clips[i];
      if (!c || reduced || destroyed || c.loading || c.ready) return;
      c.loading = true;
      try {
        const s = scenes[i];
        const res = await fetch(asset(mobile && s.mobileClip ? s.mobileClip : s.clip));
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (destroyed) return;
        const url = URL.createObjectURL(blob);
        const v = document.createElement("video");
        v.className = "scroll-scrub__video";
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.addEventListener("loadedmetadata", () => {
          c.ready = true;
          c.loading = false;
          dirty = true;
        }, { once: true });
        v.addEventListener("loadeddata", () => {
          if (userReady || !coarse) prime(v);
        }, { once: true });
        v.addEventListener("seeked", () => {
          c.layer.dataset.videoPainted = "true";
        });
        v.src = url;
        c.layer.append(v);
        c.video = v;
        c.url = url;
      } catch {
        c.loading = false; // try again when the visitor scrolls near it
      }
    }

    function readScroll() {
      const y = clamp(window.scrollY - rootTop, 0, total);
      const fade = 0.1 * vh;
      let idx = 0;
      clips.forEach((c, i) => {
        if (y >= c.start) idx = i;
      });
      clips.forEach((c, i) => {
        c.target = clamp((y - c.start) / Math.max(c.end - c.start, 1));
        const outside = y < c.start ? c.start - y : y > c.end ? y - c.end : 0;
        const t = clamp(1 - outside / Math.max(fade, 1));
        const opacity = reduced ? (outside === 0 ? 1 : 0) : t * t * (3 - 2 * t);
        c.visible = opacity > 0.001;
        c.layer.style.opacity = String(opacity);
        c.layer.style.zIndex = i === idx ? "2" : "1";
        if (y > c.start - 1.5 * vh && y < c.end + 1.5 * vh) void load(i);
      });
      if (idx !== shown) {
        shown = idx;
        setActive(idx);
      }
      root!.style.setProperty("--ss-progress", String(clamp(y / Math.max(total - vh, 1))));
    }

    function updateVideos() {
      for (const c of clips) {
        const v = c.video;
        if (!v || !c.ready || v.seeking) continue;
        if (!c.visible && Math.abs(c.current - c.target) < 0.002) continue;
        c.current += (c.target - c.current) * 0.2;
        const t = clamp(c.current, 0, 0.999) * (v.duration || 1);
        if (Math.abs(v.currentTime - t) > epsilon) {
          try {
            v.currentTime = t;
          } catch {
            /* keep the last painted frame */
          }
        }
      }
    }

    function tick() {
      if (destroyed) return;
      if (dirty) {
        dirty = false;
        readScroll();
      }
      updateVideos();
      frame = requestAnimationFrame(tick);
    }

    const onScroll = () => {
      dirty = true;
    };
    // Phones resize on every address-bar slide; only re-measure on a real width change.
    const onResize = () => {
      if (coarse && window.innerWidth === layoutWidth) return;
      layout();
    };
    const onGesture = () => {
      if (userReady) return;
      userReady = true;
      clips.forEach((c) => prime(c.video));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", layout);
    window.addEventListener("pointerdown", onGesture, { once: true, passive: true });
    window.addEventListener("touchstart", onGesture, { once: true, passive: true });
    layout();
    // Fonts and images shift the page after first paint; measure again once they settle.
    window.addEventListener("load", layout, { once: true });
    frame = requestAnimationFrame(tick);

    jumpRef.current = (i: number) => {
      const c = clips[i];
      if (c) {
        window.scrollTo({ top: rootTop + c.start + 0.15 * (c.end - c.start), behavior: reduced ? "auto" : "smooth" });
      }
    };

    return () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", layout);
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("load", layout);
      for (const c of clips) {
        c.video?.remove();
        if (c.url) URL.revokeObjectURL(c.url);
        delete c.layer.dataset.videoPainted;
      }
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
