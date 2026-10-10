/**
 * Multilingual architecture: UI chrome is dictionary-driven (this file),
 * business logic is written once, and CMS/tour content is stored in the
 * database so it can be translated per-locale later without code changes
 * (content_translations-ready design: one translation table away).
 *
 * Initial languages: English, Spanish, French, German, Italian, Dutch, Indonesian.
 */

export const LOCALES = ["en", "es", "fr", "de", "it", "nl", "id"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English", es: "Español", fr: "Français", de: "Deutsch", it: "Italiano", nl: "Nederlands", id: "Bahasa Indonesia",
};

type Dict = Record<string, string>;

const en: Dict = {
  "nav.tours": "Tours", "nav.destinations": "Destinations", "nav.blog": "Travel Blog",
  "nav.forAgencies": "For Agencies", "nav.contact": "Contact", "nav.account": "My Account",
  "nav.signIn": "Sign in", "nav.signUp": "Sign up", "nav.signOut": "Sign out",
  "nav.dashboard": "Dashboard", "nav.language": "Language", "nav.currency": "Currency",
  "hero.title": "Discover Indonesia With Local Experts",
  "hero.subtitle": "Book authentic tours across Bali, Java, Komodo and beyond — operated by verified local guides, priced at local rates.",
  "search.destination": "Destination", "search.date": "Travel date", "search.travelers": "Travellers",
  "search.type": "Tour type", "search.any": "Any", "search.submit": "Search Tours", "search.plan": "Plan My Trip",
  "tour.bookNow": "Book Now", "tour.from": "From", "tour.perPerson": "per person", "tour.duration": "Duration",
  "tour.rating": "Rating", "tour.reviews": "Reviews", "tour.review": "Review", "tour.available": "Available",
  "tour.limited": "Only a few spots left", "tour.soldOut": "Sold out", "tour.closed": "Closed",
  "tour.whatsapp": "Chat on WhatsApp", "tour.customQuote": "Request Custom Quote",
  "tour.overview": "Overview", "tour.highlights": "Highlights", "tour.itinerary": "Full Itinerary",
  "tour.included": "What's Included", "tour.excluded": "What's Excluded", "tour.pickup": "Pickup Information",
  "tour.availability": "Availability", "tour.pricing": "Pricing", "tour.faqs": "FAQs", "tour.map": "Map",
  "tour.similar": "Similar Tours", "tour.selectDate": "Select date", "tour.selectOption": "Select option",
  "tour.travellers": "Travellers", "tour.adults": "Adults", "tour.children": "Children",
  "checkout.title": "Complete your booking", "checkout.contactDetails": "Contact details",
  "checkout.pickup": "Pickup location", "checkout.hotel": "Hotel name", "checkout.special": "Special requests",
  "checkout.liveTotal": "Live total", "checkout.pay": "Continue to payment", "checkout.agree":
    "I agree to the booking terms and cancellation policy",
  "account.bookings": "My bookings", "account.profile": "Profile", "account.voucher": "Voucher",
  "common.loading": "Loading…", "common.save": "Save", "common.cancel": "Cancel", "common.search": "Search",
  "common.price": "Price", "common.date": "Date", "common.status": "Status", "common.all": "All",
  "common.showMore": "Show more", "common.backTo": "Back to", "common.new": "New",
};

