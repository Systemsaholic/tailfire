// Placeholder API client for future NestJS integration.
// Currently returns resolved promises and logs payloads for visibility.

type InquiryPayload = Record<string, unknown>;
type ProfilePayload = Record<string, unknown>;
type EventPayload = Record<string, unknown>;

export function submitInquiry(payload: InquiryPayload): Promise<{ ok: boolean }> {
  console.info("[mock] submitInquiry", payload);
  return Promise.resolve({ ok: true });
}

export function saveProfile(payload: ProfilePayload): Promise<{ ok: boolean }> {
  console.info("[mock] saveProfile", payload);
  return Promise.resolve({ ok: true });
}

export function trackEvent(payload: EventPayload): Promise<{ ok: boolean }> {
  console.info("[mock] trackEvent", payload);
  return Promise.resolve({ ok: true });
}
