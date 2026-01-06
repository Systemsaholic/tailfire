"use client";

import { useTransition } from "react";

import { Button, Input, Label, Textarea } from "@tailfire/ui-public";
import { useConsultant } from "@/context/consultant-context";
import { submitInquiry, trackEvent } from "@/lib/api";
import { useSessionId } from "@/lib/session";

export function ContactForm() {
  const { consultant } = useConsultant();
  const sessionId = useSessionId();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const nameVal = formData.get("name");
      const emailVal = formData.get("email");
      const phoneVal = formData.get("phone");
      const messageVal = formData.get("message");
      const payload = {
        name: typeof nameVal === "string" ? nameVal : "",
        email: typeof emailVal === "string" ? emailVal : "",
        phone: typeof phoneVal === "string" ? phoneVal : "",
        message: typeof messageVal === "string" ? messageVal : "",
        consultantId: consultant.id,
        sessionId,
      };
      await submitInquiry(payload);
      await trackEvent({ type: "contact_form", ...payload });
    });
  };

  return (
    <form className="space-y-4" action={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Full name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" placeholder="+1 555 123 4567" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={4} placeholder="Share dates, interests, travel style..." />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Submit inquiry"}
        </Button>
      </div>
    </form>
  );
}
