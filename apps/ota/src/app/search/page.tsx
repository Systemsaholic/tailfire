"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, Compass, Filter, MapPin, Search, SlidersHorizontal, Star, Tag } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Slider,
} from "@tailfire/ui-public";
import { trips } from "@/data/trips";

type QueryState = {
  q: string;
  destination: string;
  type: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  duration: string;
};

const priceBounds = { min: 1000, max: 3500 };

function useQueryState(): [QueryState, (patch: Partial<QueryState>) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state: QueryState = {
    q: searchParams.get("q") || "",
    destination: searchParams.get("destination") || "all",
    type: searchParams.get("type") || "all",
    minPrice: Number(searchParams.get("minPrice")) || priceBounds.min,
    maxPrice: Number(searchParams.get("maxPrice")) || priceBounds.max,
    minRating: Number(searchParams.get("minRating")) || 0,
    duration: searchParams.get("duration") || "all",
  };

  const setState = (patch: Partial<QueryState>) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = { ...state, ...patch };

    params.set("q", next.q);
    params.set("destination", next.destination);
    params.set("type", next.type);
    params.set("minPrice", String(next.minPrice));
    params.set("maxPrice", String(next.maxPrice));
    params.set("minRating", String(next.minRating));
    params.set("duration", next.duration);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return [state, setState];
}

const durationBuckets = [
  { value: "all", label: "Any length" },
  { value: "short", label: "Up to 6 nights", match: (n: number) => n <= 6 },
  { value: "week", label: "7-8 nights", match: (n: number) => n >= 7 && n <= 8 },
  { value: "long", label: "9+ nights", match: (n: number) => n >= 9 },
];

type FilterControlsProps = {
  query: QueryState;
  setQuery: (patch: Partial<QueryState>) => void;
  destinations: string[];
  types: string[];
};