const id: Dict = {
  "nav.tours": "Tur", "nav.destinations": "Destinasi", "nav.blog": "Blog Perjalanan",
  "nav.forAgencies": "Untuk Agen", "nav.contact": "Kontak", "nav.account": "Akun Saya",
  "nav.signIn": "Masuk", "nav.signUp": "Daftar", "nav.signOut": "Keluar",
  "nav.dashboard": "Dasbor", "nav.language": "Bahasa", "nav.currency": "Mata Uang",
  "hero.title": "Jelajahi Indonesia Bersama Ahli Lokal",
  "hero.subtitle": "Pesan tur autentik di Bali, Jawa, Komodo dan sekitarnya — dioperasikan oleh pemandu lokal terverifikasi.",
  "search.destination": "Destinasi", "search.date": "Tanggal perjalanan", "search.travelers": "Penumpang",
  "search.type": "Jenis tur", "search.any": "Semua", "search.submit": "Cari Tur", "search.plan": "Rencanakan Perjalanan",
  "tour.bookNow": "Pesan Sekarang", "tour.from": "Mulai", "tour.perPerson": "per orang", "tour.duration": "Durasi",
  "tour.rating": "Rating", "tour.reviews": "Ulasan", "tour.review": "Ulasan", "tour.available": "Tersedia",
  "tour.limited": "Sisa tempat terbatas", "tour.soldOut": "Habis terjual", "tour.closed": "Ditutup",
  "tour.whatsapp": "Chat di WhatsApp", "tour.customQuote": "Minta Penawaran Khusus",
  "tour.overview": "Ringkasan", "tour.highlights": "Sorotan", "tour.itinerary": "Rencana Perjalanan",
  "tour.included": "Termasuk", "tour.excluded": "Tidak Termasuk", "tour.pickup": "Info Penjemputan",
  "tour.availability": "Ketersediaan", "tour.pricing": "Harga", "tour.faqs": "Tanya Jawab", "tour.map": "Peta",
  "tour.similar": "Tur Serupa", "tour.selectDate": "Pilih tanggal", "tour.selectOption": "Pilih opsi",
  "tour.travellers": "Penumpang", "tour.adults": "Dewasa", "tour.children": "Anak",
  "checkout.title": "Selesaikan pemesanan", "checkout.contactDetails": "Data kontak",
  "checkout.pickup": "Lokasi penjemputan", "checkout.hotel": "Nama hotel", "checkout.special": "Permintaan khusus",
  "checkout.liveTotal": "Total", "checkout.pay": "Lanjut ke pembayaran", "checkout.agree": "Saya setuju dengan syarat pemesanan",
  "account.bookings": "Pemesanan saya", "account.profile": "Profil", "account.voucher": "Voucher",
  "common.loading": "Memuat…", "common.save": "Simpan", "common.cancel": "Batal", "common.search": "Cari",
  "common.price": "Harga", "common.date": "Tanggal", "common.status": "Status", "common.all": "Semua",
  "common.showMore": "Lihat lainnya", "common.backTo": "Kembali ke", "common.new": "Baru",
};

const es: Dict = {
  "nav.tours": "Tours", "nav.destinations": "Destinos", "nav.blog": "Blog de viajes",
  "nav.forAgencies": "Para agencias", "nav.contact": "Contacto", "nav.account": "Mi cuenta",
  "nav.signIn": "Iniciar sesión", "nav.signUp": "Registrarse", "nav.signOut": "Cerrar sesión",
  "nav.dashboard": "Panel", "nav.language": "Idioma", "nav.currency": "Moneda",
  "hero.title": "Descubre Indonesia con expertos locales",
  "hero.subtitle": "Reserva tours auténticos por Bali, Komodo y más — operados por guías locales verificados.",
  "search.destination": "Destino", "search.date": "Fecha", "search.travelers": "Viajeros",
  "search.type": "Tipo de tour", "search.any": "Todos", "search.submit": "Buscar tours", "search.plan": "Planear mi viaje",
  "tour.bookNow": "Reservar", "tour.from": "Desde", "tour.perPerson": "por persona", "tour.duration": "Duración",
  "tour.rating": "Valoración", "tour.reviews": "Reseñas", "tour.review": "Reseña", "tour.available": "Disponible",
  "tour.limited": "Quedan pocas plazas", "tour.soldOut": "Agotado", "tour.closed": "Cerrado",
  "tour.whatsapp": "Chatear por WhatsApp", "tour.customQuote": "Pedir presupuesto",
  "tour.overview": "Resumen", "tour.highlights": "Destacados", "tour.itinerary": "Itinerario",
  "tour.included": "Incluido", "tour.excluded": "No incluido", "tour.pickup": "Recogida",
  "tour.availability": "Disponibilidad", "tour.pricing": "Precios", "tour.faqs": "Preguntas", "tour.map": "Mapa",
  "tour.similar": "Tours similares", "tour.selectDate": "Elige fecha", "tour.selectOption": "Elige opción",
  "tour.travellers": "Viajeros", "tour.adults": "Adultos", "tour.children": "Niños",
  "checkout.title": "Completa tu reserva", "checkout.contactDetails": "Datos de contacto",
  "checkout.pickup": "Lugar de recogida", "checkout.hotel": "Hotel", "checkout.special": "Peticiones especiales",
  "checkout.liveTotal": "Total", "checkout.pay": "Continuar al pago", "checkout.agree": "Acepto las condiciones",
  "account.bookings": "Mis reservas", "account.profile": "Perfil", "account.voucher": "Vale",
  "common.loading": "Cargando…", "common.save": "Guardar", "common.cancel": "Cancelar", "common.search": "Buscar",
  "common.price": "Precio", "common.date": "Fecha", "common.status": "Estado", "common.all": "Todos",
  "common.showMore": "Ver más", "common.backTo": "Volver a", "common.new": "Nuevo",
};

