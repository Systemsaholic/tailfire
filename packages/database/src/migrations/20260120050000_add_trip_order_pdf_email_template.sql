-- ==============================================================================
-- Migration: Add Trip Order PDF Email Template
-- ==============================================================================
-- Adds the email template for sending Trip Order PDFs to clients.
-- Features Phoenix Voyages branding with gold accent colors.
-- ==============================================================================

-- Trip Order PDF Email Template
INSERT INTO "email_templates" (
  "slug",
  "name",
  "description",
  "subject",
  "body_html",
  "body_text",
  "variables",
  "category",
  "is_system",
  "is_active"
) VALUES (
  'trip-order-pdf',
  'Trip Order PDF',
  'Sent when sending a Trip Order PDF document to the client',
  'Your Trip Order - {{trip.name}} ({{trip.reference}})',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header with Phoenix Voyages branding -->
    <div style="background: linear-gradient(135deg, #c59746 0%, #e89e4a 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">{{business.name::Phoenix Voyages}}</h1>
      <p style="color: #ffffff; font-size: 14px; opacity: 0.9; margin: 10px 0 0 0;">Discover, Soar, Repeat</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px;">
      <h2 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">Trip Order Confirmation</h2>

      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Dear {{contact.first_name::Valued Client}},
      </p>

      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for choosing {{business.name::Phoenix Voyages}}! We''re excited to help you plan your upcoming journey.
      </p>

      <!-- Trip Details Box -->
      <div style="background-color: #f9e293; border-left: 4px solid #c59746; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Trip Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;"><strong>Trip Number:</strong></td>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;">{{trip.reference}}</td>
          </tr>
          <tr>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;"><strong>Trip Name:</strong></td>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;">{{trip.name}}</td>
          </tr>
          <tr>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;"><strong>Start Date:</strong></td>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;">{{trip.start_date}}</td>
          </tr>
          <tr>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;"><strong>End Date:</strong></td>
            <td style="color: #4a5568; font-size: 14px; padding: 5px 0;">{{trip.end_date}}</td>
          </tr>
        </table>
      </div>

      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Please find your detailed Trip Order document attached as a PDF. This document includes:
      </p>

      <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 20px 0;">
        <li>Complete booking details</li>
        <li>Cost breakdown and payment schedule</li>
        <li>Terms and conditions</li>
        <li>Important travel information</li>
      </ul>

      <!-- Agent Contact Section -->
      <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
        <h3 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Your Travel Consultant</h3>
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0;">
          <strong>{{agent.full_name}}</strong><br />
          Email: <a href="mailto:{{agent.email}}" style="color: #c59746; text-decoration: none;">{{agent.email}}</a><br />
          Phone: {{agent.phone}}
        </p>
      </div>

      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        If you have any questions or need to make changes to your trip, please don''t hesitate to contact us.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
      <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">
        <strong>{{business.name::Phoenix Voyages}}</strong>
      </p>
      <p style="color: #e2e8f0; font-size: 12px; margin: 0 0 10px 0;">
        {{business.phone}} | {{business.website::www.phoenixvoyages.ca}}
      </p>
      <p style="color: #e2e8f0; font-size: 12px; margin: 0;">
        TICO #{{business.tico_registration}}
      </p>
    </div>
  </div>
</body>
</html>',
  'Dear {{contact.first_name::Valued Client}},

Thank you for choosing {{business.name::Phoenix Voyages}}! We''re excited to help you plan your upcoming journey.

TRIP DETAILS
------------
Trip Number: {{trip.reference}}
Trip Name: {{trip.name}}
Start Date: {{trip.start_date}}
End Date: {{trip.end_date}}

Please find your detailed Trip Order document attached as a PDF. This document includes:
- Complete booking details
- Cost breakdown and payment schedule
- Terms and conditions
- Important travel information

YOUR TRAVEL CONSULTANT
{{agent.full_name}}
Email: {{agent.email}}
Phone: {{agent.phone}}

If you have any questions or need to make changes to your trip, please don''t hesitate to contact us.

Best regards,
{{business.name::Phoenix Voyages}}

---
{{business.name}} | {{business.phone}} | {{business.website::www.phoenixvoyages.ca}}
TICO #{{business.tico_registration}}',
  '[
    {"key": "contact.first_name", "description": "Contact first name", "defaultValue": "Valued Client"},
    {"key": "trip.reference", "description": "Trip reference number"},
    {"key": "trip.name", "description": "Trip name/title"},
    {"key": "trip.start_date", "description": "Trip start date"},
    {"key": "trip.end_date", "description": "Trip end date"},
    {"key": "agent.full_name", "description": "Agent full name"},
    {"key": "agent.email", "description": "Agent email address"},
    {"key": "agent.phone", "description": "Agent phone number"},
    {"key": "business.name", "description": "Agency name", "defaultValue": "Phoenix Voyages"},
    {"key": "business.phone", "description": "Agency phone"},
    {"key": "business.website", "description": "Agency website", "defaultValue": "www.phoenixvoyages.ca"},
    {"key": "business.tico_registration", "description": "TICO registration number"}
  ]'::jsonb,
  'trip_order',
  true,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