const FilterControls = ({ query, setQuery, destinations, types }: FilterControlsProps) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Destination</Label>
      <Select value={query.destination} onValueChange={(value) => setQuery({ destination: value })}>
        <SelectTrigger>
          <SelectValue placeholder="All destinations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All destinations</SelectItem>
          {destinations.slice(1).map((dest) => (
            <SelectItem key={dest} value={dest}>
              {dest}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Style</Label>
      <Select value={query.type} onValueChange={(value) => setQuery({ type: value })}>
        <SelectTrigger>
          <SelectValue placeholder="All styles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All styles</SelectItem>
          {types.slice(1).map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
        <span>Budget</span>
        <span className="text-foreground font-semibold">
          ${query.minPrice} – ${query.maxPrice}
        </span>
      </div>
      <div className="space-y-2">
        <Slider
          min={priceBounds.min}
          max={priceBounds.max}
          step={50}
          minStepsBetweenThumbs={5}
          value={[query.minPrice, query.maxPrice]}
          onValueChange={([min, max]) => setQuery({ minPrice: min, maxPrice: max })}
          className="my-1 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-none [&_[role=slider]]:shadow-lg"
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Min</Label>
            <Input
              type="number"
              min={priceBounds.min}
              max={query.maxPrice}
              value={query.minPrice}
              className="h-9 text-sm"
              onChange={(e) => {
                const val = Number(e.target.value) || priceBounds.min;
                const clamped = Math.min(Math.max(val, priceBounds.min), query.maxPrice);
                setQuery({ minPrice: clamped });
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Max</Label>
            <Input
              type="number"
              min={query.minPrice}
              max={priceBounds.max}
              value={query.maxPrice}
              className="h-9 text-sm"
              onChange={(e) => {
                const val = Number(e.target.value) || priceBounds.max;
                const clamped = Math.max(Math.min(val, priceBounds.max), query.minPrice);
                setQuery({ maxPrice: clamped });
              }}
            />
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Minimum rating</Label>
      <Select value={String(query.minRating)} onValueChange={(value) => setQuery({ minRating: Number(value) })}>
        <SelectTrigger>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Any</SelectItem>
          <SelectItem value="4">4.0+</SelectItem>
          <SelectItem value="4.5">4.5+</SelectItem>
          <SelectItem value="4.8">4.8+</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Duration</Label>
      <Select value={query.duration} onValueChange={(value) => setQuery({ duration: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Any length" />
        </SelectTrigger>
        <SelectContent>
          {durationBuckets.map((bucket) => (
            <SelectItem key={bucket.value} value={bucket.value}>
              {bucket.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default function SearchPage() {
  const [query, setQuery] = useQueryState();

  const destinations = useMemo(() => ["All destinations", ...Array.from(new Set(trips.map((t) => t.location)))], []);
  const types = useMemo(() => ["All styles", ...Array.from(new Set(trips.map((t) => t.type)))], []);

  const filteredTrips = useMemo(() => {
    return trips
      .filter((trip) => {
        const text = `${trip.title} ${trip.location} ${trip.summary} ${trip.tags.join(" ")}`.toLowerCase();
        return text.includes(query.q.toLowerCase());
      })
      .filter((trip) => (query.destination === "all" ? true : trip.location === query.destination))
      .filter((trip) => (query.type === "all" ? true : trip.type === query.type))
      .filter((trip) => trip.priceFrom >= query.minPrice && trip.priceFrom <= query.maxPrice)
      .filter((trip) => trip.rating >= query.minRating)
      .filter((trip) => {
        const bucket = durationBuckets.find((b) => b.value === query.duration);
        return !bucket || bucket.value === "all" || (bucket.match ? bucket.match(trip.durationNights) : true);
      });
  }, [query]);

  const handleSearchSubmit = (formData: FormData) => {
    const q = formData.get("q");
    setQuery({ q: typeof q === "string" ? q : "" });
  };

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 flex flex-col gap-6 pb-10">
        <form
          className="grid grid-cols-1 gap-3 rounded-xl border border-primary/10 bg-card/80 p-3 shadow-sm md:grid-cols-5 md:items-end"
          action={handleSearchSubmit}
        >
          <div className="md:col-span-2">
            <Label htmlFor="q" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Destination or experience
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
              <Input
                id="q"
                name="q"
                defaultValue={query.q}
                placeholder="Santorini, safari, wellness..."
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="checkin" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Check-in
            </Label>
            <div className="relative">
              <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
              <Input id="checkin" name="checkin" type="date" className="pl-9 h-10 text-sm" />
            </div>
          </div>
          <div>
            <Label htmlFor="guests" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Travelers
            </Label>
            <div className="relative">
              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
              <Input id="guests" name="guests" type="number" min={1} defaultValue={2} className="pl-9 h-10 text-sm" />
            </div>
          </div>
          <div className="md:col-span-1">
            <Button type="submit" className="w-full h-10 font-display tracking-wide text-sm">
              Update search
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="hidden lg:block">
            <Card className="border border-primary/10 shadow-md">
              <CardHeader className="flex flex-row items-center gap-2 pb-0">
                <Filter className="text-primary" size={18} />
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">Refine</p>
                  <p className="text-base font-semibold text-foreground">Filters</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <FilterControls query={query} setQuery={setQuery} destinations={destinations} types={types} />
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredTrips.length}</span> curated trips
              </p>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
                <Tag size={14} className="text-primary" />
                Filters persist in the URL for sharing and revisits.
              </div>
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <SlidersHorizontal size={16} />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] sm:w-[380px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2 text-base">
                        <Filter className="text-primary" size={16} />
                        Refine
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-6">
                      <FilterControls query={query} setQuery={setQuery} destinations={destinations} types={types} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="overflow-hidden border border-primary/10 bg-card/90 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={trip.image}
                      alt={trip.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <Badge className="absolute bottom-3 left-3 bg-primary text-primary-foreground shadow-md">
                      <MapPin size={14} className="mr-1" />
                      {trip.location}
                    </Badge>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">From ${trip.priceFrom}</p>
                        <h3 className="text-xl font-display font-bold text-foreground">{trip.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{trip.summary}</p>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Star size={16} className="fill-primary text-primary" />
                        <span className="text-sm font-semibold text-foreground">{trip.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="border-primary/15 text-primary">
                        {trip.type}
                      </Badge>
                      <Badge variant="outline" className="border-primary/10">
                        {trip.durationNights} nights
                      </Badge>
                      {trip.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-primary/10">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button asChild variant="luxury" className="flex-1">
                        <Link href={`/trips/${trip.slug}`}>View details</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/#contact">Inquire</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTrips.length === 0 ? (
              <Card className="border border-primary/10 bg-card/80 shadow-md">
                <CardContent className="py-10 text-center space-y-3">
                  <p className="text-xl font-display font-bold text-foreground">No journeys match yet</p>
                  <p className="text-muted-foreground">
                    Adjust filters or reach out and we&apos;ll tailor something just for you.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button variant="default" asChild>
                      <Link href="/#contact">Contact agency desk</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/#hero">Reset filters</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
