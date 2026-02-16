export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { profile } = req.body;

    const maxMinutes = (profile?.daily_hours || 2) * 60;

    const prompt = `
        You are an API that returns ONLY JSON.
        Return ONLY a valid JSON array. No text, no markdown, no explanation.

        Schema:
        [
        { "title": string, "subject": string, "duration_minutes": number }
        ]

        Rules:
        - 3 to 5 items only.
        - Total duration_minutes <= ${maxMinutes}.
        - Subjects relevant to ${profile?.target_exam || "General study"}.
        - Today-focused, practical tasks.

        If you cannot comply, return an empty JSON array: []
    `;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", errText);
      return res.status(500).json({ error: "Groq API error" });
    }

    const json = await groqRes.json();
    const text = json.choices?.[0]?.message?.content || "";

    // ---- Robust JSON extraction ----
    let jsonText = text.trim();

    // Remove ```json ``` fences if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json|```/g, "").trim();
    }

    // Extract first JSON array
    const match = jsonText.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error("AI raw output:", text);
      return res.status(200).json({ planText: null, raw: text });
    }

    return res.status(200).json({ planText: match[0] });
  } catch (err) {
    console.error("AI route error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}