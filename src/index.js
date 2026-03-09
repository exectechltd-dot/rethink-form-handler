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

      // Determine subject from form type if provided, else default
      const formType = data["form-type"] || "Website";
      const subject = `New ${formType} Submission`;

      // Resend API Send Request
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "no-reply@forms.rethinkyourit.co.nz",
          to: ["paul@rethinkyourit.co.nz"],
          reply_to: "paul@rethinkyourit.co.nz",
          subject: subject,
          text: `New submission received:\n\n${emailBody}`,
        }),
      });

      const resendStatus = resendResponse.status;
      const resendText = await resendResponse.text();
      console.log(`Resend Status: ${resendStatus}`);
      console.log(`Resend Response: ${resendText}`);

      if (resendStatus >= 400) {
        throw new Error(`Resend error ${resendStatus}: ${resendText}`);
      }

      return new Response(JSON.stringify({ success: true, resendStatus }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
