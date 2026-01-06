import Image from "next/image";
import { MapPin, Star } from "lucide-react";

import { Button, Card, CardContent } from "@tailfire/ui-public";
import greeceImg from "@/assets/destination-greece.jpg";
import japanImg from "@/assets/destination-japan.jpg";
import maldivesImg from "@/assets/destination-maldives.jpg";

const destinations = [
  {
    id: 1,
    name: "Santorini, Greece",
    image: greeceImg,
    price: "From $1,299",
    rating: 4.9,
    description: "Whitewashed villages and stunning sunsets",
  },
  {
    id: 2,
    name: "Kyoto, Japan",
    image: japanImg,
    price: "From $1,599",
    rating: 4.8,
    description: "Ancient temples and cherry blossoms",
  },
  {
    id: 3,
    name: "Maldives Islands",
    image: maldivesImg,
    price: "From $2,199",
    rating: 5.0,
    description: "Luxury overwater villas and pristine beaches",
  },
];

export const FeaturedDestinations = ({ id }: { id?: string }) => {
  return (
    <section id={id} className="py-24 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 tracking-wide">
            FEATURED <span className="text-luxury">DESTINATIONS</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Explore our handpicked selection of breathtaking locations around the world
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination) => (
            <Card
              key={destination.id}
              className="overflow-hidden hover:shadow-luxury transition-all duration-500 transform hover:-translate-y-3 border-primary/10 bg-card group"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  priority={destination.id === 1}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg">
                  <Star className="text-primary fill-primary" size={18} />
                  <span className="text-sm font-bold font-display">{destination.rating}</span>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-display font-bold text-foreground mb-3 flex items-center tracking-wide">
                  <MapPin className="text-primary mr-2 flex-shrink-0" size={22} />
                  {destination.name}
                </h3>
                <p className="text-muted-foreground mb-6 font-light">
                  {destination.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-display font-bold text-primary">
                    {destination.price}
                  </span>
                  <Button
                    variant="default"
                    className="shadow-gold hover:shadow-luxury transition-all duration-300 font-display tracking-wider"
                  >
                    Explore
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
