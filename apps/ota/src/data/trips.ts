import type { StaticImageData } from "next/image";

import destinationGreece from "@/assets/destination-greece.jpg";
import destinationJapan from "@/assets/destination-japan.jpg";
import destinationMaldives from "@/assets/destination-maldives.jpg";
import heroItaly from "@/assets/hero-italy.jpg";
import heroTropical from "@/assets/hero-tropical.jpg";

export type Trip = {
  id: string;
  slug: string;
  title: string;
  location: string;
  region: string;
  type: "Luxury" | "Adventure" | "Family" | "Relaxation" | "Cultural";
  durationNights: number;
  priceFrom: number;
  rating: number;
  summary: string;
  tags: string[];
  image: StaticImageData;
};

export const trips: Trip[] = [
  {
    id: "santorini-signature",
    slug: "santorini-signature",
    title: "Signature Santorini Escape",
    location: "Santorini, Greece",
    region: "Europe",
    type: "Luxury",
    durationNights: 7,
    priceFrom: 1299,
    rating: 4.9,
    summary: "Cliffside suites, catamaran sunset sail, and winery tastings above the caldera.",
    tags: ["Sunset", "Wine", "Catamaran"],
    image: destinationGreece,
  },
  {
    id: "kyoto-heritage",
    slug: "kyoto-heritage",
    title: "Kyoto Heritage Pathways",
    location: "Kyoto, Japan",
    region: "Asia",
    type: "Cultural",
    durationNights: 9,
    priceFrom: 1599,
    rating: 4.8,
    summary: "Ryokan stay, guided temple circuit, tea ceremony, and Arashiyama bamboo grove.",
    tags: ["Temples", "Tea Ceremony", "Ryokan"],
    image: destinationJapan,
  },
  {
    id: "maldives-overwater",
    slug: "maldives-overwater",
    title: "Maldives Overwater Retreat",
    location: "North Malé Atoll, Maldives",
    region: "Indian Ocean",
    type: "Relaxation",
    durationNights: 6,
    priceFrom: 2199,
    rating: 5.0,
    summary: "Overwater villa with plunge pool, seaplane transfers, reef snorkel, and sandbank dinner.",
    tags: ["Overwater", "Snorkel", "Seaplane"],
    image: destinationMaldives,
  },
  {
    id: "tuscan-tableau",
    slug: "tuscan-tableau",
    title: "Tuscan Tableaux",
    location: "Florence & Chianti, Italy",
    region: "Europe",
    type: "Family",
    durationNights: 8,
    priceFrom: 1799,
    rating: 4.7,
    summary: "Villas among vineyards, private Uffizi guide, truffle hunt, and farm-to-table dinners.",
    tags: ["Wine", "Art", "Family"],
    image: heroItaly,
  },
  {
    id: "bali-wellness",
    slug: "bali-wellness",
    title: "Bali Wellness Hideaway",
    location: "Ubud & Uluwatu, Bali",
    region: "Asia",
    type: "Adventure",
    durationNights: 7,
    priceFrom: 1499,
    rating: 4.85,
    summary: "Clifftop sunsets, rainforest villas, surf warm-ups, and temple-side sunrise yoga.",
    tags: ["Wellness", "Surf", "Temples"],
    image: heroTropical,
  },
  // Truncated for brevity - keeping a representative sample
  {
    id: "andalusia-flamenco",
    slug: "andalusia-flamenco",
    title: "Andalusia Flamenco Sojourn",
    location: "Seville, Spain",
    region: "Europe",
    type: "Cultural",
    durationNights: 7,
    priceFrom: 1399,
    rating: 4.7,
    summary: "Tapas trails, palatial courtyards, and private flamenco evenings under lantern light.",
    tags: ["Tapas", "Flamenco", "Palaces"],
    image: heroItaly,
  },
  {
    id: "patagonia-expedition",
    slug: "patagonia-expedition",
    title: "Patagonia Glacier Expedition",
    location: "El Calafate, Argentina",
    region: "Americas",
    type: "Adventure",
    durationNights: 9,
    priceFrom: 2499,
    rating: 4.9,
    summary: "Trek the ice fields, sail emerald lakes, and unwind in mountain lodges.",
    tags: ["Glaciers", "Hiking", "Lakes"],
    image: destinationGreece,
  },
  {
    id: "alps-chalet-escape",
    slug: "alps-chalet-escape",
    title: "Alps Chalet Escape",
    location: "Zermatt, Switzerland",
    region: "Europe",
    type: "Luxury",
    durationNights: 6,
    priceFrom: 2299,
    rating: 4.9,
    summary: "Ski days, spa nights, fondue dinners, and sunrise views of the Matterhorn.",
    tags: ["Ski", "Spa", "Gourmet"],
    image: destinationMaldives,
  },
  {
    id: "morocco-medina",
    slug: "morocco-medina",
    title: "Moroccan Medina Mosaic",
    location: "Marrakech, Morocco",
    region: "Africa",
    type: "Cultural",
    durationNights: 7,
    priceFrom: 1349,
    rating: 4.6,
    summary: "Riads, rooftop dinners, desert sunrise over dunes, and artisan souk tours.",
    tags: ["Desert", "Souks", "Riads"],
    image: destinationGreece,
  },
  {
    id: "galapagos-voyage",
    slug: "galapagos-voyage",
    title: "Galápagos Discovery Voyage",
    location: "Galápagos, Ecuador",
    region: "Americas",
    type: "Adventure",
    durationNights: 8,
    priceFrom: 3299,
    rating: 4.95,
    summary: "Small-ship cruising with naturalist guides, snorkeling with turtles, lava trails at dusk.",
    tags: ["Wildlife", "Cruise", "Snorkel"],
    image: destinationMaldives,
  },
];
