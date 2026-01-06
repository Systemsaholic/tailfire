"use client";

import Link from "next/link";
import { useTransition } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@tailfire/ui-public";
import { useConsultant } from "@/context/consultant-context";
import { useRequests } from "@/lib/requests";
import { submitInquiry, trackEvent } from "@/lib/api";
import { useSessionId } from "@/lib/session";
import { useProfileState } from "@/lib/profile";

type Props = {
  tripId: string;
  tripTitle: string;
};

export function TripInquiryDialog({ tripId, tripTitle }: Props) {
  const { consultant } = useConsultant();
  const { addRequest } = useRequests();
  const sessionId = useSessionId();
  const [pending, startTransition] = useTransition();
  const [profile, setProfile] = useProfileState();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const nameVal = formData.get("name");
      const emailVal = formData.get("email");
      const travelersVal = formData.get("travelers");
      const datesVal = formData.get("dates");
      const notesVal = formData.get("notes");
      const payload = {
        name: typeof nameVal === "string" ? nameVal : "",
        email: typeof emailVal === "string" ? emailVal : "",
        travelers: typeof travelersVal === "string" ? Number(travelersVal) : 1,
        dates: typeof datesVal === "string" ? datesVal : "",
        notes: typeof notesVal === "string" ? notesVal : "",
        tripId,
        tripTitle,
        consultantId: consultant.id,
        sessionId,
      };
      setProfile({
        ...profile,
        name: payload.name,
        email: payload.email,
        travelers: payload.travelers,
      });
      const stored = addRequest({
        title: tripTitle,
        details: payload.notes,
        tripId,
        tripTitle,
        consultantId: consultant.id,
        sessionId,
      });
      await submitInquiry(payload);
      await trackEvent({ type: "submit_trip_inquiry", ...stored, tripId, tripTitle });
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" variant="luxury">
          Inquire about this trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inquire about {tripTitle}</DialogTitle>
          <DialogDescription>
            Share your dates and preferences. Your advisor will follow up with availability and options.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" action={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your full name" required defaultValue={profile.name} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  defaultValue={profile.email}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="dates">Preferred dates</Label>
                <Input id="dates" name="dates" placeholder="Approximate dates" />
              </div>
              <div>
                <Label htmlFor="travelers">Travelers</Label>
                <Input id="travelers" name="travelers" type="number" min={1} defaultValue={profile.travelers || 2} />
              </div>
            </div>
          <div>
            <Label htmlFor="notes">Interests or must-haves</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Tell us what matters most for this journey."
              rows={3}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            We&apos;ll include your advisor attribution with this inquiry. Session: {sessionId || "pending"}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" variant="luxury" disabled={pending}>
              {pending ? "Sending..." : "Send inquiry"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
