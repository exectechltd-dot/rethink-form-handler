export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData.entries());

      const emailBody = Object.entries(data)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join("\n");

      // MailChannels Send Request with DKIM Signing
      const mcResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ 
            to: [{ email: "paul@rethinkyourit.co.nz", name: "Paul Aylett" }],
            // DKIM configuration
            dkim_domain: "rethinkyourit.co.nz",
            dkim_selector: "mailchannels",
            dkim_private_key: env.DKIM_PRIVATE_KEY, 
          }],
          from: { 
            email: "forms@rethinkyourit.co.nz", 
            name: "Rethink Your IT" 
          },
          subject: "New Website Health Check Submission",
          content: [{ 
            type: "text/plain", 
            value: `New submission received:\n\n${emailBody}` 
          }],
        }),
      });

      // Logging for troubleshooting
      const mcStatus = mcResponse.status;
      const mcText = await mcResponse.text();
      console.log(`MailChannels Status: ${mcStatus}`);
      console.log(`MailChannels Response: ${mcText}`);

      return new Response(JSON.stringify({ success: true, mcStatus }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  },
};
