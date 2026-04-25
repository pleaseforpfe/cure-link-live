import speaker1 from "@/assets/speaker-1.png";
import speaker2 from "@/assets/speaker-2.png";
import speaker3 from "@/assets/speaker-3.png";
import speaker4 from "@/assets/speaker-4.png";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

export type SpeakerStatus = "upcoming" | "live" | "done";

export interface Speaker {
  id: string;
  name: string;
  photo: string;
  specialty: string;
  talk: string;
  time: string;
  startsAt: number; // ms timestamp (relative to now)
  description: string;
  links: { label: string; url: string }[];
  gallery: string[];
}

const now = Date.now();

export const speakers: Speaker[] = [
  {
    id: "1",
    name: "Dr. Marcus Chen",
    photo: speaker1,
    specialty: "Cardiology · Stanford",
    talk: "AI-Driven Cardiac Diagnostics",
    time: "09:00 — 09:45",
    startsAt: now - 5 * 60 * 1000, // started 5 min ago → LIVE
    description:
      "An exploration of how machine-learning models trained on millions of ECGs are reshaping early detection of arrhythmias and silent ischemia in primary care.",
    links: [
      { label: "Research Paper", url: "#" },
      { label: "Speaker Profile", url: "#" },
    ],
    gallery: [event1, event2, event3],
  },
  {
    id: "2",
    name: "Dr. Sofia Ramirez",
    photo: speaker2,
    specialty: "Pediatric Oncology · Mayo",
    talk: "Personalised Medicine in Childhood Cancer",
    time: "10:00 — 10:45",
    startsAt: now + 30 * 60 * 1000,
    description:
      "Genomic profiling has unlocked targeted therapies that were unthinkable a decade ago. A practical guide to integrating molecular tumour boards.",
    links: [
      { label: "Slides", url: "#" },
      { label: "Twitter", url: "#" },
    ],
    gallery: [event2, event3, event1],
  },
  {
    id: "3",
    name: "Prof. Hans Müller",
    photo: speaker3,
    specialty: "Neurosurgery · Charité Berlin",
    talk: "Augmented Reality in the Operating Room",
    time: "11:15 — 12:00",
    startsAt: now + 90 * 60 * 1000,
    description:
      "Live demonstration of AR-assisted craniotomy with real-time vascular mapping and intraoperative MRI overlay.",
    links: [
      { label: "Watch Demo", url: "#" },
      { label: "Lab Website", url: "#" },
    ],
    gallery: [event3, event1, event2],
  },
  {
    id: "4",
    name: "Dr. Amelia Brooks",
    photo: speaker4,
    specialty: "Internal Medicine · Johns Hopkins",
    talk: "Long COVID — What We Know in 2026",
    time: "14:00 — 14:45",
    startsAt: now + 240 * 60 * 1000,
    description:
      "A comprehensive update on the pathophysiology, diagnostic criteria, and emerging therapeutic options for post-acute sequelae of SARS-CoV-2.",
    links: [
      { label: "Guidelines", url: "#" },
      { label: "Patient Resources", url: "#" },
    ],
    gallery: [event1, event3, event2],
  },
];

export function getStatus(s: Speaker): SpeakerStatus {
  const elapsed = Date.now() - s.startsAt;
  if (elapsed < 0) return "upcoming";
  if (elapsed < 45 * 60 * 1000) return "live";
  return "done";
}
