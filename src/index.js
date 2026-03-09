export default {
  async fetch(request, env) {
    // Only allow POST requests (form submissions)
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData.entries());

      // Format the email content for the notification
      const emailBody = Object.entries(data)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join("\n");

      // Send via MailChannels (Cloudflare's partner for serverless email)
      const send_request = new Request("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: "paul@rethinkyourit.co.nz", name: "Paul Aylett" }],
            },
          ],
          from: {
            email: "forms@rethinkyourit.co.nz",
            name: "Rethink Your IT Website",
          },
          subject: "New Website Enquiry",
          content: [
            {
              type: "text/plain",
              value: `New submission received from rethinkyourit.co.nz:\n\n${emailBody}`,
            },
          ],
        }),
      });

      const res = await fetch(send_request);

      if (res.ok) {
        // Redirect to your thank you page after success
        return Response.redirect("https://rethinkyourit.co.nz/thanks.html", 303);
      } else {
        const errorText = await res.text();
        console.error("MailChannels Error:", errorText);
        return new Response("Error sending enquiry. Please try again later.", { status: 500 });
      }
    } catch (err) {
      return new Response(`Worker Error: ${err.message}`, { status: 500 });
    }
  },
};
