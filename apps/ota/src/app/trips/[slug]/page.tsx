import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Star } from "lucide-react";

import { Button, Card, CardContent } from "@tailfire/ui-public";
import { trips } from "@/data/trips";
import { TripInquiryDialog } from "@/components/TripInquiryDialog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return trips.map((trip) => ({ slug: trip.slug }));
}

export default async function TripDetailPage({ params }: Props) {
  const { slug } = await params;
  const trip = trips.find((t) => t.slug === slug);

  if (!trip) {
    return notFound();
  }

  return (
    <div className="bg-background pb-10">
        <div className="relative h-[420px] w-full">
          <Image
            src={trip.image}
            alt={trip.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
          <div className="absolute bottom-8 left-1/2 w-full max-w-5xl -translate-x-1/2 px-4 text-white">
            <p className="text-sm uppercase tracking-wide text-primary">Tailored Journey</p>
            <h1 className="text-4xl font-display font-bold drop-shadow-lg">{trip.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/90">
              <span className="inline-flex items-center gap-1">
                <MapPin size={16} className="text-primary" />
                {trip.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={16} className="text-primary" />
                {trip.durationNights} nights
              </span>
              <span className="inline-flex items-center gap-1">
                <Star size={16} className="fill-primary text-primary" />
                {trip.rating.toFixed(1)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button asChild variant="luxury" className="shadow-gold">
                <Link href="/#contact">Start booking</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/40 text-white hover:bg-white/10">
                <Link href="/search">Back to results</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border border-primary/10 shadow-md bg-card/90">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
                  <p className="text-3xl font-display font-bold text-primary">${trip.priceFrom}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-primary/15 px-3 py-1 text-primary">{trip.type}</span>
                  <span className="rounded-full border border-primary/10 px-3 py-1">{trip.durationNights} nights</span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold text-foreground">Overview</h2>
                <p className="text-sm text-muted-foreground">{trip.summary}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Highlights</h3>
                <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  {trip.tags.map((tag) => (
                    <li key={tag} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">What to expect</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll tailor the itinerary to your travel window and party size. Expect private transfers, hosted
                  experiences, and vetted properties aligned with your preferences. Share your dates and we&apos;ll refine
                  the plan with your dedicated advisor.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/10 shadow-md bg-card/90">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-display font-bold text-foreground">Ready to plan?</h3>
              <p className="text-sm text-muted-foreground">
                Tell us your dates and priorities and we&apos;ll shape this journey around you. Your advisor will confirm
                availability and options.
              </p>
              <div className="space-y-3">
                <TripInquiryDialog tripId={trip.id} tripTitle={trip.title} />
                <Button asChild className="w-full" variant="outline">
                  <Link href="/search">Browse other itineraries</Link>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                All submissions include your advisor attribution so replies route to the right consultant.
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
