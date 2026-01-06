import Link from "next/link";
import { Button, Card, CardContent, CardHeader } from "@tailfire/ui-public";

export const metadata = {
  title: "About Us | Phoenix Voyages",
  description:
    "Phoenix Voyages crafts transformative and personalized travel experiences for discerning guests. Discover why our advisors are preferred partners for luxury journeys.",
};

const pillars = [
  {
    title: "Personalized Service",
    description:
      "We study your preferences, tailor journeys to fit your pace, and orchestrate seamless logistics from arrival to departure.",
  },
  {
    title: "Expert Knowledge",
    description:
      "Our advisors bring decades of travel expertise, vetted partners, and insider access to exclusive experiences around the globe.",
  },
  {
    title: "Quality Assurance",
    description:
      "Every stay, transfer, and activity is hand-selected, verified, and monitored so you can travel with absolute confidence.",
  },
  {
    title: "24/7 Support",
    description:
      "We remain on call before, during, and after travel—handling everything from last-minute upgrades to unforeseen contingencies.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 space-y-12">
        <section className="rounded-3xl border border-primary/10 bg-gradient-to-br from-secondary/80 via-secondary/70 to-secondary/90 p-10 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">About Phoenix Voyages</p>
          <h1 className="mt-4 text-4xl font-display font-bold">
            Travel Beyond Destinations
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80">
            We design journeys that transform perspective, connect you to culture, and deliver rare, meaningful
            moments around the world. Every itinerary blends bespoke service, local insight, and enduring luxury.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="luxury" asChild>
              <Link href="/contact">Connect with an advisor</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/trips/santorini-signature">View signature journeys</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-bold text-foreground">Why Choose Us</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Our boutique team pairs dedicated advisors with proven operational excellence, ensuring your experience
            is as effortless as it is memorable.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="border-primary/10 bg-card/90 shadow-sm">
                <CardHeader className="pb-2">
                  <p className="text-base font-semibold text-foreground">{pillar.title}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-primary/10 bg-card/90 p-8 text-sm text-muted-foreground shadow-sm">
          <h3 className="text-2xl font-display font-bold text-foreground">Crafting Memories, One Journey at a Time</h3>
          <p className="mt-3">
            At Phoenix Voyages, we believe that every journey tells a story. Based in Ontario and registered with TICO
            (#50028032), our mission is to inspire and guide you in exploring the beauty of the world with tailored
            travel solutions. From concept through celebration, we blend concierge-level care with a global network
            of partners to curate journeys worth reliving.
          </p>
          <p className="mt-3">
            We believe travel isn&apos;t just about reaching a destination—it&apos;s about the experiences, memories, and
            connections made along the way. Our clients include families celebrating milestones, executives seeking
            immersive retreats, and passionate explorers craving curated discovery. Every touchpoint is intentional—
            because travel should feel personal, seamless, and unforgettable.
          </p>
        </section>
      </div>
    </div>
  );
}
