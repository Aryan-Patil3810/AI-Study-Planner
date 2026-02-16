export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { profile } = req.body;
    const maxMinutes = (profile?.daily_hours || 2) * 60;

    const prompt = `
Return ONLY JSON with this exact schema:

{
  "tasks": [
    { "title": string, "subject": string, "duration_minutes": number }
  ]
}

Rules:
- 3 to 5 tasks.
- Total duration_minutes <= ${maxMinutes}.
- Subjects relevant to ${profile?.target_exam || "General"}.
- Today-focused tasks.
`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }, // ✅ force JSON
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", errText);
      return res.status(200).json({ planText: "[]" }); // always return safe JSON
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content;

    // Final safety parse
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("JSON parse failed. Raw:", content);
      return res.status(200).json({ planText: "[]" }); // never break frontend
    }

    const tasks = parsed?.tasks || [];
    return res.status(200).json({ planText: JSON.stringify(tasks) });
  } catch (err) {
    console.error("AI route error:", err);
    return res.status(200).json({ planText: "[]" }); // never break frontend
  }
}