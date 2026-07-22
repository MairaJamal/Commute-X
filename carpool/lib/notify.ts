/**
 * SOS notification provider.
 *
 * Sends a real call + WhatsApp message via Twilio when credentials are
 * configured. Twilio needs three env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER        (a Twilio voice-capable number, e.g. +1415...)
 *   TWILIO_WHATSAPP_FROM      (a Twilio WhatsApp-enabled sender, e.g. 'whatsapp:+14155238886')
 *
 * Without those set, calls/messages are NOT sent — instead we log what
 * would have been sent and return a `simulated: true` result, so nothing
 * fails silently or pretends to have notified someone it didn't.
 *
 * Note: this sandbox's network can't reach api.twilio.com to test the real
 * send path — only the simulated path has been exercised here. Once
 * deployed somewhere with outbound internet and the env vars set, the real
 * path should work as written, but treat it as unverified until tested
 * against a live Twilio account.
 */

export interface NotifyResult {
  contactName: string;
  contactPhone: string;
  channel: 'call' | 'whatsapp';
  simulated: boolean;
  ok: boolean;
  error?: string;
  sid?: string;
}

function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_WHATSAPP_FROM)
  );
}

async function twilioRequest(path: string, params: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/${path}.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Twilio request failed with status ${res.status}`);
  }
  return data as { sid: string };
}

async function placeCall(toPhone: string, message: string): Promise<{ sid: string }> {
  const from = process.env.TWILIO_FROM_NUMBER!;
  // Twilio needs TwiML to know what to say on the call. twiml.com/message hosts
  // a simple <Say> wrapper — swap for your own TwiML Bin/App URL in production.
  const twimlUrl = `https://twimlets.com/message?Message%5B0%5D=${encodeURIComponent(message)}`;
  return twilioRequest('Calls', { To: toPhone, From: from, Url: twimlUrl });
}

async function sendWhatsApp(toPhone: string, message: string): Promise<{ sid: string }> {
  const from = process.env.TWILIO_WHATSAPP_FROM!;
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  return twilioRequest('Messages', { To: to, From: from, Body: message });
}

export async function notifyEmergencyContacts(params: {
  contacts: Array<{ name: string; phone: string }>;
  userName: string;
  liveLocationUrl: string;
}): Promise<NotifyResult[]> {
  const { contacts, userName, liveLocationUrl } = params;
  const message = `SOS: ${userName} triggered an emergency alert on CommuteX and needs help. Live location: ${liveLocationUrl}`;

  const configured = twilioConfigured();
  const results: NotifyResult[] = [];

  for (const contact of contacts) {
    for (const channel of ['call', 'whatsapp'] as const) {
      if (!configured) {
        console.warn(
          `[SOS][simulated] Would ${channel === 'call' ? 'call' : 'WhatsApp-message'} ` +
            `${contact.name} (${contact.phone}): ${message}`
        );
        results.push({
          contactName: contact.name,
          contactPhone: contact.phone,
          channel,
          simulated: true,
          ok: true,
        });
        continue;
      }

      try {
        const { sid } =
          channel === 'call'
            ? await placeCall(contact.phone, message)
            : await sendWhatsApp(contact.phone, message);
        results.push({
          contactName: contact.name,
          contactPhone: contact.phone,
          channel,
          simulated: false,
          ok: true,
          sid,
        });
      } catch (err: any) {
        console.error(`[SOS] Failed to ${channel} ${contact.name} (${contact.phone}):`, err.message);
        results.push({
          contactName: contact.name,
          contactPhone: contact.phone,
          channel,
          simulated: false,
          ok: false,
          error: err.message,
        });
      }
    }
  }

  return results;
}
