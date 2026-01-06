import { Check, Clock, MapPin, Sparkles } from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@tailfire/ui-public";

const packages = [
  {
    id: 1,
    name: "Signature Aegean Escape",
    location: "Santorini, Greece",
    duration: "7 days",
    price: "From $2,499",
    perks: ["Cliffside suite with caldera views", "Private catamaran sunset sail", "Sommelier-led winery tour"],
    highlight: "Most booked",
  },
  {
    id: 2,
    name: "Zen Garden Discovery",
    location: "Kyoto, Japan",
    duration: "9 days",
    price: "From $2,899",
    perks: ["Ryokan stay with onsen access", "Guided temple + tea ceremony", "Day trip to Arashiyama bamboo grove"],
    highlight: "Culture-first",
  },
  {
    id: 3,
    name: "Maldives Overwater Retreat",
    location: "North Malé Atoll",
    duration: "6 days",
    price: "From $3,199",
    perks: ["Overwater villa with plunge pool", "Seaplane transfer + reef snorkel", "Private sandbank dinner"],
    highlight: "Honeymoon favorite",
  },
];

export const PackagesSection = ({ id }: { id?: string }) => {
  return (
    <section id={id} className="py-24 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 tracking-wide">
            TRAVEL <span className="text-luxury">PACKAGES</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Curated itineraries with luxury stays, seamless transfers, and hosted experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className="h-full border-primary/10 bg-background/80 backdrop-blur shadow-md hover:shadow-luxury transition-all duration-500 hover:-translate-y-2"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    {pkg.highlight}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {pkg.duration}
                  </span>
                </div>
                <CardTitle className="text-2xl text-foreground">{pkg.name}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {pkg.location}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-2 text-muted-foreground">
                  {pkg.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-1" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-display text-primary">{pkg.price}</span>
                  <Button variant="luxury" size="lg">
                    Plan itinerary
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
