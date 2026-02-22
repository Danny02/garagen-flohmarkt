export const APP_CONFIG = {
  filters: {
    allLabel: "Alle",
  },
  event: {
    startAt: "2026-06-13T10:00:00",
    endAt: "2026-06-13T16:00:00",
    areaLabel: "Im gesamten Stadtgebiet",
    badgeLabel: "13.6.",
  },
  catalog: {
    districts: ["Kernstadt", "Weinzierlein", "Wintersdorf", "Leichendorf"],
    categories: [
      {
        name: "Kindersachen",
        color: "#ED5160",
        icon: "K",
        legendLabel: "Kinder",
      },
      {
        name: "Spielzeug",
        color: "#ED5160",
        icon: "S",
        legendLabel: "Spielzeug",
      },
      { name: "Buecher", color: "#0093FC", icon: "B", legendLabel: "Buecher" },
      { name: "Medien", color: "#0093FC", icon: "M", legendLabel: "Medien" },
      { name: "Moebel", color: "#009DA9", icon: "M", legendLabel: "Moebel" },
      {
        name: "Haushalt",
        color: "#009DA9",
        icon: "H",
        legendLabel: "Haushalt",
      },
      { name: "Vintage", color: "#CA61D1", icon: "V", legendLabel: "Vintage" },
      {
        name: "Kleidung",
        color: "#10AB48",
        icon: "K",
        legendLabel: "Kleidung",
      },
      { name: "Garten", color: "#10AB48", icon: "G", legendLabel: "Garten" },
      {
        name: "Werkzeug",
        color: "#009DA9",
        icon: "W",
        legendLabel: "Werkzeug",
      },
      {
        name: "Elektronik",
        color: "#0093FC",
        icon: "E",
        legendLabel: "Elektronik",
      },
    ],
  },
  map: {
    center: {
      lat: 49.4435,
      lng: 10.9525,
    },
    legendCategories: [
      "Kindersachen",
      "Buecher",
      "Moebel",
      "Vintage",
      "Kleidung",
      "Elektronik",
    ],
  },
  home: {
    title: "Garagenflohmarkt Zirndorf",
    subtitle:
      "Zirndorfer oeffnen Garagen, Hoefe und Gaerten - von Buergern fuer Buerger.",
    steps: [
      {
        num: "1",
        title: "Anmelden",
        text: "Online in 2 Minuten - Adresse eingeben, Kategorien waehlen, fertig.",
      },
      {
        num: "2",
        title: "Auf der Karte sichtbar",
        text: "Dein Stand erscheint automatisch auf der interaktiven Karte.",
      },
      {
        num: "3",
        title: "Verkaufen",
        text: "Am Flohmarkttag oeffnest du Garage, Hof oder Garten fuer Besucher.",
      },
      {
        num: "4",
        title: "Stoebern",
        text: "Besucher filtern nach Kategorie und finden gezielt, was sie suchen.",
      },
    ],
  },
  register: {
    defaults: {
      plz: "90513",
      district: "Kernstadt",
      timeFrom: "10:00",
      timeTo: "16:00",
    },
    timeOptionsFrom: ["09:00", "10:00", "11:00"],
    timeOptionsTo: ["14:00", "15:00", "16:00"],
    rulesHint:
      "Der Verkauf findet auf deinem eigenen Grundstueck statt. Es duerfen nur gebrauchte Gegenstaende verkauft werden. Kein Alkoholausschank, keine Musik.",
    agreementLabel: "Ich habe die Spielregeln gelesen und bin einverstanden.",
  },
  info: {
    dos: [
      "Nur gebrauchte Gegenstaende aus Privatbesitz",
      "Nur auf eigenem Grundstueck (Garage, Hof, Garten)",
      "Kostenlose Teilnahme fuer Verkaeufer und Besucher",
    ],
    donts: [
      "Kein gewerblicher Verkauf, keine Neuware",
      "Kein Alkoholausschank",
      "Keine laute Musik (GEMA-pflichtig)",
      "Keine Staende auf oeffentlichen Gehwegen",
    ],
    faq: [
      {
        q: "Brauche ich eine Genehmigung?",
        a: "Nein. Solange du auf deinem eigenen Grundstueck verkaufst und nur gebrauchte Gegenstaende anbietest, ist keine Genehmigung noetig.",
      },
      {
        q: "Was darf ich verkaufen?",
        a: "Nur gebrauchte Gegenstaende aus Privatbesitz - Kleidung, Buecher, Spielzeug, Moebel, Haushaltswaren etc. Neuware und gewerblicher Verkauf sind nicht erlaubt.",
      },
      {
        q: "Was wenn es regnet?",
        a: "Bei schlechtem Wetter kannst du deinen Stand kurzfristig absagen - einfach ueber den Bearbeitungs-Link in deiner Bestaetigungsmail.",
      },
      {
        q: "Kostet die Teilnahme etwas?",
        a: "Nein, die Teilnahme ist komplett kostenlos - sowohl fuer Verkaeufer als auch fuer Besucher.",
      },
      {
        q: "Wer organisiert den Flohmarkt?",
        a: "Der Garagenflohmarkt wird ehrenamtlich von Zirndorfer Buergern organisiert. Die digitale Plattform wird von Digitales Zirndorf betrieben.",
      },
      {
        q: "Darf ich auf dem Gehweg stehen?",
        a: "Nein, der Verkauf muss auf deinem privaten Grundstueck stattfinden (Garage, Hof, Einfahrt, Garten).",
      },
    ],
    contact: {
      orgName: "Orga-Team Garagenflohmarkt",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer:
        "Eine ehrenamtliche Initiative von Buergern fuer Buerger. Powered by Digitales Zirndorf.",
    },
  },
};
