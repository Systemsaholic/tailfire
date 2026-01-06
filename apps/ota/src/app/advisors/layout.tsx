import type { ReactNode } from "react";

export const metadata = {
  title: "Our Advisors | Phoenix Voyages",
  description: "Meet the travel advisors at Phoenix Voyages who craft personalized luxury journeys.",
};

export default function AdvisorsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary via-secondary/95 to-secondary">
      <div className="container mx-auto px-4 py-16">
        {children}
      </div>
    </div>
  );
}
