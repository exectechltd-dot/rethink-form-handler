export default {
  async fetch(request, env) {
    // 1. UNIVERSAL CORS - Allow the browser to talk to the worker
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData.entries());

      // Format the email
      const emailBody = Object.entries(data)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join("\n");

      // 2. DISPATCH TO MAILCHANNELS
      const mcResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: "paul@rethinkyourit.co.nz", name: "Paul Aylett" }] }],
          from: { email: "forms@rethinkyourit.co.nz", name: "Rethink Your IT" },
          subject: "New Health Check Submission",
          content: [{ type: "text/plain", value: emailBody }],
        }),
      });

      // 3. SUCCESS RESPONSE
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },
};
