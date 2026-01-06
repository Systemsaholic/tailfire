import { Card, CardContent, CardHeader, CardTitle } from "@tailfire/ui-public";
import { ContactForm } from "@/components/ContactForm";

export const metadata = {
  title: "Contact Us | Phoenix Voyages",
  description: "Reach Phoenix Voyages to plan your next luxury getaway. Our advisors are available by phone, email, or online form.",
};

const contactInfo = [
  { label: "Address", value: "600 du Golf Rd. Hammond ON K0A 2A0" },
  { label: "Phone", value: "+1 855-383-5771", href: "tel:+18553835771" },
  { label: "Email", value: "info@phoenixvoyages.ca", href: "mailto:info@phoenixvoyages.ca" },
  { label: "TICO License", value: "50028032" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border border-primary/10 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-display">Contact Phoenix Voyages</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell us about your next journey and we&apos;ll pair you with an advisor who can bring it to life.
              </p>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
          <Card className="border border-primary/10 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {contactInfo.map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-sm text-foreground underline-offset-4 hover:text-primary">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground">{item.value}</p>
                  )}
                </div>
              ))}
              <div className="pt-3 text-xs">
                <p className="font-semibold text-foreground">Office Hours</p>
                <p>Monday to Friday: 9:00 AM – 6:00 PM EST</p>
                <p>Saturday: 10:00 AM – 2:00 PM</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
