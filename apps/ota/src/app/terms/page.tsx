import { Card, CardContent, CardHeader, CardTitle } from "@tailfire/ui-public";

export const metadata = {
  title: "Terms & Conditions | Phoenix Voyages",
  description: "Review the terms and conditions that govern bookings, payments, cancellations, and more with Phoenix Voyages.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body:
      "By accessing our website, submitting a booking request, or engaging our travel advisors, you agree to be bound by these Terms and Conditions and our Privacy Policy. Phoenix Voyages is registered with the Travel Industry Council of Ontario (TICO #50028032). If you do not agree with any part of these terms, please do not use our services.",
  },
  {
    title: "2. Booking and Reservations",
    body:
      "All travel arrangements are subject to availability and supplier confirmation. Phoenix Voyages acts as an intermediary between you and travel suppliers (airlines, hotels, tour operators, cruise lines, etc.). While we make every effort to ensure accuracy, we cannot guarantee that all information provided by suppliers is error-free. A booking is confirmed only upon receipt of the required deposit and written confirmation from our office. You are responsible for reviewing all travel documents for accuracy upon receipt.",
  },
  {
    title: "3. Payment Terms",
    body:
      "A non-refundable deposit is required at the time of booking, with the balance due as specified in your itinerary (typically 60-90 days before departure). Payments may be made by credit card, e-transfer, or cheque. All prices are quoted in Canadian dollars unless otherwise specified. Prices are subject to change until full payment is received. Additional fees may apply for currency fluctuations, fuel surcharges, taxes, or government-imposed levies beyond our control.",
  },
  {
    title: "4. Cancellation and Refunds",
    body:
      "Cancellation policies vary by supplier and trip type. Our advisors will communicate specific deadlines and penalties at the time of booking. Cancellation requests must be submitted in writing. Refunds, if applicable, are processed once received from the supplier, less any applicable service fees and non-refundable deposits. Some promotional fares and packages are non-refundable. We strongly recommend purchasing travel insurance to protect your investment.",
  },
  {
    title: "5. Travel Documents and Requirements",
    body:
      "You are solely responsible for obtaining and maintaining valid passports, visas, health certificates, vaccination records, and any other documentation required for your trip. Passport validity requirements vary by destination (typically 6 months beyond your return date). Phoenix Voyages is not liable for denied boarding or entry due to inadequate documentation. We recommend reviewing entry requirements with the relevant embassy or consulate well in advance of departure.",
  },
  {
    title: "6. Travel Insurance",
    body:
      "Phoenix Voyages strongly recommends comprehensive travel insurance covering trip cancellation, interruption, delay, medical emergencies, evacuation, and baggage loss. We can provide quotes from reputable insurance providers. Travel without adequate insurance is at your own risk. Some suppliers require proof of insurance as a condition of participation. Insurance should be purchased at the time of booking for maximum coverage.",
  },
  {
    title: "7. Limitation of Liability",
    body:
      "Phoenix Voyages acts solely as an agent for travel suppliers and is not liable for injury, damage, loss, accident, delay, irregularity, or expense arising from: (a) acts or omissions of suppliers; (b) defects in vehicles, equipment, or accommodations; (c) acts of God, weather, strikes, or civil unrest; (d) government actions or travel advisories; (e) illness, quarantine, or medical requirements; or (f) any other causes beyond our reasonable control. Our liability, where applicable, is limited to the amount paid to us for services.",
  },
  {
    title: "8. Force Majeure",
    body:
      "Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control, including but not limited to: natural disasters, pandemics, acts of terrorism, war, government restrictions, airline failures, or other force majeure events. In such cases, we will work with suppliers to arrange alternatives, credits, or refunds where possible, subject to supplier policies.",
  },
  {
    title: "9. Changes and Itinerary Modifications",
    body:
      "While we strive to deliver your trip as planned, suppliers occasionally make changes to schedules, accommodations, or services. We will notify you promptly of significant changes and work to find suitable alternatives. Minor changes (room assignments, flight times within reason) do not constitute grounds for cancellation. Change fees may apply for client-requested modifications after booking confirmation.",
  },
  {
    title: "10. Privacy and Data Protection",
    body:
      "Your personal information is collected, used, and protected in accordance with our Privacy Policy and applicable Canadian privacy legislation. We share information with suppliers only as necessary to fulfill your travel arrangements. For full details, please review our Privacy Policy.",
  },
  {
    title: "11. Governing Law",
    body:
      "These Terms and Conditions are governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of Ontario. TICO's consumer protection provisions apply to Ontario residents.",
  },
  {
    title: "12. Modifications to Terms",
    body:
      "Phoenix Voyages reserves the right to modify these Terms and Conditions at any time. Changes take effect upon posting to our website. Continued use of our services after changes constitutes acceptance. We recommend reviewing these terms periodically.",
  },
  {
    title: "13. Contact Information",
    body:
      "For questions about these terms or our services, contact us at: Phoenix Voyages, 600 du Golf Rd., Hammond, ON K0A 2A0 | Phone: +1 855-383-5771 | Email: info@phoenixvoyages.ca | TICO Registration: 50028032",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
          <h1 className="text-4xl font-display font-bold text-foreground">Terms & Conditions</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            The following terms govern how we plan, book, and manage luxurious travel experiences for our clients.
          </p>
        </header>

        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="border border-primary/10 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {section.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
