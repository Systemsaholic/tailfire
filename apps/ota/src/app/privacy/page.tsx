import { Card, CardContent, CardHeader, CardTitle } from "@tailfire/ui-public";

export const metadata = {
  title: "Privacy Policy | Phoenix Voyages",
  description: "Learn how Phoenix Voyages collects, uses, and protects personal information when creating luxury travel experiences.",
};

const sections = [
  {
    title: "1. Introduction",
    body:
      "Phoenix Voyages (\"we,\" \"us,\" or \"our\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website, use our services, or communicate with our travel advisors. We comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation. By using our services, you consent to the practices described in this policy.",
  },
  {
    title: "2. Information We Collect",
    body:
      "We collect information necessary to plan and book your travel: (a) Contact information: name, email address, phone number, mailing address; (b) Travel details: passport information, date of birth, citizenship, travel preferences, dietary requirements, mobility needs, emergency contacts; (c) Payment information: credit card details, billing address (processed securely through PCI-compliant systems); (d) Communications: inquiries, feedback, and correspondence with our team; (e) Website data: IP address, browser type, pages visited, and cookies for analytics and functionality.",
  },
  {
    title: "3. How We Use Your Information",
    body:
      "We use your personal information to: (a) Design customized travel itineraries and provide personalized recommendations; (b) Process bookings, reservations, and payments with travel suppliers; (c) Communicate important updates about your trips, including changes and alerts; (d) Respond to inquiries and provide customer support; (e) Send marketing communications about travel offers (with your consent, which you may withdraw at any time); (f) Comply with legal obligations and protect against fraud; (g) Improve our website and services through analytics.",
  },
  {
    title: "4. Information Sharing and Disclosure",
    body:
      "We share your information only as necessary to fulfill your travel arrangements: (a) Travel suppliers: airlines, hotels, cruise lines, tour operators, and car rental companies to complete your bookings; (b) Payment processors: to securely process transactions; (c) Insurance providers: when you purchase travel insurance through us; (d) Government authorities: when required by law or to comply with entry requirements. We never sell, rent, or trade your personal information to third parties for marketing purposes. All service providers are contractually bound to protect your data.",
  },
  {
    title: "5. Data Security",
    body:
      "We implement appropriate technical and organizational measures to protect your personal information, including: (a) SSL/TLS encryption for data transmission; (b) Secure, access-controlled systems for data storage; (c) Regular security assessments and updates; (d) Staff training on privacy and data protection; (e) PCI-DSS compliant payment processing. While we take reasonable precautions, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    title: "6. Cookies and Tracking Technologies",
    body:
      "Our website uses cookies and similar technologies to: (a) Remember your preferences and session information; (b) Analyze website traffic and usage patterns; (c) Improve site functionality and user experience; (d) Deliver relevant content and offers. You can control cookies through your browser settings. Disabling cookies may affect certain website features. We use analytics services (such as Google Analytics) that collect anonymized usage data to help us improve our services.",
  },
  {
    title: "7. Third-Party Links",
    body:
      "Our website may contain links to third-party websites, including supplier sites, social media platforms, and partner resources. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit. Links to external sites do not imply endorsement.",
  },
  {
    title: "8. International Data Transfers",
    body:
      "Your travel arrangements may require sharing information with suppliers and partners located outside Canada. By booking international travel, you consent to the transfer of your personal information to countries that may have different privacy laws than Canada. We take steps to ensure your information remains protected in accordance with this policy.",
  },
  {
    title: "9. Children's Privacy",
    body:
      "Our services are intended for adults. We do not knowingly collect personal information from children under 16 without parental consent. When booking travel that includes minors, the parent or guardian is responsible for providing their information and consenting on their behalf. If you believe we have collected information from a child without proper consent, please contact us immediately.",
  },
  {
    title: "10. Your Privacy Rights",
    body:
      "Under Canadian privacy law, you have the right to: (a) Access your personal information held by us; (b) Request correction of inaccurate or incomplete information; (c) Withdraw consent for non-essential data processing; (d) Request deletion of your information (subject to legal retention requirements); (e) Opt out of marketing communications at any time. To exercise these rights, contact us at info@phoenixvoyages.ca. We will respond within 30 days.",
  },
  {
    title: "11. Data Retention",
    body:
      "We retain your personal information for as long as necessary to: (a) Provide ongoing travel services and support; (b) Maintain records for legal and regulatory compliance; (c) Resolve disputes and enforce agreements; (d) Meet tax and accounting requirements. When information is no longer needed, we securely delete or anonymize it. Travel booking records are typically retained for 7 years in accordance with business and legal requirements.",
  },
  {
    title: "12. Changes to This Policy",
    body:
      "We may update this Privacy Policy periodically to reflect changes in our practices, technology, or legal requirements. The \"Last Updated\" date will be revised accordingly. We encourage you to review this policy regularly. Continued use of our services after changes constitutes acceptance of the updated policy. Material changes will be communicated via email or website notice.",
  },
  {
    title: "13. Contact Us",
    body:
      "For questions, concerns, or requests regarding your privacy or this policy, please contact our Privacy Officer: Phoenix Voyages, 600 du Golf Rd., Hammond, ON K0A 2A0 | Phone: +1 855-383-5771 | Email: info@phoenixvoyages.ca | TICO Registration: 50028032. If you are not satisfied with our response, you may file a complaint with the Office of the Privacy Commissioner of Canada.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
          <h1 className="text-4xl font-display font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            We are committed to protecting your personal information while delivering exceptional travel planning.
          </p>
        </header>
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="border border-primary/10 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">{section.body}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