const fr: Dict = {
  "nav.tours": "Circuits", "nav.destinations": "Destinations", "nav.blog": "Blog voyage",
  "nav.forAgencies": "Pour les agences", "nav.contact": "Contact", "nav.account": "Mon compte",
  "nav.signIn": "Connexion", "nav.signUp": "S'inscrire", "nav.signOut": "Déconnexion",
  "nav.dashboard": "Tableau de bord", "nav.language": "Langue", "nav.currency": "Devise",
  "hero.title": "Découvrez l'Indonésie avec des experts locaux",
  "hero.subtitle": "Réservez des circuits authentiques à Bali, Komodo et ailleurs — opérés par des guides locaux vérifiés.",
  "search.destination": "Destination", "search.date": "Date", "search.travelers": "Voyageurs",
  "search.type": "Type de circuit", "search.any": "Tous", "search.submit": "Rechercher", "search.plan": "Planifier mon voyage",
  "tour.bookNow": "Réserver", "tour.from": "Dès", "tour.perPerson": "par personne", "tour.duration": "Durée",
  "tour.rating": "Note", "tour.reviews": "Avis", "tour.review": "Avis", "tour.available": "Disponible",
  "tour.limited": "Dernières places", "tour.soldOut": "Complet", "tour.closed": "Fermé",
  "tour.whatsapp": "Discuter sur WhatsApp", "tour.customQuote": "Demander un devis",
  "tour.overview": "Aperçu", "tour.highlights": "Points forts", "tour.itinerary": "Itinéraire",
  "tour.included": "Inclus", "tour.excluded": "Non inclus", "tour.pickup": "Prise en charge",
  "tour.availability": "Disponibilités", "tour.pricing": "Tarifs", "tour.faqs": "FAQ", "tour.map": "Carte",
  "tour.similar": "Circuits similaires", "tour.selectDate": "Choisir une date", "tour.selectOption": "Choisir une option",
  "tour.travellers": "Voyageurs", "tour.adults": "Adultes", "tour.children": "Enfants",
  "checkout.title": "Finalisez votre réservation", "checkout.contactDetails": "Coordonnées",
  "checkout.pickup": "Lieu de prise en charge", "checkout.hotel": "Hôtel", "checkout.special": "Demandes particulières",
  "checkout.liveTotal": "Total", "checkout.pay": "Passer au paiement", "checkout.agree": "J'accepte les conditions",
  "account.bookings": "Mes réservations", "account.profile": "Profil", "account.voucher": "Voucher",
  "common.loading": "Chargement…", "common.save": "Enregistrer", "common.cancel": "Annuler", "common.search": "Rechercher",
  "common.price": "Prix", "common.date": "Date", "common.status": "Statut", "common.all": "Tous",
  "common.showMore": "Voir plus", "common.backTo": "Retour à", "common.new": "Nouveau",
};

