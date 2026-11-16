/**
 * Beauty Pro journey: ONE continuous studio walk-through film, cut into four
 * consecutive segments so each chapter owns a stretch of it. Seams are the
 * film's own consecutive frames, and every poster is its segment's first frame.
 */
import type {
  ScrollScrubScene,
  ScrollScrubTheme,
} from "./film";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#E8577E",
  background: "#2A0E1C",
  ink: "#FFF1F4",
  muted: "#E7B9C6",
};

const FRAME_COUNTS = [45, 83, 136, 97]; // phone still-frame sequences, one per segment
const seg = (n: number) => ({
  frames: { dir: `/assets/world/frames/0${n}/`, count: FRAME_COUNTS[n - 1] },
  clip: `/assets/world/studio-0${n}.mp4`,
  mobileClip: `/assets/world/studio-0${n}-mobile.mp4`,
  poster: `/assets/world/studio-0${n}-poster.jpg`,
  mobilePoster: `/assets/world/studio-0${n}-mobile-poster.jpg`,
});

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    ...seg(1),
    id: "studio",
    label: "Studio",
    kicker: "Salon and training academy, Vanderbijlpark",
    title: "Beauty, done properly.",
    body: "Nails, lashes, permanent makeup, skin and body treatments at 136A Rossini Blvd. Rated 4.9 from 699 reviews.",
    tags: ["Nails", "Lashes", "Skin", "Body"],
    scroll: 1.4,
  },
  {
    ...seg(2),
    id: "nails",
    label: "Nails",
    kicker: "Nails",
    title: "Nails that turn heads.",
    body: "Acrylic, gel and polygel sets, overlays and toes, by qualified nail therapists.",
    tags: ["Acrylic from R300", "Polygel from R299"],
    align: "right",
    scroll: 1.2,
  },
  {
    ...seg(3),
    id: "lashes-skin",
    label: "Lashes and skin",
    kicker: "Lashes, brows and skin",
    title: "Lashes, brows and skin.",
    body: "Classic to hybrid lashes, ombre brows, HIFU lifts and plasma, all under one roof.",
    tags: ["Lashes from R400", "HIFU from R699"],
    scroll: 1.2,
  },
  {
    ...seg(4),
    id: "unwind",
    label: "Unwind",
    kicker: "Feet and massage",
    title: "Then put your feet up.",
    body: "Ionic foot detox, paraffin wax, pedicures and massages for when you need an hour off.",
    tags: ["Foot detox R299", "Massage from R249"],
    align: "right",
    scroll: 1.4,
  },
];
