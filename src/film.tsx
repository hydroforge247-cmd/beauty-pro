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
  /** Phones scrub still frames on a canvas instead of seeking video (seeking stutters on phones). */
  /** One file per chapter: uint32 LE count, count × uint32 LE lengths, then the WebP frames back to back. */
  frames?: string;
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
  canvas?: HTMLCanvasElement;
  imgs?: (HTMLImageElement | undefined)[];
  frameUrls?: string[];
  drawn: number;
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
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const mobile = window.matchMedia(MOBILE_QUERY).matches;
    // Phones: the film only moves under the finger, and Huawei power saving turns reduce-motion on, so ignore it there.
    const reduced = !mobile && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const epsilon = mobile ? 0.02 : 0.008;
    const clips: Clip[] = layers.map((layer, i) => ({
      layer, band: bands[i], start: 0, end: 0, target: 0, current: 0,
      visible: i === 0, ready: false, loading: false, drawn: -1,
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
    let frameQueue: Promise<void> = Promise.resolve();

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
      total = Math.max(clips[clips.length - 1]?.end ?? vh, vh);
      dirty = true;
    }

    async function load(i: number) {
      const c = clips[i];
      if (!c || reduced || destroyed || c.loading || c.ready) return;
      c.loading = true;
      const s = scenes[i];
      // Chapters queue in order so the opening one gets the whole connection on a slow line.
      if (mobile && s.frames) return void (frameQueue = frameQueue.then(() => loadFrames(c, s.frames!)));
      try {
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

    // One request per chapter: GitHub Pages serves hundreds of small files far too slowly.
    async function loadFrames(c: Clip, src: string) {
      let buf: ArrayBuffer;
      try {
        const res = await fetch(asset(src));
        if (!res.ok) throw new Error(String(res.status));
        buf = await res.arrayBuffer();
      } catch {
        c.loading = false; // try again on the next scroll
        return;
      }
      if (destroyed) return;
      const dv = new DataView(buf);
      const count = dv.getUint32(0, true);
      const urls: string[] = [];
      let off = 4 + 4 * count;
      for (let k = 0; k < count; k++) {
        const len = dv.getUint32(4 + 4 * k, true);
        urls.push(URL.createObjectURL(new Blob([new Uint8Array(buf, off, len)], { type: "image/webp" })));
        off += len;
      }
      c.frameUrls = urls;
      const canvas = document.createElement("canvas");
      canvas.className = "scroll-scrub__video";
      c.layer.append(canvas);
      c.canvas = canvas;
      const imgs: (HTMLImageElement | undefined)[] = new Array(count);
      c.imgs = imgs;
      // Every 6th frame first, so scrubbing works before the rest arrive.
      const order = [...imgs.keys()].sort((a, b) => Number(a % 6 !== 0) - Number(b % 6 !== 0) || a - b);
      let next = 0;
      const worker = async () => {
        while (next < order.length && !destroyed) {
          const k = order[next++];
          const img = new Image();
          img.src = urls[k];
          try {
            await img.decode();
            imgs[k] = img;
            c.ready = true;
            c.drawn = -1; // a closer frame may now exist
          } catch {
            /* the nearest loaded frame stands in */
          }
        }
      };
      for (let w = 0; w < 4; w++) void worker();
    }

    function drawFrame(c: Clip) {
      const imgs = c.imgs!;
      const cv = c.canvas!;
      c.current += (c.target - c.current) * 0.2;
      const want = Math.round(clamp(c.current) * (imgs.length - 1));
      let k = -1;
      for (let d = 0; d < imgs.length && k < 0; d++) {
        if (imgs[want - d]) k = want - d;
        else if (imgs[want + d]) k = want + d;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      const resized = cv.width !== w || cv.height !== h;
      if (k < 0 || (k === c.drawn && !resized)) return;
      if (resized) {
        cv.width = w;
        cv.height = h;
      }
      const img = imgs[k]!;
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight); // object-fit: cover
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const ctx = cv.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      c.drawn = k;
      cv.dataset.frame = String(k);
      c.layer.dataset.videoPainted = "true";
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
        // Phone frames are light, so fetch every chapter up front; a quick thumb-flick would outrun lazy loading.
        if (mobile || (y > c.start - 1.5 * vh && y < c.end + 1.5 * vh)) void load(i);
      });
      if (idx !== shown) {
        shown = idx;
        setActive(idx);
      }
      root!.style.setProperty("--ss-progress", String(clamp(y / Math.max(total - vh, 1))));
    }

    function updateVideos() {
      for (const c of clips) {
        if (c.canvas) {
          if (c.ready) drawFrame(c);
          continue;
        }
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

    let lastY = -1;
    // ?debug on the URL shows what the film is doing, for phones we can't attach a debugger to.
    const debug = new URLSearchParams(location.search).has("debug") ? document.createElement("pre") : null;
    if (debug) {
      debug.style.cssText = "position:fixed;left:4px;right:4px;top:60px;z-index:99;margin:0;padding:6px;font:11px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.75);white-space:pre-wrap;pointer-events:none";
      document.body.append(debug);
      const errs: string[] = [];
      window.addEventListener("error", (e) => errs.push(e.message));
      const show = () => {
        if (destroyed) return debug.remove();
        debug.textContent = [
          navigator.userAgent,
          `mobile=${mobile} coarse=${coarse} reduced=${reduced} vh=${vh} y=${Math.round(window.scrollY)} top=${Math.round(rootTop)} chapter=${shown}`,
          ...clips.map((c, i) => `${i}: ${Math.round(c.start)}-${Math.round(c.end)} ready=${c.ready} loading=${c.loading} target=${c.target.toFixed(2)} ${c.canvas ? `frame=${c.drawn}/${c.imgs?.length} loaded=${c.imgs?.filter(Boolean).length}` : c.video ? `video t=${c.video.currentTime.toFixed(2)}` : "poster"} op=${c.layer.style.opacity.slice(0, 4)}`),
          ...errs.slice(-3),
        ].join("\n");
        setTimeout(show, 400);
      };
      show();
    }

    function tick() {
      if (destroyed) return;
      // Some Android browsers hold back scroll events during a fling; read the position every frame.
      if (window.scrollY !== lastY) {
        lastY = window.scrollY;
        dirty = true;
      }
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
        c.canvas?.remove();
        c.frameUrls?.forEach((u) => URL.revokeObjectURL(u));
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
              style={{ "--ss-len": s.scroll ?? 1 } as CSSProperties}
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
