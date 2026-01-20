-- ==============================================================================
-- Migration: Seed System Email Templates
-- ==============================================================================
-- Seeds the initial system email templates for common use cases.
-- These templates use {{variable}} syntax for dynamic content.
-- ==============================================================================

-- Trip Confirmation Template
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
  'trip-confirmation',
  'Trip Confirmation',
  'Sent when a trip is booked/confirmed',
  'Your Trip Confirmation - {{trip.name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a365d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Trip Confirmed!</h1>
  </div>

  <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear {{contact.first_name::Valued Customer}},</p>

    <p>Your trip has been confirmed! Here are the details:</p>

    <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h2 style="color: #1a365d; margin-top: 0;">{{trip.name}}</h2>
      <p><strong>Reference:</strong> {{trip.reference}}</p>
      <p><strong>Dates:</strong> {{trip.start_date}} - {{trip.end_date}}</p>
    </div>

    <p>If you have any questions about your trip, please don''t hesitate to reach out.</p>

    <p>Best regards,<br>
    {{business.name::Phoenix Voyages}}</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>{{business.name}} | {{business.phone}} | {{business.email}}</p>
  </div>
</body>
</html>',
  'Dear {{contact.first_name::Valued Customer}},

Your trip has been confirmed! Here are the details:

Trip: {{trip.name}}
Reference: {{trip.reference}}
Dates: {{trip.start_date}} - {{trip.end_date}}

If you have any questions about your trip, please don''t hesitate to reach out.

Best regards,
{{business.name::Phoenix Voyages}}

---
{{business.name}} | {{business.phone}} | {{business.email}}',
  '[
    {"key": "contact.first_name", "description": "Contact first name", "defaultValue": "Valued Customer"},
    {"key": "trip.name", "description": "Trip name/title"},
    {"key": "trip.reference", "description": "Trip reference number"},
    {"key": "trip.start_date", "description": "Trip start date"},
    {"key": "trip.end_date", "description": "Trip end date"},
    {"key": "business.name", "description": "Agency name", "defaultValue": "Phoenix Voyages"},
    {"key": "business.phone", "description": "Agency phone"},
    {"key": "business.email", "description": "Agency email"}
  ]'::jsonb,
  'trip_order',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Trip Update Template
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
  'trip-update',
  'Trip Update',
  'Sent when trip details are changed',
  'Trip Update - {{trip.name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a365d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Trip Updated</h1>
  </div>

  <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear {{contact.first_name::Valued Customer}},</p>

    <p>Your trip <strong>{{trip.name}}</strong> has been updated.</p>

    <p>Please review the updated details in your travel portal or contact us if you have any questions.</p>

    <p>Best regards,<br>
    {{business.name::Phoenix Voyages}}</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>{{business.name}} | {{business.phone}} | {{business.email}}</p>
  </div>
</body>
</html>',
  'Dear {{contact.first_name::Valued Customer}},

Your trip {{trip.name}} has been updated.

Please review the updated details in your travel portal or contact us if you have any questions.

Best regards,
{{business.name::Phoenix Voyages}}

---
{{business.name}} | {{business.phone}} | {{business.email}}',
  '[
    {"key": "contact.first_name", "description": "Contact first name", "defaultValue": "Valued Customer"},
    {"key": "trip.name", "description": "Trip name/title"},
    {"key": "business.name", "description": "Agency name", "defaultValue": "Phoenix Voyages"},
    {"key": "business.phone", "description": "Agency phone"},
    {"key": "business.email", "description": "Agency email"}
  ]'::jsonb,
  'trip_order',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Activity Confirmation Template
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
  'activity-confirmation',
  'Activity Confirmation',
  'Sent when an activity is added to a trip',
  'Activity Added to Your Trip - {{activity.name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a365d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Activity Added!</h1>
  </div>

  <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear {{contact.first_name::Valued Customer}},</p>

    <p>A new activity has been added to your trip:</p>

    <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h2 style="color: #1a365d; margin-top: 0;">{{activity.name}}</h2>
      <p><strong>Date:</strong> {{activity.date}}</p>
      <p><strong>Price:</strong> {{activity.price}}</p>
    </div>

    <p>Best regards,<br>
    {{business.name::Phoenix Voyages}}</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>{{business.name}} | {{business.phone}} | {{business.email}}</p>
  </div>
</body>
</html>',
  'Dear {{contact.first_name::Valued Customer}},

A new activity has been added to your trip:

Activity: {{activity.name}}
Date: {{activity.date}}
Price: {{activity.price}}

Best regards,
{{business.name::Phoenix Voyages}}

