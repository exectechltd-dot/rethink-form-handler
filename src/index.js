export default {
  async fetch(request, env) {
    // 1. Handle CORS (Cross-Origin Resource Sharing)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Respond to browser pre-flight checks
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData.entries());

      // Format the email content
      const emailBody = Object.entries(data)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join("\n");

      // 2. Dispatch to MailChannels
      const mcResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ 
            to: [{ email: "paul@rethinkyourit.co.nz", name: "Paul Aylett" }] 
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

      // 3. Return a clean JSON success response
      return new Response(JSON.stringify({ success: true }), {
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
