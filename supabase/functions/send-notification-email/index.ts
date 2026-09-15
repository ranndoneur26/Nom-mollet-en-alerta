// supabase/functions/send-notification-email/index.ts
//
// Desplega amb: supabase functions deploy send-notification-email
// Configura un Database Webhook (Database > Webhooks a Supabase) que cridi
// aquesta funció en cada INSERT a la taula `notifications`.
//
// Variables d'entorn necessàries a la funció (supabase secrets set ...):
//   RESEND_API_KEY
//   NOTIFICATIONS_FROM_EMAIL
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (per llegir l'email real a auth.users)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface WebhookPayload {
  type: "INSERT";
  table: "notifications";
  record: {
    id: number;
    user_id: string;
    incident_id: string | null;
    message: string;
  };
}

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    if (payload.type !== "INSERT") {
      return new Response("ignored", { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // El correu viu a auth.users, mai a `profiles` (principi de minimització
    // de dades — vegeu README > Privacitat).
    const { data: userRes, error } = await supabaseAdmin.auth.admin.getUserById(
      payload.record.user_id
    );
    if (error || !userRes?.user?.email) {
      return new Response("no email on file, skipped", { status: 200 });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      // A l'MVP sense clau de Resend configurada, no fallem: només ho registrem.
      console.log("RESEND_API_KEY no configurada, ometent enviament real:", payload.record.message);
      return new Response("skipped: no RESEND_API_KEY", { status: 200 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("NOTIFICATIONS_FROM_EMAIL") ?? "notificacions@molletenalerta.example",
        to: userRes.user.email,
        subject: "Actualització d'una incidència a MOLLET EN ALERTA",
        html: `<p>${payload.record.message}</p>
               <p style="color:#5B6B72;font-size:12px;">MOLLET EN ALERTA és una plataforma ciutadana independent,
               no oficial de l'Ajuntament de Mollet del Vallès.</p>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Error enviant amb Resend:", body);
      return new Response("error sending email", { status: 500 });
    }

    return new Response("sent", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500 });
  }
});
