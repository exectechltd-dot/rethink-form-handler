const scoreMap = {
  // Q1 — Foundations (IT response time)
  'same-day': 1, 'day-or-two': 2, 'days-weeks': 3, 'no-plan': 4,
  // Q2 — Security (data awareness)
  'aware-plan': 1, 'aware-no-plan': 2, 'not-thought': 3, 'unsure': 4,
  // Q3 — IT Advisory (tech spend)
  'yes-value': 1, 'know-not-sure': 2, 'paying-not-using': 3, 'no-idea': 4,
  // Q4 — Security (cyber protection)
  'covered': 1, 'partial': 2, 'procrastinating': 3,
  // Q5 — IT Advisory / AI Ops (tech alignment)
  'supports': 1, 'mixed': 2, 'runs-us': 3,
};

function scoreAnswer(answer) {
  return scoreMap[answer] ?? 4;
}

function avgScore(...values) {
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

async function runHealthCheckPipeline(data, env) {
  const name = data['name'] || data['first-name'] || '';
  console.log('Health Check pipeline started for:', data['business-name'] || data['businessName'] || data['business_name'] || '');
  const businessName = data['business-name'] || data['businessName'] || data['business_name'] || '';
  const email = data['email'] || '';
  const phone = data['phone'] || '';
  const q1 = data['q1'] || '';
  const q2 = data['q2'] || '';
  const q3 = data['q3'] || '';
  const q4 = data['q4'] || '';
  const q5 = data['q5'] || '';

  // Step 1 — Score the answers
  const foundationsScore = scoreAnswer(q1);
  const securityScore = avgScore(scoreAnswer(q2), scoreAnswer(q4));
  const aiScore = scoreAnswer(q5);
  const advisoryScore = avgScore(scoreAnswer(q3), scoreAnswer(q5));

  // Step 2 — Brave Search
  let snippets = 'No web results found.';
  try {
    const searchQuery = `${businessName} New Zealand`;
    const braveRes = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=3`,
      { headers: { 'Accept': 'application/json', 'X-Subscription-Token': env.BRAVE_API_KEY } }
    );
    console.log('Brave status:', braveRes.status);
    const braveData = await braveRes.json();
    const results = (braveData.web?.results || []).slice(0, 3);
    if (results.length > 0) {
      snippets = results.map(r => `- ${r.title}: ${r.description}`).join('\n');
    }
  } catch (err) {
    console.error('Brave Search failed:', err.message);
  }

  // Step 3 — Claude API Call
  let aiOutput = null;
  let claudeFailed = false;
  try {
    const prompt = `You are helping a small IT consultancy owner (Paul) prepare for a conversation with a prospective client.

BUSINESS DETAILS
Name: ${name}
Business: ${businessName}
Web research snippets:
${snippets}

HEALTHCHECK ANSWERS
Q1 (IT response time): ${q1}
Q2 (Data awareness): ${q2}
Q3 (Tech spend awareness): ${q3}
Q4 (Cyber protection): ${q4}
Q5 (Tech alignment): ${q5}

PILLAR SCORES (1=healthy, 4=urgent)
Foundations: ${foundationsScore}/4
Security & Networking: ${securityScore}/4
AI Operations: ${aiScore}/4
IT Advisory: ${advisoryScore}/4

THE COMPANY (context for tone and services):
Rethink Your IT is a one-person IT consultancy based in Cambridge, Waikato, NZ. Paul works with a small number of SME clients at a time. Four service pillars: Foundations (hands-on IT support), Security & Networking (cyber resilience), AI Operations (practical automation and AI), IT Advisory (fractional CIO). Plain English, no jargon, no corporate speak. British spelling.

PRODUCE THE FOLLOWING — use these exact headings:

## BUSINESS BRIEF
2–3 sentences. What kind of business this likely is, what their IT reality probably looks like based on their answers, and what kind of client they would be. Plain English. Practical. No fluff.

## PILLAR ANALYSIS
One bullet per pillar. Format: "· [Pillar name] (score: X/4): [what their answer signals and the conversation angle for Paul]"

## DRAFT CUSTOMER EMAIL
A warm, plain-English email from Paul to ${name}. Acknowledge they completed the health check. Do not reveal scores or use jargon. Set the expectation that Paul will be in touch to have a conversation. Sign off as Paul. British spelling. Friendly but not salesy.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    console.log('Anthropic status:', anthropicRes.status);
    const anthropicData = await anthropicRes.json();
    aiOutput = anthropicData.content[0].text;
  } catch (err) {
    console.error('Claude API failed:', err.message);
    claudeFailed = true;
  }

  // Step 4 — Send Brief Email to Paul
  const date = new Date().toLocaleDateString('en-NZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const subject = claudeFailed
    ? `[Manual Review] Health Check — ${businessName} — ${date}`
    : `Health Check — ${businessName} — ${date}`;

  let emailBody;
  if (claudeFailed) {
    emailBody = [
      'CONTACT',
      `Name:     ${name}`,
      `Business: ${businessName}`,
      `Email:    ${email}`,
      `Phone:    ${phone || 'not provided'}`,
      '',
      '---',
      '',
      '[AI PIPELINE FAILED — MANUAL REVIEW REQUIRED]',
      '',
      'PILLAR SCORES',
      `Foundations: ${foundationsScore}/4`,
      `Security & Networking: ${securityScore}/4`,
      `AI Operations: ${aiScore}/4`,
      `IT Advisory: ${advisoryScore}/4`,
      '',
      '---',
      '',
      'RAW ANSWERS',
      `Q1: ${q1}`,
      `Q2: ${q2}`,
      `Q3: ${q3}`,
      `Q4: ${q4}`,
      `Q5: ${q5}`,
    ].join('\n');
  } else {
    emailBody = [
      'CONTACT',
      `Name:     ${name}`,
      `Business: ${businessName}`,
      `Email:    ${email}`,
      `Phone:    ${phone || 'not provided'}`,
      '',
      '---',
      '',
      aiOutput,
      '',
      '---',
      '',
      'RAW ANSWERS',
      `Q1: ${q1}`,
      `Q2: ${q2}`,
      `Q3: ${q3}`,
      `Q4: ${q4}`,
      `Q5: ${q5}`,
    ].join('\n');
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@rethinkyourit.co.nz',
        to: ['paul@rethinkyourit.co.nz'],
        subject,
        text: emailBody,
      }),
    });
    console.log('Brief email sent, status:', res.status);
  } catch (err) {
    console.error('Brief email send failed:', err.message);
  }
}

export default {
  async fetch(request, env, ctx) {
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

      const formType = data["form-type"] || "Website";
      console.log('Form type received:', formType);
      const subject = `New ${formType} Submission`;

      // Existing raw submission email (unchanged for all form types)
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

      // Health Check AI pipeline — run in background, doesn't block response
      if (formType === 'Health Check') {
        ctx.waitUntil(runHealthCheckPipeline(data, env));
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