const de: Dict = {
  "nav.tours": "Touren", "nav.destinations": "Reiseziele", "nav.blog": "Reiseblog",
  "nav.forAgencies": "Für Agenturen", "nav.contact": "Kontakt", "nav.account": "Mein Konto",
  "nav.signIn": "Anmelden", "nav.signUp": "Registrieren", "nav.signOut": "Abmelden",
  "nav.dashboard": "Dashboard", "nav.language": "Sprache", "nav.currency": "Währung",
  "hero.title": "Entdecke Indonesien mit lokalen Experten",
  "hero.subtitle": "Authentische Touren auf Bali, Komodo & mehr — betrieben von verifizierten lokalen Guides.",
  "search.destination": "Reiseziel", "search.date": "Reisedatum", "search.travelers": "Reisende",
  "search.type": "Tourtyp", "search.any": "Alle", "search.submit": "Touren suchen", "search.plan": "Reise planen",
  "tour.bookNow": "Jetzt buchen", "tour.from": "Ab", "tour.perPerson": "pro Person", "tour.duration": "Dauer",
  "tour.rating": "Bewertung", "tour.reviews": "Bewertungen", "tour.review": "Bewertung", "tour.available": "Verfügbar",
  "tour.limited": "Nur noch wenige Plätze", "tour.soldOut": "Ausgebucht", "tour.closed": "Geschlossen",
  "tour.whatsapp": "Auf WhatsApp chatten", "tour.customQuote": "Angebot anfordern",
  "tour.overview": "Überblick", "tour.highlights": "Höhepunkte", "tour.itinerary": "Reiseverlauf",
  "tour.included": "Inklusive", "tour.excluded": "Nicht inklusive", "tour.pickup": "Abholung",
  "tour.availability": "Verfügbarkeit", "tour.pricing": "Preise", "tour.faqs": "FAQ", "tour.map": "Karte",
  "tour.similar": "Ähnliche Touren", "tour.selectDate": "Datum wählen", "tour.selectOption": "Option wählen",
  "tour.travellers": "Reisende", "tour.adults": "Erwachsene", "tour.children": "Kinder",
  "checkout.title": "Buchung abschließen", "checkout.contactDetails": "Kontaktdaten",
  "checkout.pickup": "Abholort", "checkout.hotel": "Hotel", "checkout.special": "Sonderwünsche",
  "checkout.liveTotal": "Gesamt", "checkout.pay": "Zur Zahlung", "checkout.agree": "Ich akzeptiere die Buchungsbedingungen",
  "account.bookings": "Meine Buchungen", "account.profile": "Profil", "account.voucher": "Gutschein",
  "common.loading": "Lädt…", "common.save": "Speichern", "common.cancel": "Abbrechen", "common.search": "Suchen",
  "common.price": "Preis", "common.date": "Datum", "common.status": "Status", "common.all": "Alle",
  "common.showMore": "Mehr anzeigen", "common.backTo": "Zurück zu", "common.new": "Neu",
};

const it: Dict = {
  "nav.tours": "Tour", "nav.destinations": "Destinazioni", "nav.blog": "Blog di viaggio",
  "nav.forAgencies": "Per agenzie", "nav.contact": "Contatti", "nav.account": "Il mio account",
  "nav.signIn": "Accedi", "nav.signUp": "Registrati", "nav.signOut": "Esci",
  "nav.dashboard": "Pannello", "nav.language": "Lingua", "nav.currency": "Valuta",
  "hero.title": "Scopri l'Indonesia con esperti locali",
  "hero.subtitle": "Prenota tour autentici a Bali, Komodo e oltre — gestiti da guide locali verificate.",
  "search.destination": "Destinazione", "search.date": "Data", "search.travelers": "Viaggiatori",
  "search.type": "Tipo di tour", "search.any": "Tutti", "search.submit": "Cerca tour", "search.plan": "Pianifica il viaggio",
  "tour.bookNow": "Prenota ora", "tour.from": "Da", "tour.perPerson": "a persona", "tour.duration": "Durata",
  "tour.rating": "Voto", "tour.reviews": "Recensioni", "tour.review": "Recensione", "tour.available": "Disponibile",
  "tour.limited": "Ultimi posti", "tour.soldOut": "Esaurito", "tour.closed": "Chiuso",
  "tour.whatsapp": "Chatta su WhatsApp", "tour.customQuote": "Richiedi preventivo",
  "tour.overview": "Panoramica", "tour.highlights": "In evidenza", "tour.itinerary": "Itinerario",
  "tour.included": "Incluso", "tour.excluded": "Non incluso", "tour.pickup": "Ritiro",
  "tour.availability": "Disponibilità", "tour.pricing": "Prezzi", "tour.faqs": "FAQ", "tour.map": "Mappa",
  "tour.similar": "Tour simili", "tour.selectDate": "Scegli data", "tour.selectOption": "Scegli opzione",
  "tour.travellers": "Viaggiatori", "tour.adults": "Adulti", "tour.children": "Bambini",
  "checkout.title": "Completa la prenotazione", "checkout.contactDetails": "Dati di contatto",
  "checkout.pickup": "Luogo di ritiro", "checkout.hotel": "Hotel", "checkout.special": "Richieste speciali",
  "checkout.liveTotal": "Totale", "checkout.pay": "Vai al pagamento", "checkout.agree": "Accetto i termini di prenotazione",
  "account.bookings": "Le mie prenotazioni", "account.profile": "Profilo", "account.voucher": "Voucher",
  "common.loading": "Caricamento…", "common.save": "Salva", "common.cancel": "Annulla", "common.search": "Cerca",
  "common.price": "Prezzo", "common.date": "Data", "common.status": "Stato", "common.all": "Tutti",
  "common.showMore": "Mostra altro", "common.backTo": "Torna a", "common.new": "Nuovo",
};

