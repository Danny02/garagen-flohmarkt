import { APP_CONFIG } from "./appConfig.js";

export const API_BASE = import.meta.env.VITE_WORKER_URL ?? "";

const DEV_PREFILL_STANDS = [
  {
    id: 1,
    name: "Familie Mueller",
    address: "Bahnhofstr. 12",
    lat: 49.4425,
    lng: 10.9555,
    categories: ["Kindersachen", "Spielzeug"],
    desc: "Kinderkleidung Gr. 92-140, Lego, Playmobil, Kinderbuecher",
    time: "10:00-16:00",
    district: "Kernstadt",
    open: true,
  },
  {
    id: 2,
    name: "Schmidt u. Nachbarn",
    address: "Rothenburger Str. 45",
    lat: 49.4445,
    lng: 10.952,
    categories: ["Moebel", "Haushalt"],
    desc: "Regale, Geschirr, Kuechengeraete, Lampen",
    time: "10:00-15:00",
    district: "Kernstadt",
    open: true,
  },
  {
    id: 3,
    name: "Flohmarkt Weinzierlein",
    address: "Am Dorfplatz 3",
    lat: 49.451,
    lng: 10.938,
    categories: ["Vintage", "Buecher"],
    desc: "Schallplatten, Vintage-Kleidung, alte Buecher, Retro-Deko",
    time: "09:00-14:00",
    district: "Weinzierlein",
    open: false,
  },
  {
    id: 4,
    name: "Garage Hofmann",
    address: "Anwanderweg 8",
    lat: 49.439,
    lng: 10.96,
    categories: ["Garten", "Werkzeug"],
    desc: "Gartenwerkzeug, Blumentoepfe, Rasenmaeher, Werkzeugkisten",
    time: "10:00-16:00",
    district: "Kernstadt",
    open: true,
  },
  {
    id: 5,
    name: "Wintersdorf-Troedel",
    address: "Wintersdorfer Str. 22",
    lat: 49.435,
    lng: 10.948,
    categories: ["Kindersachen", "Kleidung"],
    desc: "Baby-Erstausstattung, Kinderwagen, Damen-/Herrenkleidung",
    time: "10:00-15:00",
    district: "Wintersdorf",
    open: true,
  },
  {
    id: 6,
    name: "Buecherwurm Zirndorf",
    address: "Fuerther Str. 31",
    lat: 49.443,
    lng: 10.953,
    categories: ["Buecher", "Medien"],
    desc: "Romane, Sachbuecher, DVDs, Brettspiele, Puzzles",
    time: "10:00-16:00",
    district: "Kernstadt",
    open: true,
  },
  {
    id: 7,
    name: "Elektro-Garage Lang",
    address: "Volkhardtstr. 5",
    lat: 49.446,
    lng: 10.957,
    categories: ["Elektronik", "Haushalt"],
    desc: "Alte Handys, Kabel, Kuechenmaschinen, Monitore",
    time: "11:00-15:00",
    district: "Kernstadt",
    open: true,
  },
  {
    id: 8,
    name: "Hof Weber",
    address: "Banderbach 14",
    lat: 49.448,
    lng: 10.942,
    categories: ["Vintage", "Moebel"],
    desc: "Antike Moebel, Porzellan, Oelbilder, Teppiche",
    time: "09:00-16:00",
    district: "Leichendorf",
    open: true,
  },
];

const shouldPrefillExamples =
  import.meta.env.DEV || import.meta.env.MODE === "test";
export const STANDS = shouldPrefillExamples ? DEV_PREFILL_STANDS : [];

export const FILTER_ALL_LABEL = APP_CONFIG.filters.allLabel;

export const STAND_CATEGORIES = APP_CONFIG.catalog.categories.map(
  function (category) {
    return category.name;
  },
);

export const CATEGORIES = [FILTER_ALL_LABEL].concat(STAND_CATEGORIES);
export const DISTRICTS = [FILTER_ALL_LABEL].concat(
  APP_CONFIG.catalog.districts,
);

export const CAT_COLORS = APP_CONFIG.catalog.categories.reduce(function (
  acc,
  category,
) {
  acc[category.name] = category.color;
  return acc;
}, {});

export const CAT_ICONS = APP_CONFIG.catalog.categories.reduce(function (
  acc,
  category,
) {
  acc[category.name] = category.icon;
  return acc;
}, {});

const categoryByName = APP_CONFIG.catalog.categories.reduce(function (
  acc,
  category,
) {
  acc[category.name] = category;
  return acc;
}, {});

export const MAP_LEGEND_ITEMS = APP_CONFIG.map.legendCategories
  .map(function (categoryName) {
    const category = categoryByName[categoryName];
    if (!category) return null;
    return { label: category.legendLabel, color: category.color };
  })
  .filter(Boolean);

function formatEventDate(dateLike) {
  const date = new Date(dateLike);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEventTimeRange(startLike, endLike) {
  const start = new Date(startLike);
  const end = new Date(endLike);
  const startText =
    String(start.getHours()).padStart(2, "0") +
    ":" +
    String(start.getMinutes()).padStart(2, "0");
  const endText =
    String(end.getHours()).padStart(2, "0") +
    ":" +
    String(end.getMinutes()).padStart(2, "0");
  return startText + " - " + endText + " Uhr";
}

export const EVENT_DATE = formatEventDate(APP_CONFIG.event.startAt);
export const EVENT_TIME = formatEventTimeRange(
  APP_CONFIG.event.startAt,
  APP_CONFIG.event.endAt,
);
export const EVENT_AREA = APP_CONFIG.event.areaLabel;
export const EVENT_BADGE_LABEL = APP_CONFIG.event.badgeLabel;

export const HOME_TITLE = APP_CONFIG.home.title;
export const HOME_SUBTITLE = APP_CONFIG.home.subtitle;
export const HOME_STEPS = APP_CONFIG.home.steps;
export const HOME_DISTRICT_COUNT = APP_CONFIG.catalog.districts.length;

export const REGISTER_DEFAULTS = APP_CONFIG.register.defaults;
export const REGISTER_TIME_OPTIONS_FROM = APP_CONFIG.register.timeOptionsFrom;
export const REGISTER_TIME_OPTIONS_TO = APP_CONFIG.register.timeOptionsTo;
export const REGISTER_RULES_HINT = APP_CONFIG.register.rulesHint;
export const REGISTER_AGREEMENT_LABEL = APP_CONFIG.register.agreementLabel;

export const INFO_DOS = APP_CONFIG.info.dos;
export const INFO_DONTS = APP_CONFIG.info.donts;
export const INFO_FAQ = APP_CONFIG.info.faq;
export const INFO_CONTACT = APP_CONFIG.info.contact;

export const MAP_CENTER = APP_CONFIG.map.center;
