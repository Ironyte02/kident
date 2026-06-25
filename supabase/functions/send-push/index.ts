// Supabase Edge Function: send-push
// ---------------------------------------------------------------------------
// Sends a Web Push notification to one user, or broadcasts to everyone with a
// stored subscription. Intended to be invoked by a scheduled cron (e.g. a
// daily "log today's entry" reminder) or manually for testing.
//
// Required secrets (set with `supabase secrets set ...`):
//   VAPID_PUBLIC_KEY    — same public key shipped to the client (VITE_VAPID_PUBLIC_KEY)
//   VAPID_PRIVATE_KEY   — KEEP SECRET, never ship to the browser
//   VAPID_SUBJECT       — a mailto: or https: contact URL, e.g. mailto:admin@kident.app
//   SUPABASE_URL        — auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected; needed to read push_subscriptions
//
// Deploy:  supabase functions deploy send-push
// Invoke:  POST { "user_id"?: string, "title"?: string, "body"?: string, "url"?: string }
//          (omit user_id to broadcast to all subscriptions)
// ---------------------------------------------------------------------------
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  try {
    const { user_id, title, body, url } = await req.json().catch(() => ({}));

    let query = supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
    if (user_id) query = query.eq("user_id", user_id);

    const { data: subs, error } = await query;
    if (error) throw error;

    const payload = JSON.stringify({
      title: title ?? "KiDent",
      body: body ?? "Time to log today's entry for your child.",
      url: url ?? "/",
    });

    const results = await Promise.allSettled(
      (subs ?? []).map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        ).catch(async (err: { statusCode?: number }) => {
          // 404/410 => subscription is dead; clean it up.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
          throw err;
        })
      ),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed, total: results.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