---
{{business.name}} | {{business.phone}} | {{business.email}}',
  '[
    {"key": "contact.first_name", "description": "Contact first name", "defaultValue": "Valued Customer"},
    {"key": "activity.name", "description": "Activity name"},
    {"key": "activity.date", "description": "Activity date"},
    {"key": "activity.price", "description": "Activity price"},
    {"key": "business.name", "description": "Agency name", "defaultValue": "Phoenix Voyages"},
    {"key": "business.phone", "description": "Agency phone"},
    {"key": "business.email", "description": "Agency email"}
  ]'::jsonb,
  'trip_order',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Welcome Template
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
  'welcome',
  'Welcome Email',
  'Sent when a new contact is created',
  'Welcome to {{business.name::Phoenix Voyages}}!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a365d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome!</h1>
  </div>

  <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear {{contact.first_name::Valued Customer}},</p>

    <p>Welcome to {{business.name::Phoenix Voyages}}! We''re thrilled to have you join our community of travelers.</p>

    <p>We specialize in creating unforgettable travel experiences tailored just for you. Whether you''re dreaming of a relaxing beach getaway, an adventurous expedition, or a cultural immersion, we''re here to make it happen.</p>

    <p>Feel free to reach out to us anytime with questions or to start planning your next adventure!</p>

    <p>Best regards,<br>
    The {{business.name::Phoenix Voyages}} Team</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>{{business.name}} | {{business.phone}} | {{business.email}}</p>
  </div>
</body>
</html>',
  'Dear {{contact.first_name::Valued Customer}},

Welcome to {{business.name::Phoenix Voyages}}! We''re thrilled to have you join our community of travelers.

We specialize in creating unforgettable travel experiences tailored just for you. Whether you''re dreaming of a relaxing beach getaway, an adventurous expedition, or a cultural immersion, we''re here to make it happen.

Feel free to reach out to us anytime with questions or to start planning your next adventure!

Best regards,
The {{business.name::Phoenix Voyages}} Team

---
{{business.name}} | {{business.phone}} | {{business.email}}',
  '[
    {"key": "contact.first_name", "description": "Contact first name", "defaultValue": "Valued Customer"},
    {"key": "business.name", "description": "Agency name", "defaultValue": "Phoenix Voyages"},
    {"key": "business.phone", "description": "Agency phone"},
    {"key": "business.email", "description": "Agency email"}
  ]'::jsonb,
  'notification',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Password Reset Template
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
  'password-reset',
  'Password Reset',
  'Sent when a user requests a password reset',
  'Reset Your Password',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a365d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>

  <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello,</p>

    <p>We received a request to reset your password. Click the button below to create a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_link}}" style="background-color: #1a365d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>

    <p>If you didn''t request this password reset, you can safely ignore this email. The link will expire in 24 hours.</p>

    <p>Best regards,<br>
    {{business.name::Phoenix Voyages}}</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>{{business.name}} | {{business.phone}} | {{business.email}}</p>
  </div>
</body>
</html>',
  'Hello,

We received a request to reset your password. Click the link below to create a new password:

{{reset_link}}

If you didn''t request this password reset, you can safely ignore this email. The link will expire in 24 hours.

Best regards,
{{business.name::Phoenix Voyages}}

---
{{business.name}} | {{business.phone}} | {{business.email}}',
  '[
    {"key": "reset_link", "description": "Password reset link"},
    {"key": "business.name", "description": "Agency name", "defaultValue": "Phoenix Voyages"},
    {"key": "business.phone", "description": "Agency phone"},
    {"key": "business.email", "description": "Agency email"}
  ]'::jsonb,
  'system',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Invite Template
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
  'invite',
  'User Invitation',
  'Sent when a user is invited to join the platform',
  'You''re Invited to {{business.name::Phoenix Voyages}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a365d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">You''re Invited!</h1>
  </div>

  <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear {{contact.first_name::Friend}},</p>

    <p>{{inviter_name::Someone}} has invited you to join {{business.name::Phoenix Voyages}}!</p>

    <p>Click the button below to accept the invitation and set up your account:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invite_link}}" style="background-color: #1a365d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
    </div>

    <p>This invitation link will expire in 7 days.</p>

    <p>Best regards,<br>
    {{business.name::Phoenix Voyages}}</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>{{business.name}} | {{business.phone}} | {{business.email}}</p>
  </div>
</body>
</html>',
  'Dear {{contact.first_name::Friend}},

{{inviter_name::Someone}} has invited you to join {{business.name::Phoenix Voyages}}!

Click the link below to accept the invitation and set up your account:

{{invite_link}}

This invitation link will expire in 7 days.

Best regards,
{{business.name::Phoenix Voyages}}

---
{{business.name}} | {{business.phone}} | {{business.email}}',
  '[
    {"key": "contact.first_name", "description": "Contact first name", "defaultValue": "Friend"},
    {"key": "inviter_name", "description": "Name of the person who sent the invite", "defaultValue": "Someone"},
    {"key": "invite_link", "description": "Invitation link"},
    {"key": "business.name", "description": "Agency name", "defaultValue": "Phoenix Voyages"},
    {"key": "business.phone", "description": "Agency phone"},
    {"key": "business.email", "description": "Agency email"}
  ]'::jsonb,
  'system',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;