const nl: Dict = {
  "nav.tours": "Tours", "nav.destinations": "Bestemmingen", "nav.blog": "Reisblog",
  "nav.forAgencies": "Voor bureaus", "nav.contact": "Contact", "nav.account": "Mijn account",
  "nav.signIn": "Inloggen", "nav.signUp": "Registreren", "nav.signOut": "Uitloggen",
  "nav.dashboard": "Dashboard", "nav.language": "Taal", "nav.currency": "Valuta",
  "hero.title": "Ontdek Indonesië met lokale experts",
  "hero.subtitle": "Boek authentieke tours op Bali, Komodo en meer — uitgevoerd door geverifieerde lokale gidsen.",
  "search.destination": "Bestemming", "search.date": "Reisdatum", "search.travelers": "Reizigers",
  "search.type": "Tourtype", "search.any": "Alle", "search.submit": "Zoek tours", "search.plan": "Plan mijn reis",
  "tour.bookNow": "Nu boeken", "tour.from": "Vanaf", "tour.perPerson": "per persoon", "tour.duration": "Duur",
  "tour.rating": "Beoordeling", "tour.reviews": "Beoordelingen", "tour.review": "Beoordeling", "tour.available": "Beschikbaar",
  "tour.limited": "Nog enkele plaatsen", "tour.soldOut": "Uitverkocht", "tour.closed": "Gesloten",
  "tour.whatsapp": "Chat op WhatsApp", "tour.customQuote": "Offerte aanvragen",
  "tour.overview": "Overzicht", "tour.highlights": "Hoogtepunten", "tour.itinerary": "Programma",
  "tour.included": "Inbegrepen", "tour.excluded": "Niet inbegrepen", "tour.pickup": "Ophaalinfo",
  "tour.availability": "Beschikbaarheid", "tour.pricing": "Prijzen", "tour.faqs": "Veelgestelde vragen", "tour.map": "Kaart",
  "tour.similar": "Vergelijkbare tours", "tour.selectDate": "Kies datum", "tour.selectOption": "Kies optie",
  "tour.travellers": "Reizigers", "tour.adults": "Volwassenen", "tour.children": "Kinderen",
  "checkout.title": "Voltooi je boeking", "checkout.contactDetails": "Contactgegevens",
  "checkout.pickup": "Ophaallocatie", "checkout.hotel": "Hotelnaam", "checkout.special": "Speciale verzoeken",
  "checkout.liveTotal": "Totaal", "checkout.pay": "Ga naar betaling", "checkout.agree": "Ik ga akkoord met de boekingsvoorwaarden",
  "account.bookings": "Mijn boekingen", "account.profile": "Profiel", "account.voucher": "Voucher",
  "common.loading": "Laden…", "common.save": "Opslaan", "common.cancel": "Annuleren", "common.search": "Zoeken",
  "common.price": "Prijs", "common.date": "Datum", "common.status": "Status", "common.all": "Alle",
  "common.showMore": "Meer tonen", "common.backTo": "Terug naar", "common.new": "Nieuw",
};

const DICTS: Record<Locale, Dict> = { en, es, fr, de, it, nl, id };

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

export function t(locale: string, key: string): string {
  const l = isLocale(locale) ? locale : "en";
  return DICTS[l][key] ?? DICTS.en[key] ?? key;
}

/**
 * Full translation dictionary for a locale as a plain object — safe to pass
 * from a Server Component into Client Components (functions are not).
 */
export function dictionary(locale: string): Record<string, string> {
  const l = isLocale(locale) ? locale : "en";
  return { ...DICTS.en, ...DICTS[l] };
}
