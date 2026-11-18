/**
 * Beauty Pro film (v7, 18 Nov 2026): one object that keeps changing as you scroll —
 * polish bottle → painted nails → lashes → serum drop → spa tray. Four Higgsfield clips joined
 * on shared frames (film-src/), each with its own portrait version for phones.
 */
import type { ScrollScrubScene, ScrollScrubTheme } from "./film";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#B8325A",
  background: "#F5DCE2",
  ink: "#2E1220",
  muted: "#6E4253",
};

const seg = (n: number) => ({
  frames: `/assets/world/frames/0${n}.bin`,
  liteFrames: `/assets/world/frames/0${n}-lite.bin`,
  liteClip: `/assets/world/studio-0${n}-lite.mp4`,
  clip: `/assets/world/studio-0${n}.mp4`,
  mobileClip: `/assets/world/studio-0${n}-mobile.mp4`,
  poster: `/assets/world/studio-0${n}-poster.jpg`,
  mobilePoster: `/assets/world/studio-0${n}-mobile-poster.jpg`,
});

const WHATSAPP = "https://wa.me/27683460928?text=" + encodeURIComponent("Hi Beauty Pro, I'd like to book an appointment.");

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    ...seg(1),
    id: "studio",
    label: "Nails",
    kicker: "Beauty Pro · Vanderbijlpark",
    title: "Beauty, done properly.",
    body: "Nails, lashes, skin and body treatments at 136A Rossini Blvd. Rated 4.9 from 699 reviews.",
    tags: ["Acrylic from R300", "Polygel from R299"],
    cta: [{ label: "Book now", href: "#book" }, { label: "See the menu", href: "#menu" }],
    scroll: 1.5,
  },
  {
    ...seg(2),
    id: "lashes",
    label: "Lashes",
    kicker: "Lashes and brows",
    title: "Lashes that flutter.",
    body: "Classic, volume and hybrid sets, lash fills, brow lamination and ombre brows.",
    tags: ["Lashes from R400"],
    scroll: 1.3,
  },
  {
    ...seg(3),
    id: "skin",
    label: "Skin",
    kicker: "Skin",
    title: "Skin that glows.",
    body: "HIFU lifts, plasma, mesotherapy and RF facials.",
    tags: ["HIFU from R699"],
    scroll: 1.3,
  },
  {
    ...seg(4),
    id: "unwind",
    label: "Unwind",
    kicker: "Feet, body and massage",
    title: "Your chair is waiting.",
    body: "Ionic foot detox, paraffin wax, pedicures and massages for when you need an hour off.",
    tags: ["Foot detox R299", "Hot stone massage R399"],
    cta: [{ label: "Book on WhatsApp", href: WHATSAPP, external: true }, { label: "Specials", href: "#specials" }],
    scroll: 2.8,
  },
];
