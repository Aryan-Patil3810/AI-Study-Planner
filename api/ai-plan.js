export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { profile, today } = req.body;

    const prompt = `
You are an expert AI study planner.
Create a realistic study plan for today.

User:
- Target exam: ${profile?.target_exam || "General"}
- Daily study hours: ${profile?.daily_hours || 2}
- Exam date: ${profile?.exam_date || "Not specified"}

Return ONLY valid JSON array with fields:
title, subject, duration_minutes
`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,  // 👈 KEY USED HERE
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", errText);
      return res.status(500).json({ error: "Groq API error" });
    }

    const json = await groqRes.json();
    const text = json.choices?.[0]?.message?.content;

    return res.status(200).json({ planText: text });
  } catch (err) {
    console.error("AI route error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
