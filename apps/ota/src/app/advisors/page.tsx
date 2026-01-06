"use client";

import Image from "next/image";
import { Mail, Phone, UserCircle2 } from "lucide-react";

import { Button, Card, CardContent } from "@tailfire/ui-public";
import { consultants, defaultConsultantId } from "@/data/consultants";
import { useMockAuth } from "@/lib/mock-auth";

const advisors = Object.values(consultants)
  .filter((consultant) => consultant.id !== defaultConsultantId)
  .sort((a, b) => a.name.localeCompare(b.name));

export default function AdvisorsPage() {
  const { user, assignConsultant } = useMockAuth();

  const handleSelect = (consultantId: string) => {
    if (!user || user.associatedConsultantId === consultantId) return;
    assignConsultant(consultantId);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-secondary-foreground">Advisor Network</p>
        <h1 className="text-3xl font-display font-semibold text-white">Find your advisor</h1>
        <p className="text-sm text-secondary-foreground">
          Select a dedicated advisor to guide your itinerary, concierge requests, and traveler communications.
        </p>
        {!user && (
          <p className="text-sm text-secondary-foreground/70">
            Sign in through the Client Portal to save your selection and keep working with the advisor you choose.
          </p>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {advisors.map((advisor) => {
          const isCurrent = user?.associatedConsultantId === advisor.id;

          return (
            <Card
              key={advisor.id}
              className="bg-secondary/60 border border-primary/20 text-white shadow-lg shadow-primary/30"
            >
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-primary/20 bg-secondary/80">
                    <Image
                      src={advisor.avatar}
                      alt={advisor.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-lg font-semibold truncate">{advisor.name}</p>
                    {advisor.title ? (
                      <p className="text-sm text-secondary-foreground truncate">{advisor.title}</p>
                    ) : null}
                    {advisor.specialties ? (
                      <p className="text-xs uppercase tracking-wider text-secondary-foreground/70 truncate">
                        {advisor.specialties.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-secondary-foreground">
                  {advisor.email ? (
                    <a
                      href={`mailto:${advisor.email}`}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail size={14} />
                      Email
                    </a>
                  ) : null}
                  {advisor.phone ? (
                    <a
                      href={`tel:${advisor.phone}`}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone size={14} />
                      Call
                    </a>
                  ) : null}
                  {advisor.bioUrl ? (
                    <a
                      href={advisor.bioUrl}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <UserCircle2 size={14} />
                      Profile
                    </a>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full font-display tracking-wide uppercase"
                    disabled={!user || isCurrent}
                    onClick={() => handleSelect(advisor.id)}
                  >
                    Select as My Advisor
                  </Button>
                  {isCurrent && (
                    <p className="text-xs text-secondary-foreground/70">Currently assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
