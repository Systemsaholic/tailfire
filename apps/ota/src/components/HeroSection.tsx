"use client";

import { useRouter } from "next/navigation";
import type { StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { Calendar, Search, Users } from "lucide-react";

import { Button, Input } from "@tailfire/ui-public";
import heroBeach from "@/assets/hero-beach.jpg";
import heroItaly from "@/assets/hero-italy.jpg";
import heroTemple from "@/assets/hero-temple.jpg";
import heroTropical from "@/assets/hero-tropical.jpg";

const slides: Array<{
  image: StaticImageData;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
}> = [
  {
    image: heroBeach,
    title: "YOUR NEXT ADVENTURE",
    subtitle: "AWAITS",
    tagline: "Unleash your wanderlust with personalized travel planning and expert guidance",
    description: "Let's turn your dream destination into a reality"
  },
  {
    image: heroItaly,
    title: "TAILOR-MADE JOURNEYS",
    subtitle: "CRAFTED JUST FOR YOU",
    tagline: "From serene escapes to vibrant explorations",
    description: "Phoenix Voyages designs every trip to match your style and preferences"
  },
  {
    image: heroTropical,
    title: "EXPLORE STRESS-FREE",
    subtitle: "TRAVEL WITH PHOENIX",
    tagline: "Sit back and relax as we handle the details",
    description: "Your unforgettable journey starts here"
  },
  {
    image: heroTemple,
    title: "DISCOVER THE WORLD",
    subtitle: "YOUR WAY",
    tagline: "Experience travel that transforms",
    description: "Create memories that last a lifetime with expertly curated adventures"
  }
];

export const HeroSection = ({ id }: { id?: string }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const current = slides[currentSlide] ?? slides[0]!;

  return (
    <section id={id} className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Images with Ken Burns Effect */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-2000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{ backgroundImage: `url(${slide.image.src})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 via-secondary/50 to-secondary/80" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="transition-all duration-1000">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-secondary-foreground mb-4 drop-shadow-2xl tracking-wide">
            {current.title}
            <span className="block text-primary mt-2 text-luxury">{current.subtitle}</span>
          </h1>
          <p className="text-xl md:text-2xl text-secondary-foreground/90 mb-3 max-w-3xl mx-auto drop-shadow-lg font-decorative tracking-wider">
            {current.tagline}
          </p>
          <p className="text-lg md:text-xl text-secondary-foreground/80 mb-12 max-w-2xl mx-auto drop-shadow-md">
            {current.description}
          </p>
        </div>

        {/* Luxury Search Bar */}
        <div className="max-w-5xl mx-auto bg-card/98 backdrop-blur-md rounded-2xl shadow-luxury border border-primary/20 p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block font-display">
                Destination
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <Input
                  type="text"
                  placeholder="Where to?"
                  className="pl-10 h-12 border-primary/20 focus:border-primary focus:ring-primary"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block font-display">
                Check In
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <Input
                  type="date"
                  placeholder="Check In"
                  className="pl-10 h-12 border-primary/20 focus:border-primary focus:ring-primary"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block font-display">
                Travelers
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <Input
                  type="number"
                  placeholder="Guests"
                  min="1"
                  className="pl-10 h-12 border-primary/20 focus:border-primary focus:ring-primary"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button
                size="lg"
                className="w-full h-12 shadow-gold hover:shadow-luxury transition-all duration-300 font-display tracking-wider uppercase"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (destination) params.set("q", destination);
                  if (checkIn) params.set("checkin", checkIn);
                  if (guests) params.set("guests", String(guests));
                  router.push(`/search?${params.toString()}`);
                }}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? "w-12 bg-primary shadow-gold"
                : "w-2 bg-secondary-foreground/40 hover:bg-secondary-foreground/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
