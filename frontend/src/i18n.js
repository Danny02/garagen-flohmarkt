const SUPPORTED_LANGUAGES = ["de", "en", "pl", "ro", "ru", "tr", "uk"];

function detectLanguage() {
  if (import.meta.env.MODE === "test") return "de";
  if (typeof navigator === "undefined") return "de";

  const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || "de"];

  for (const candidate of candidates) {
    const short = String(candidate || "").toLowerCase().split("-")[0];
    if (SUPPORTED_LANGUAGES.includes(short)) return short;
  }

  return "de";
}

const CURRENT_LANGUAGE = detectLanguage();

const DICTIONARY = {
  en: {
    "brand.name": "Zirndorf Garage Flea Market",
    "brand.logoAlt": "Zirndorf Garage Flea Market Logo",
    "nav.home": "Home",
    "nav.map": "Map",
    "nav.register": "Register",
    "nav.info": "Info",

    "app.preview": "Experimental prototype — not an official page of the City of Zirndorf and not the official page for the event ‘Zirndorfer Garagen-Flohmarkt’.",
    "app.offlineBanner": "Offline mode: browsing available, registration/editing/deletion disabled.",
    "app.error.sessionExpired": "Passkey session expired. Please sign in again with passkey.",
    "app.error.offline.editDelete": "Offline: registration, editing and deletion require internet access.",
    "app.error.offline.edit": "Offline: editing requires internet access.",
    "app.error.passkeyCheck": "Passkey session could not be verified. Please try again.",
    "app.error.passkeyNotFound": "Passkey not found. Please use the same app URL as during setup or set up the passkey again via your edit link.",
    "app.error.passkeyVerify": "Passkey could not be verified. Please try again; if it still fails, set up the passkey again.",
    "app.error.challengeExpired": "Sign-in expired. Please tap ‘Sign in with passkey’ again.",
    "app.error.ownStandsLoad": "Your stands could not be loaded",
    "app.error.noStandsForPasskey": "No stands found for this passkey",
    "app.error.offline.delete": "Offline: deleting requires internet access.",
    "app.confirm.delete": "Delete stand now?",
    "app.error.noValidAccessDelete": "No valid permission available for deletion",
    "app.error.deleteFailed": "Deletion failed",
    "app.error.offline.register": "Offline: registration requires internet access.",

    "home.cta.map": "Discover stands on the map",
    "home.cta.register": "Register your own stand",
    "home.offlineHint": "Offline: registration, editing and deletion require internet access.",
    "home.howItWorks": "How it works",
    "home.metric.stands": "Stands",
    "home.metric.districts": "Districts",

    "mystands.title": "My registered stand",
    "mystands.edit": "Edit",
    "mystands.passkeyLogin": "Sign in with passkey",
    "mystands.editLinkHint": "Open edit link to edit",
    "mystands.delete": "Delete stand",
    "mystands.none": "No stand saved on this device yet",
    "mystands.offlineHint": "Offline: editing and deleting are currently disabled.",

    "map.standFallback": "Stand",
    "map.timeFallback": "Time coming soon",
    "map.activity.closed": "Stand closed (flag)",
    "map.activity.open": "Stand open",
    "map.activity.openInTime": "Stand open (within time window)",
    "map.activity.outsideTime": "Stand outside time window",
    "map.route.enableLocation": "Enable your location first.",
    "map.location.unavailable": "Location unavailable",
    "map.location.blocked": "Location access blocked",
    "map.route.none": "No walking route found.",
    "map.header.title": "Interactive map",
    "map.header.subtitle": "{count} stands found",
    "map.filter.toggle.show": "show",
    "map.filter.toggle.hide": "hide",
    "map.filter.toggle.active": "(active)",
    "map.filter.prefix": "Filter",
    "map.filter.category": "Category",
    "map.filter.district": "District",
    "map.legend.title": "Legend:",
    "map.legend.myLocation": "My location",
    "map.legend.route": "Walking route",
    "map.list.all": "All stands ({count})",
    "map.location.youAreHere": "You are here",
    "map.location.label": "Location: {address}",
    "map.status.open": "Open",
    "map.status.closed": "Closed",
    "map.time.label": "Time: {time} | {district}",
    "map.route.loading": "Calculating route...",
    "map.route.button": "Route here",
    "map.navigation.open": "Open navigation",

    "register.error.title": "Error",
    "register.error.message": "Something went wrong. Please try again or contact the organizing team.",
    "register.back": "Back",
    "register.saved.title": "Changes saved",
    "register.saved.subtitle": "Stand updated!",
    "register.saved.message": "Your changes were saved and will appear on the map shortly.",
    "register.title.create": "Register stand",
    "register.title.edit": "Edit stand",
    "register.step": "Step {step} of 3",
    "register.section.location": "Location",
    "register.location.hint": "Address only – no name, no e-mail.",
    "register.address": "Street & house number *",
    "register.address.placeholder": "e.g. Bahnhofstr. 12",
    "register.zip": "ZIP",
    "register.district": "District",
    "register.label": "Label",
    "register.optional": "(optional)",
    "register.label.hint": "e.g. ‘Garden flea market’ – no real name needed",
    "register.label.placeholder": "e.g. Garden flea market, cellar treasures…",
    "register.offer.title": "What are you offering?",
    "register.offer.hint": "Choose matching categories (multiple choice)",
    "register.desc": "Short description",
    "register.desc.placeholder": "e.g. Kids clothes size 92-140, Playmobil...",
    "register.when.title": "When are you participating?",
    "register.when.dateHint": "The flea market takes place on {date}.",
    "register.from": "From",
    "register.to": "To",
    "register.important": "Important:",
    "register.hour": "o'clock",
    "register.submit.loading": "Submitting…",
    "register.submit.next": "Next",
    "register.submit.save": "Save changes",
    "register.submit.create": "Register now",

    "success.title": "Registration successful!",
    "success.heading": "You're in!",
    "success.message": "Your stand will appear on the map after a short review.",
    "success.link.title": "Save your edit link",
    "success.link.hint": "Your browser has already saved this stand. The link is your backup – e.g. for other devices.",
    "success.link.copy": "Copy link",
    "success.link.copied": "Link copied!",
    "success.passkey.title": "Set up passkey (recommended)",
    "success.passkey.hint": "With a passkey, you can edit your stand on other devices as well – without the link.",
    "success.passkey.setup": "Set up passkey now",
    "success.passkey.wait": "Waiting for device…",
    "success.passkey.done": "Passkey configured!",
    "success.passkey.error": "Error while setting up passkey",
    "success.registration": "Your registration",
    "success.time": "Time: {from} – {to}",
    "success.categories": "Categories: {categories}",

    "info.title": "Info and FAQ",
    "info.subtitle": "Everything you need to know",
    "info.dos": "Dos",
    "info.donts": "Don'ts",
    "info.faq": "Frequently asked questions",
    "info.contact": "Contact",
    "info.mail": "E-mail",

    "category.Kindersachen": "Kids items",
    "category.Spielzeug": "Toys",
    "category.Bücher": "Books",
    "category.Medien": "Media",
    "category.Möbel": "Furniture",
    "category.Haushalt": "Household",
    "category.Vintage": "Vintage",
    "category.Kleidung": "Clothing",
    "category.Garten": "Garden",
    "category.Werkzeug": "Tools",
    "category.Elektronik": "Electronics",
    "district.Kernstadt": "City center",
    "district.Weinzierlein": "Weinzierlein",
    "district.Wintersdorf": "Wintersdorf",
    "district.Leichendorf": "Leichendorf"
  },
  pl: {
    "brand.name": "Zirndorfer Garagen-Flohmarkt",
    "brand.logoAlt": "Logo Zirndorfer Garagen-Flohmarkt",
    "nav.home": "Start",
    "nav.map": "Mapa",
    "nav.register": "Zgłoś",
    "nav.info": "Info",
    "app.preview": "Prototyp eksperymentalny — to nie jest oficjalna strona miasta Zirndorf ani oficjalna strona wydarzenia „Zirndorfer Garagen-Flohmarkt”.",
    "app.offlineBanner": "Tryb offline: przeglądanie dostępne, zgłaszanie/edycja/usuwanie wyłączone.",
    "home.cta.map": "Odkryj stoiska na mapie",
    "home.cta.register": "Zgłoś własne stoisko",
    "home.offlineHint": "Offline: zgłaszanie, edycja i usuwanie wymagają internetu.",
    "home.howItWorks": "Jak to działa",
    "home.metric.stands": "Stoiska",
    "home.metric.districts": "Dzielnice",
    "map.header.title": "Interaktywna mapa",
    "map.header.subtitle": "Znaleziono stoisk: {count}",
    "map.filter.prefix": "Filtr",
    "map.filter.toggle.show": "pokaż",
    "map.filter.toggle.hide": "ukryj",
    "map.filter.toggle.active": "(aktywny)",
    "map.filter.category": "Kategoria",
    "map.filter.district": "Dzielnica",
    "map.legend.title": "Legenda:",
    "map.legend.myLocation": "Moja lokalizacja",
    "map.legend.route": "Trasa piesza",
    "map.list.all": "Wszystkie stoiska ({count})",
    "map.navigation.open": "Otwórz nawigację",
    "register.title.create": "Zgłoś stoisko",
    "register.title.edit": "Edytuj stoisko",
    "register.step": "Krok {step} z 3",
    "register.submit.next": "Dalej",
    "register.submit.create": "Zgłoś teraz",
    "register.submit.save": "Zapisz zmiany",
    "register.back": "Wstecz",
    "success.title": "Rejestracja zakończona!",
    "success.heading": "Jesteś na liście!",
    "success.link.copy": "Skopiuj link",
    "success.link.copied": "Link skopiowany!",
    "info.title": "Informacje i FAQ",
    "info.subtitle": "Wszystko, co musisz wiedzieć",
    "info.dos": "Dozwolone",
    "info.donts": "Niedozwolone",
    "info.faq": "Najczęstsze pytania",
    "info.contact": "Kontakt",
    "info.mail": "E-mail"
  },
  ro: {
    "brand.name": "Zirndorfer Garagen-Flohmarkt",
    "brand.logoAlt": "Logo Zirndorfer Garagen-Flohmarkt",
    "nav.home": "Acasă",
    "nav.map": "Hartă",
    "nav.register": "Înregistrare",
    "nav.info": "Info",
    "app.preview": "Prototip experimental — aceasta nu este o pagină oficială a orașului Zirndorf și nici pagina oficială a evenimentului „Zirndorfer Garagen-Flohmarkt”.",
    "app.offlineBanner": "Mod offline: navigarea este disponibilă, înregistrarea/editarea/ștergerea sunt dezactivate.",
    "home.cta.map": "Descoperă standuri pe hartă",
    "home.cta.register": "Înregistrează propriul stand",
    "home.offlineHint": "Offline: înregistrarea, editarea și ștergerea necesită internet.",
    "home.howItWorks": "Cum funcționează",
    "home.metric.stands": "Standuri",
    "home.metric.districts": "Cartiere",
    "map.header.title": "Hartă interactivă",
    "map.header.subtitle": "{count} standuri găsite",
    "register.title.create": "Înregistrează stand",
    "register.title.edit": "Editează stand",
    "register.step": "Pasul {step} din 3",
    "register.submit.next": "Continuă",
    "register.submit.create": "Înregistrează acum",
    "register.submit.save": "Salvează modificările",
    "register.back": "Înapoi",
    "success.title": "Înregistrare reușită!",
    "success.heading": "Ești înscris!",
    "info.title": "Informații și FAQ",
    "info.subtitle": "Tot ce trebuie să știi"
  },
  ru: {
    "brand.name": "Zirndorfer Garagen-Flohmarkt",
    "brand.logoAlt": "Логотип Zirndorfer Garagen-Flohmarkt",
    "nav.home": "Главная",
    "nav.map": "Карта",
    "nav.register": "Регистрация",
    "nav.info": "Инфо",
    "app.preview": "Экспериментальный прототип — это не официальный сайт города Цирндорф и не официальная страница мероприятия «Zirndorfer Garagen-Flohmarkt».",
    "app.offlineBanner": "Оффлайн-режим: просмотр доступен, регистрация/редактирование/удаление отключены.",
    "home.cta.map": "Открыть точки на карте",
    "home.cta.register": "Зарегистрировать свою точку",
    "home.offlineHint": "Оффлайн: регистрация, редактирование и удаление требуют интернет.",
    "home.howItWorks": "Как это работает",
    "home.metric.stands": "Точки",
    "home.metric.districts": "Районы",
    "map.header.title": "Интерактивная карта",
    "map.header.subtitle": "Найдено точек: {count}",
    "register.title.create": "Зарегистрировать точку",
    "register.title.edit": "Редактировать точку",
    "register.step": "Шаг {step} из 3",
    "register.submit.next": "Далее",
    "register.submit.create": "Зарегистрировать",
    "register.submit.save": "Сохранить изменения",
    "register.back": "Назад",
    "success.title": "Регистрация успешна!",
    "success.heading": "Вы участвуете!",
    "info.title": "Информация и FAQ",
    "info.subtitle": "Всё, что нужно знать"
  },
  tr: {
    "brand.name": "Zirndorfer Garagen-Flohmarkt",
    "brand.logoAlt": "Zirndorfer Garagen-Flohmarkt logosu",
    "nav.home": "Ana sayfa",
    "nav.map": "Harita",
    "nav.register": "Kayıt",
    "nav.info": "Bilgi",
    "app.preview": "Deneysel prototip — bu, Zirndorf şehrinin resmi sayfası veya ‘Zirndorfer Garagen-Flohmarkt’ etkinliğinin resmi sayfası değildir.",
    "app.offlineBanner": "Çevrimdışı mod: görüntüleme açık, kayıt/düzenleme/silme kapalı.",
    "home.cta.map": "Haritada stantları keşfet",
    "home.cta.register": "Kendi standını kaydet",
    "home.offlineHint": "Çevrimdışı: kayıt, düzenleme ve silme için internet gerekir.",
    "home.howItWorks": "Nasıl çalışır",
    "home.metric.stands": "Stant",
    "home.metric.districts": "Mahalle",
    "map.header.title": "Etkileşimli harita",
    "map.header.subtitle": "{count} stant bulundu",
    "register.title.create": "Stand kaydı",
    "register.title.edit": "Standı düzenle",
    "register.step": "Adım {step} / 3",
    "register.submit.next": "İleri",
    "register.submit.create": "Şimdi kaydet",
    "register.submit.save": "Değişiklikleri kaydet",
    "register.back": "Geri",
    "success.title": "Kayıt başarılı!",
    "success.heading": "Katıldın!",
    "info.title": "Bilgiler ve SSS",
    "info.subtitle": "Bilmeniz gereken her şey"
  },
  uk: {
    "brand.name": "Zirndorfer Garagen-Flohmarkt",
    "brand.logoAlt": "Логотип Zirndorfer Garagen-Flohmarkt",
    "nav.home": "Головна",
    "nav.map": "Карта",
    "nav.register": "Реєстрація",
    "nav.info": "Інфо",
    "app.preview": "Експериментальний прототип — це не офіційна сторінка міста Цирндорф і не офіційна сторінка події «Zirndorfer Garagen-Flohmarkt».",
    "app.offlineBanner": "Офлайн-режим: перегляд доступний, реєстрацію/редагування/видалення вимкнено.",
    "home.cta.map": "Переглянути точки на карті",
    "home.cta.register": "Зареєструвати власну точку",
    "home.offlineHint": "Офлайн: реєстрація, редагування та видалення потребують інтернету.",
    "home.howItWorks": "Як це працює",
    "home.metric.stands": "Точки",
    "home.metric.districts": "Райони",
    "map.header.title": "Інтерактивна карта",
    "map.header.subtitle": "Знайдено точок: {count}",
    "register.title.create": "Зареєструвати точку",
    "register.title.edit": "Редагувати точку",
    "register.step": "Крок {step} з 3",
    "register.submit.next": "Далі",
    "register.submit.create": "Зареєструвати",
    "register.submit.save": "Зберегти зміни",
    "register.back": "Назад",
    "success.title": "Реєстрація успішна!",
    "success.heading": "Ви берете участь!",
    "info.title": "Інформація та FAQ",
    "info.subtitle": "Усе, що потрібно знати"
  }
};

