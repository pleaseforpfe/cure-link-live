import { createContext, useContext, useMemo, useState } from "react";

export type Language = "en" | "fr";

type Dictionary = {
  nav: {
    home: string;
    liveProgram: string;
    partners: string;
    postCoffee: string;
    organizers: string;
    portfolio: string;
  };
  footer: {
    conference: string;
    contact: string;
    description: string;
    rights: string;
    crafted: string;
  };
  organizersHero: {
    kicker: string;
    title: string;
    description: string;
  };
  postCoffeeHero: {
    kicker: string;
    title: string;
    description: string;
  };
  liveProgramHero: {
    kicker: string;
    title: string;
    description: string;
  };
  partnersHero: {
    kicker: string;
    title: string;
    description: string;
  };
  partnersGroups: {
    groupLabel: string;
    clubs: { title: string; description: string };
    media: { title: string; description: string };
    sponsors: { title: string; description: string };
  };
  portfolioHero: {
    kicker: string;
    title: string;
    description: string;
  };
  newsTicker: {
    label: string;
    items: string[];
  };
  hero: {
    kicker: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    date: string;
    location: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  liveAttendance: {
    label: string;
    updated: string;
    speakers: string;
    sessions: string;
    partners: string;
  };
  liveStream: {
    kicker: string;
    title: string;
    description: string;
    badge: string;
  };
  programCta: {
    fileInfo: string;
    title: string;
    description: string;
    button: string;
  };
  languageToggle: string;
};

const copy: Record<Language, Dictionary> = {
  en: {
    nav: {
      home: "Home",
      liveProgram: "Live Program",
      partners: "Our Partners",
      postCoffee: "Post Coffee",
      organizers: "Organizers",
      portfolio: "Portfolio",
    },
    footer: {
      conference: "Conference",
      contact: "Contact",
      description:
        "The global stage where medicine meets innovation. Two days of science, connection, and inspiration at the University of Ouargla, in collaboration with the Ouargla Physicians Organization.",
      rights: "© 2026 MedConf. All rights reserved.",
      crafted: "Crafted for the global medical community.",
    },
    organizersHero: {
      kicker: "The team behind it all",
      title: "Meet the Organizers",
      description:
        "A volunteer team of physicians, researchers and students dedicated to building the world's best medical conference.",
    },
    postCoffeeHero: {
      kicker: "Post Coffee Showcase",
      title: "Post Coffee",
      description:
        "Discover the clubs, showcases, and the friendly coffee corner that lights up every break.",
    },
    liveProgramHero: {
      kicker: "Day 1 · March 14, 2026",
      title: "Live Program",
      description:
        "Track every session in real time, from keynote stages to breakout rooms. Live and upcoming blocks rise to the top with countdowns and stream status.",
    },
    partnersHero: {
      kicker: "Trusted by global leaders",
      title: "Our Partners",
      description:
        "Twelve years of collaboration with the world's most respected names in healthcare and life sciences.",
    },
    partnersGroups: {
      groupLabel: "partners",
      clubs: {
        title: "Clubs",
        description: "Community-driven medical clubs and specialty circles energizing the program.",
      },
      media: {
        title: "Media",
        description: "Broadcast and press partners covering the summit in real time.",
      },
      sponsors: {
        title: "Sponsors",
        description: "Industry leaders backing innovation, scholarships, and learning labs.",
      },
    },
    portfolioHero: {
      kicker: "Visual Identity",
      title: "Design Portfolio",
      description: "Posters, badges and product mockups crafted by the MedConf design team.",
    },
    newsTicker: {
      label: "Live News",
      items: [
        "Day 1 keynote starts at 9:00 AM — Main Auditorium",
        "Workshop: Advanced Cardiac Imaging — Hall B at 2:00 PM",
        "New: AI in Diagnostics panel added to the schedule",
        "Networking break with sponsors — 10:30 AM in the Atrium",
        "CME credits available for all live sessions",
        "Don't miss the Closing Awards Ceremony tonight at 8 PM",
      ],
    },
    hero: {
      kicker: "International Medical Summit · Edition 04",
      titleLine1: "4th Medical-Surgical Days of",
      titleLine2: "Ouargla",
      description:
        "The global stage where medicine meets innovation. Two days of science, connection, and inspiration at the University of Ouargla, in collaboration with the Ouargla Physicians Organization.",
      date: "08-09 May 2026",
      location: "Amphitheatre de l'universite KASDI Merbah Ouargla",
      ctaPrimary: "View Sessions",
      ctaSecondary: "Watch Live",
    },
    liveAttendance: {
      label: "Live Attendance",
      updated: "Updated in real-time",
      speakers: "Speakers",
      sessions: "Sessions",
      partners: "Partners",
    },
    registration: {
      kicker: "Register and participate",
      titleLine1: "Secure your seat for the",
      titleLine2: "live experience",
      description:
        "Join keynote stages, hands-on labs, and the post-coffee club showcases. Fill in the form and get your participation badge within 24 hours.",
      date: "08-09 May 2026",
      location: "Amphitheatre de l'universite KASDI Merbah Ouargla",
      includedLabel: "Included",
      includedItems: ["All sessions", "Club showcase", "Coffee lounge"],
      formKicker: "Participation form",
      formTitle: "Register in minutes",
      namePlaceholder: "Full name",
      emailPlaceholder: "Email address",
      orgPlaceholder: "Organization / Hospital",
      participationPlaceholder: "Participation type",
      participationOptions: ["In-person", "Virtual", "Student / Resident"],
      interestPlaceholder: "Main interest",
      interestOptions: ["Cardiology", "Surgery", "Research & AI", "Leadership"],
      textareaPlaceholder: "What sessions or clubs are you most excited about?",
      submit: "Submit registration",
      helper: "You will receive a confirmation email and personalized schedule within 24 hours.",
    },
    liveStream: {
      kicker: "On Air",
      title: "Watch the Live Stream",
      description: "Follow every keynote, panel, and workshop in HD — from anywhere in the world.",
      badge: "Live",
    },
    programCta: {
      fileInfo: "PDF · 4.2 MB",
      title: "Download the full program",
      description: "All sessions, speakers, room maps and CME credit details — in one beautifully designed document.",
      button: "Download Program",
    },
    languageToggle: "FR",
  },
  fr: {
    nav: {
      home: "Accueil",
      liveProgram: "Programme en direct",
      partners: "Nos partenaires",
      postCoffee: "Post Coffee",
      organizers: "Organisateurs",
      portfolio: "Portfolio",
    },
    footer: {
      conference: "Conference",
      contact: "Contact",
      description:
        "La scene mondiale ou la medecine rencontre l innovation. Deux jours de science, de connexion et d inspiration a l Universite d Ouargla, en collaboration avec l Organisation des Medecins d Ouargla.",
      rights: "© 2026 MedConf. Tous droits reserves.",
      crafted: "Concu pour la communaute medicale mondiale.",
    },
    organizersHero: {
      kicker: "L equipe derriere tout",
      title: "Rencontrez les organisateurs",
      description:
        "Une equipe benevole de medecins, chercheurs et etudiants dedies a construire la meilleure conference medicale au monde.",
    },
    postCoffeeHero: {
      kicker: "Post Coffee Showcase",
      title: "Post Coffee",
      description:
        "Decouvrez les clubs, les showcases et le coin cafe convivial qui illumine chaque pause.",
    },
    liveProgramHero: {
      kicker: "Jour 1 · 14 Mars 2026",
      title: "Programme en direct",
      description:
        "Suivez chaque session en temps reel, des keynotes aux salles paralleles. Les blocs en direct et a venir remontent avec le compte a rebours et le statut streaming.",
    },
    partnersHero: {
      kicker: "La confiance des leaders mondiaux",
      title: "Nos partenaires",
      description:
        "Douze ans de collaboration avec les noms les plus respectes de la sante et des sciences de la vie.",
    },
    partnersGroups: {
      groupLabel: "partenaires",
      clubs: {
        title: "Clubs",
        description: "Des clubs medicaux et cercles de specialite qui dynamisent le programme.",
      },
      media: {
        title: "Media",
        description: "Partenaires presse et diffusion couvrant le sommet en temps reel.",
      },
      sponsors: {
        title: "Sponsors",
        description: "Les leaders qui soutiennent l innovation, les bourses et les labs d apprentissage.",
      },
    },
    portfolioHero: {
      kicker: "Identite visuelle",
      title: "Portfolio design",
      description: "Affiches, badges et maquettes produit realises par l equipe design MedConf.",
    },
    newsTicker: {
      label: "Infos en direct",
      items: [
        "Keynote du jour 1 a 09:00 — Amphitheatre principal",
        "Atelier: imagerie cardiaque avancee — Salle B a 14:00",
        "Nouveau: panel IA en diagnostic ajoute au programme",
        "Pause networking avec les sponsors — 10:30 dans l Atrium",
        "Credits CME disponibles pour toutes les sessions live",
        "Ne manquez pas la ceremonie de cloture ce soir a 20:00",
      ],
    },
    hero: {
      kicker: "Sommet medical international · Edition 04",
      titleLine1: "4èmes Journées médico-chirurgicales",
      titleLine2: "d’Ouargla",
      description:
        "La scene mondiale ou la medecine rencontre l innovation. Deux jours de science, de connexion et d inspiration a l Universite d Ouargla, en collaboration avec l Organisation des Medecins d Ouargla.",
      date: "08 et 09 May 2026",
      location: "Amphitheatre de l'universite KASDI Merbah Ouargla",
      ctaPrimary: "Voir les sessions",
      ctaSecondary: "Regarder en direct",
    },
    liveAttendance: {
      label: "Presence en direct",
      updated: "Mis a jour en temps reel",
      speakers: "Intervenants",
      sessions: "Sessions",
      partners: "Partenaires",
    },
    registration: {
      kicker: "Inscription et participation",
      titleLine1: "Reservez votre place pour",
      titleLine2: "l experience live",
      description:
        "Rejoignez les keynotes, les labs pratiques et les showcases des clubs post-coffee. Remplissez le formulaire et recevez votre badge sous 24 heures.",
      date: "08 et 09 May 2026",
      location: "Amphitheatre de l'universite KASDI Merbah Ouargla",
      includedLabel: "Inclus",
      includedItems: ["Toutes les sessions", "Showcase clubs", "Espace cafe"],
      formKicker: "Formulaire de participation",
      formTitle: "Inscription en quelques minutes",
      namePlaceholder: "Nom complet",
      emailPlaceholder: "Adresse email",
      orgPlaceholder: "Organisation / Hopital",
      participationPlaceholder: "Type de participation",
      participationOptions: ["Sur place", "En ligne", "Etudiant / Resident"],
      interestPlaceholder: "Interet principal",
      interestOptions: ["Cardiologie", "Chirurgie", "Recherche et IA", "Leadership"],
      textareaPlaceholder: "Quelles sessions ou quels clubs vous interessent le plus ?",
      submit: "Envoyer l inscription",
      helper: "Vous recevrez un email de confirmation et un programme personnalise sous 24 heures.",
    },
    liveStream: {
      kicker: "En direct",
      title: "Regarder le live",
      description: "Suivez chaque keynote, panel et atelier en HD, partout dans le monde.",
      badge: "Live",
    },
    programCta: {
      fileInfo: "PDF · 4.2 MB",
      title: "Telecharger le programme complet",
      description: "Toutes les sessions, intervenants, plans de salle et details CME dans un document soigne.",
      button: "Telecharger le programme",
    },
    languageToggle: "EN",
  },
};

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
  t: Dictionary;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const value = useMemo(() => ({ language, setLanguage, t: copy[language] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
