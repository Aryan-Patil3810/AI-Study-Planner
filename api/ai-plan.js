export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { profile, today } = req.body;

    const prompt = `
        Return ONLY a valid JSON array. Do NOT include any explanation or text.

        Each item must be an object with EXACT keys:
        - title (string)
        - subject (string)
        - duration_minutes (number)

        Rules:
        - 3 to 5 items only.
        - Total duration_minutes should be <= ${profile?.daily_hours ? profile.daily_hours * 60 : 120}.
        - Make the plan realistic for today.
        - Subjects should match the target exam: ${profile?.target_exam || "General"}.

        Example output (format only):
        [
        {"title":"Physics Practice","subject":"Physics","duration_minutes":60},
        {"title":"Chemistry Revision","subject":"Chemistry","duration_minutes":45}
        ]
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
    const text = json.choices?.[0]?.message?.content || "";

    // ✅ JSON extractor (place here)
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
        console.error("AI raw output:", text);
        return res.status(500).json({ error: "AI did not return valid JSON" });
    }

    // Send only clean JSON array to frontend
    return res.status(200).json({ planText: match[0] });


    return res.status(200).json({ planText: text });
  } catch (err) {
    console.error("AI route error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
