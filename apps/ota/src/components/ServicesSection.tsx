import { Globe, Shield, Headphones, Heart } from "lucide-react";

import { Card, CardContent } from "@tailfire/ui-public";

const services = [
  {
    icon: Globe,
    title: "Worldwide Coverage",
    description: "Access to thousands of destinations across all continents with local expertise",
  },
  {
    icon: Shield,
    title: "Secure Booking",
    description: "Protected payments and comprehensive travel insurance for peace of mind",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round-the-clock customer service to assist you throughout your journey",
  },
  {
    icon: Heart,
    title: "Personalized Service",
    description: "Tailored itineraries designed to match your unique travel preferences",
  },
];

export const ServicesSection = ({ id }: { id?: string }) => {
  return (
    <section id={id} className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 tracking-wide">
            WHY CHOOSE <span className="text-luxury">PHOENIX VOYAGES</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Experience travel the way it should be—effortless, exciting, and unforgettable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="text-center hover:shadow-luxury transition-all duration-500 transform hover:-translate-y-2 border-primary/10 bg-card group"
              >
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500 shadow-gold">
                    <Icon className="text-primary" size={36} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-4 tracking-wide uppercase">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