const CONTENT = {
  de: {
    homeSubtitle: "Zirndorfer öffnen Garagen, Höfe und Gärten — von Bürgern für Bürger.",
    homeSteps: [
      { num: "1", title: "Anmelden", text: "Online in 2 Minuten — Adresse eingeben, Kategorien wählen, fertig." },
      { num: "2", title: "Auf der Karte sichtbar", text: "Dein Stand erscheint automatisch auf der interaktiven Karte." },
      { num: "3", title: "Verkaufen", text: "Am Flohmarkttag öffnest du Garage, Hof oder Garten für Besucher." },
      { num: "4", title: "Stöbern", text: "Besucher filtern nach Kategorie und finden gezielt, was sie suchen." }
    ],
    registerRulesHint: "Der Verkauf findet auf deinem eigenen Grundstück statt. Es dürfen nur gebrauchte Gegenstände verkauft werden. Kein Alkoholausschank, keine Musik.",
    registerAgreementLabel: "Ich habe die Spielregeln gelesen und bin einverstanden.",
    infoDos: [
      "Nur gebrauchte Gegenstände aus Privatbesitz",
      "Nur auf eigenem Grundstück (Garage, Hof, Garten)",
      "Kostenlose Teilnahme für Verkäufer und Besucher"
    ],
    infoDonts: [
      "Kein gewerblicher Verkauf, keine Neuware",
      "Kein Alkoholausschank",
      "Keine laute Musik (GEMA-pflichtig)",
      "Keine Stände auf öffentlichen Gehwegen"
    ],
    infoFaq: [
      { q: "Brauche ich eine Genehmigung?", a: "Nein. Solange du auf deinem eigenen Grundstück verkaufst und nur gebrauchte Gegenstände anbietest, ist keine Genehmigung nötig." },
      { q: "Was darf ich verkaufen?", a: "Nur gebrauchte Gegenstände aus Privatbesitz — Kleidung, Bücher, Spielzeug, Möbel, Haushaltswaren etc. Neuware und gewerblicher Verkauf sind nicht erlaubt." },
      { q: "Was wenn es regnet?", a: "Bei schlechtem Wetter kannst du deinen Stand kurzfristig absagen — einfach über den Bearbeitungs-Link in deiner Bestätigungsmail." },
      { q: "Kostet die Teilnahme etwas?", a: "Nein, die Teilnahme ist komplett kostenlos — sowohl für Verkäufer als auch für Besucher." },
      { q: "Wer organisiert den Flohmarkt?", a: "Der Garagenflohmarkt wird ehrenamtlich von Zirndorfer Bürgern organisiert. Die digitale Plattform wird von Digitales Zirndorf betrieben." },
      { q: "Darf ich auf dem Gehweg stehen?", a: "Nein, der Verkauf muss auf deinem privaten Grundstück stattfinden (Garage, Hof, Einfahrt, Garten)." }
    ],
    infoContact: {
      orgName: "Orga-Team Garagenflohmarkt",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer: "Eine ehrenamtliche Initiative von Bürgern für Bürger. Powered by Digitales Zirndorf."
    }
  },
  en: {
    homeSubtitle: "Residents of Zirndorf open garages, courtyards and gardens — by citizens for citizens.",
    homeSteps: [
      { num: "1", title: "Register", text: "Online in 2 minutes — enter address, choose categories, done." },
      { num: "2", title: "Visible on map", text: "Your stand appears automatically on the interactive map." },
      { num: "3", title: "Sell", text: "On event day, open your garage, yard or garden for visitors." },
      { num: "4", title: "Browse", text: "Visitors filter by category and find what they are looking for." }
    ],
    registerRulesHint: "Sales take place on your private property. Only used items are allowed. No alcohol, no music.",
    registerAgreementLabel: "I have read the rules and agree.",
    infoDos: [
      "Only used private items",
      "Only on your own property (garage, courtyard, garden)",
      "Participation is free for sellers and visitors"
    ],
    infoDonts: [
      "No commercial sales, no new goods",
      "No alcohol service",
      "No loud music (subject to licensing)",
      "No stands on public sidewalks"
    ],
    infoFaq: [
      { q: "Do I need a permit?", a: "No. As long as you sell on your own property and only offer used items, no permit is required." },
      { q: "What may I sell?", a: "Only used private items — clothing, books, toys, furniture, household goods etc." },
      { q: "What if it rains?", a: "In bad weather, you can cancel at short notice via your edit link." },
      { q: "Does participation cost anything?", a: "No, participation is completely free." },
      { q: "Who organizes the flea market?", a: "The garage flea market is organized voluntarily by citizens of Zirndorf." },
      { q: "Can I sell on the sidewalk?", a: "No, selling must take place on your private property." }
    ],
    infoContact: {
      orgName: "Garage Flea Market Team",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer: "A voluntary civic initiative. Powered by Digitales Zirndorf."
    }
  },
  pl: {
    homeSubtitle: "Mieszkańcy Zirndorfu otwierają garaże, podwórka i ogrody — od mieszkańców dla mieszkańców.",
    homeSteps: [
      { num: "1", title: "Rejestracja", text: "Online w 2 minuty — wpisz adres, wybierz kategorie i gotowe." },
      { num: "2", title: "Widoczność na mapie", text: "Twoje stoisko automatycznie pojawi się na interaktywnej mapie." },
      { num: "3", title: "Sprzedaż", text: "W dniu wydarzenia otwierasz garaż, podwórko lub ogród dla odwiedzających." },
      { num: "4", title: "Przeglądanie", text: "Odwiedzający filtrują kategorie i łatwo znajdują to, czego szukają." }
    ],
    registerRulesHint: "Sprzedaż odbywa się na Twoim prywatnym terenie. Dozwolone są tylko rzeczy używane. Bez alkoholu i bez muzyki.",
    registerAgreementLabel: "Przeczytałem/am zasady i akceptuję je.",
    infoDos: [
      "Tylko używane przedmioty prywatne",
      "Tylko na własnej posesji (garaż, podwórko, ogród)",
      "Udział jest bezpłatny dla sprzedających i odwiedzających"
    ],
    infoDonts: [
      "Brak sprzedaży komercyjnej i nowego towaru",
      "Zakaz sprzedaży alkoholu",
      "Brak głośnej muzyki",
      "Brak stoisk na publicznych chodnikach"
    ],
    infoFaq: [
      { q: "Czy potrzebuję zezwolenia?", a: "Nie. Jeśli sprzedajesz na własnej posesji i tylko rzeczy używane, zezwolenie nie jest potrzebne." },
      { q: "Co mogę sprzedawać?", a: "Tylko używane rzeczy prywatne — ubrania, książki, zabawki, meble, artykuły domowe itp." },
      { q: "Co jeśli będzie padać?", a: "Przy złej pogodzie możesz odwołać udział w ostatniej chwili przez link edycji." },
      { q: "Czy udział jest płatny?", a: "Nie, udział jest całkowicie bezpłatny." },
      { q: "Kto organizuje pchli targ?", a: "Pchli targ garażowy jest organizowany społecznie przez mieszkańców Zirndorfu." },
      { q: "Czy mogę stać na chodniku?", a: "Nie, sprzedaż musi odbywać się na prywatnej posesji." }
    ],
    infoContact: {
      orgName: "Zespół Garagen-Flohmarkt",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer: "Społeczna inicjatywa mieszkańców. Powered by Digitales Zirndorf."
    }
  },
  ro: {
    homeSubtitle: "Locuitorii din Zirndorf deschid garaje, curți și grădini — de la cetățeni pentru cetățeni.",
    homeSteps: [
      { num: "1", title: "Înregistrare", text: "Online în 2 minute — introdu adresa, alege categoriile și gata." },
      { num: "2", title: "Vizibil pe hartă", text: "Standul tău apare automat pe harta interactivă." },
      { num: "3", title: "Vinde", text: "În ziua evenimentului îți deschizi garajul, curtea sau grădina pentru vizitatori." },
      { num: "4", title: "Explorează", text: "Vizitatorii filtrează după categorie și găsesc exact ce caută." }
    ],
    registerRulesHint: "Vânzarea are loc pe proprietatea ta privată. Sunt permise doar obiecte second-hand. Fără alcool, fără muzică.",
    registerAgreementLabel: "Am citit regulile și sunt de acord.",
    infoDos: [
      "Doar obiecte folosite din proprietate personală",
      "Doar pe proprietate proprie (garaj, curte, grădină)",
      "Participarea este gratuită pentru vânzători și vizitatori"
    ],
    infoDonts: [
      "Fără vânzare comercială, fără produse noi",
      "Fără vânzare de alcool",
      "Fără muzică tare",
      "Fără standuri pe trotuarele publice"
    ],
    infoFaq: [
      { q: "Am nevoie de autorizație?", a: "Nu. Dacă vinzi pe proprietatea ta și doar obiecte folosite, nu ai nevoie de autorizație." },
      { q: "Ce pot vinde?", a: "Doar obiecte folosite din proprietate personală — haine, cărți, jucării, mobilier, articole de uz casnic etc." },
      { q: "Ce se întâmplă dacă plouă?", a: "În caz de vreme rea poți anula în ultimul moment prin linkul de editare." },
      { q: "Participarea costă?", a: "Nu, participarea este complet gratuită." },
      { q: "Cine organizează târgul?", a: "Târgul de garaj este organizat voluntar de cetățenii din Zirndorf." },
      { q: "Pot vinde pe trotuar?", a: "Nu, vânzarea trebuie să aibă loc pe proprietatea privată." }
    ],
    infoContact: {
      orgName: "Echipa Garagen-Flohmarkt",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer: "Inițiativă civică voluntară. Powered by Digitales Zirndorf."
    }
  },
  ru: {
    homeSubtitle: "Жители Цирндорфа открывают гаражи, дворы и сады — от жителей для жителей.",
    homeSteps: [
      { num: "1", title: "Регистрация", text: "Онлайн за 2 минуты — укажите адрес, выберите категории, готово." },
      { num: "2", title: "На карте", text: "Ваша точка автоматически появится на интерактивной карте." },
      { num: "3", title: "Продажа", text: "В день мероприятия вы открываете гараж, двор или сад для посетителей." },
      { num: "4", title: "Поиск", text: "Посетители фильтруют по категориям и находят нужное быстрее." }
    ],
    registerRulesHint: "Продажа проходит на вашей частной территории. Разрешены только б/у вещи. Без алкоголя и музыки.",
    registerAgreementLabel: "Я прочитал(а) правила и согласен(на).",
    infoDos: [
      "Только бывшие в употреблении личные вещи",
      "Только на частной территории (гараж, двор, сад)",
      "Участие бесплатно для продавцов и посетителей"
    ],
    infoDonts: [
      "Без коммерческой торговли и новых товаров",
      "Без продажи алкоголя",
      "Без громкой музыки",
      "Без точек на общественных тротуарах"
    ],
    infoFaq: [
      { q: "Нужно ли разрешение?", a: "Нет. Если вы продаёте на своей территории и только б/у вещи, разрешение не нужно." },
      { q: "Что можно продавать?", a: "Только бывшие в употреблении личные вещи — одежду, книги, игрушки, мебель, товары для дома и т.д." },
      { q: "Что если пойдёт дождь?", a: "При плохой погоде вы можете отменить участие в последний момент через ссылку редактирования." },
      { q: "Участие платное?", a: "Нет, участие полностью бесплатное." },
      { q: "Кто организует ярмарку?", a: "Гаражная ярмарка организуется на добровольной основе жителями Цирндорфа." },
      { q: "Можно торговать на тротуаре?", a: "Нет, продажа должна проходить на частной территории." }
    ],
    infoContact: {
      orgName: "Команда Garagen-Flohmarkt",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer: "Добровольная гражданская инициатива. Powered by Digitales Zirndorf."
    }
  },
  tr: {
    homeSubtitle: "Zirndorf sakinleri garajlarını, avlularını ve bahçelerini açıyor — vatandaşlardan vatandaşlara.",
    homeSteps: [
      { num: "1", title: "Kayıt", text: "2 dakikada çevrim içi — adresi gir, kategorileri seç, tamam." },
      { num: "2", title: "Haritada görünür", text: "Standın etkileşimli haritada otomatik olarak görünür." },
      { num: "3", title: "Satış", text: "Etkinlik gününde garajını, avlunu veya bahçeni ziyaretçilere açarsın." },
      { num: "4", title: "Keşif", text: "Ziyaretçiler kategoriye göre filtreleyip aradığını kolayca bulur." }
    ],
    registerRulesHint: "Satış özel mülkünde yapılır. Yalnızca ikinci el ürünlere izin verilir. Alkol ve müzik yok.",
    registerAgreementLabel: "Kuralları okudum ve kabul ediyorum.",
    infoDos: [
      "Sadece kişisel ikinci el eşyalar",
      "Sadece kendi mülkünde (garaj, avlu, bahçe)",
      "Satıcılar ve ziyaretçiler için ücretsiz katılım"
    ],
    infoDonts: [
      "Ticari satış ve yeni ürün yok",
      "Alkol satışı yok",
      "Yüksek sesli müzik yok",
      "Kamusal kaldırımlarda stand yok"
    ],
    infoFaq: [
      { q: "İzin gerekli mi?", a: "Hayır. Kendi mülkünde satış yapıyor ve yalnızca ikinci el ürün sunuyorsan izin gerekmez." },
      { q: "Neler satabilirim?", a: "Yalnızca kişisel ikinci el eşyalar — kıyafet, kitap, oyuncak, mobilya, ev eşyası vb." },
      { q: "Yağmur yağarsa ne olur?", a: "Kötü havada düzenleme bağlantın üzerinden kısa sürede iptal edebilirsin." },
      { q: "Katılım ücretli mi?", a: "Hayır, katılım tamamen ücretsizdir." },
      { q: "Etkinliği kim düzenliyor?", a: "Garaj bit pazarı Zirndorf vatandaşları tarafından gönüllü olarak düzenlenir." },
      { q: "Kaldırımda satış yapabilir miyim?", a: "Hayır, satış özel mülkte yapılmalıdır." }
    ],
    infoContact: {
      orgName: "Garagen-Flohmarkt Ekibi",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer: "Gönüllü bir yurttaş girişimi. Powered by Digitales Zirndorf."
    }
  },
  uk: {
    homeSubtitle: "Жителі Цирндорфа відкривають гаражі, подвір’я та сади — від мешканців для мешканців.",
    homeSteps: [
      { num: "1", title: "Реєстрація", text: "Онлайн за 2 хвилини — введіть адресу, виберіть категорії, готово." },
      { num: "2", title: "Видно на мапі", text: "Ваш стенд автоматично з’явиться на інтерактивній мапі." },
      { num: "3", title: "Продаж", text: "У день події ви відкриваєте гараж, подвір’я або сад для відвідувачів." },
      { num: "4", title: "Пошук", text: "Відвідувачі фільтрують за категоріями та швидко знаходять потрібне." }
    ],
    registerRulesHint: "Продаж відбувається на вашій приватній території. Дозволені лише вживані речі. Без алкоголю та музики.",
    registerAgreementLabel: "Я прочитав/ла правила і погоджуюся.",
    infoDos: [
      "Лише вживані особисті речі",
      "Лише на власній території (гараж, подвір’я, сад)",
      "Безкоштовна участь для продавців і відвідувачів"
    ],
    infoDonts: [
      "Без комерційного продажу та нових товарів",
      "Без продажу алкоголю",
      "Без гучної музики",
      "Без стендів на громадських тротуарах"
    ],
    infoFaq: [
      { q: "Чи потрібен дозвіл?", a: "Ні. Якщо ви продаєте на власній території і лише вживані речі, дозвіл не потрібен." },
      { q: "Що можна продавати?", a: "Лише вживані особисті речі — одяг, книжки, іграшки, меблі, товари для дому тощо." },
      { q: "Що робити, якщо дощ?", a: "За поганої погоди ви можете швидко скасувати участь через посилання редагування." },
      { q: "Участь платна?", a: "Ні, участь повністю безкоштовна." },
      { q: "Хто організовує ярмарок?", a: "Гаражний блошиний ринок організовується на волонтерських засадах мешканцями Цирндорфа." },
      { q: "Чи можна торгувати на тротуарі?", a: "Ні, продаж має відбуватися на приватній території." }
    ],
    infoContact: {
      orgName: "Команда Garagen-Flohmarkt",
      email: "flohmarkt@digitales-zirndorf.de",
      web: "digitales-zirndorf.de",
      footer: "Волонтерська громадська ініціатива. Powered by Digitales Zirndorf."
    }
  }
};

function interpolate(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, function (_, key) {
    return vars && vars[key] !== undefined ? String(vars[key]) : "";
  });
}

export function getLanguage() {
  return CURRENT_LANGUAGE;
}

export function t(key, vars, fallback) {
  const langDict = DICTIONARY[CURRENT_LANGUAGE] || {};
  const value = langDict[key] ?? fallback ?? key;
  return interpolate(value, vars);
}

export function translateCategory(name) {
  const key = "category." + name;
  const translated = t(key);
  return translated === key ? name : translated;
}

export function translateDistrict(name) {
  const key = "district." + name;
  const translated = t(key);
  return translated === key ? name : translated;
}

export function getContent() {
  return CONTENT[CURRENT_LANGUAGE] || null;
}

export function localizeList(list, path) {
  const content = getContent();
  if (!content || !Array.isArray(content[path])) return list;
  return content[path];
}

export function localizeObject(value, path) {
  const content = getContent();
  if (!content || !content[path]) return value;
  return content[path];
}
