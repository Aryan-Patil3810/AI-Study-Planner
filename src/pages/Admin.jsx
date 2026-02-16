import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [allowed, setAllowed] = useState(false);
  const [topics, setTopics] = useState([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return navigate("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "admin") {
        alert("Access denied");
        return navigate("/dashboard");
      }

      setAllowed(true);
      fetchTopics();
    };

    const fetchTopics = async () => {
      const { data } = await supabase.from("topics").select("*").order("created_at", {
        ascending: false,
      });
      setTopics(data || []);
    };

    checkAdmin();
  }, [navigate]);

  const addTopic = async () => {
    await supabase.from("topics").insert({ subject, topic, difficulty });
    setSubject("");
    setTopic("");
    setDifficulty("easy");
    const { data } = await supabase.from("topics").select("*").order("created_at", {
      ascending: false,
    });
    setTopics(data || []);
  };

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold mr-auto">Admin Panel</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-gray-700 px-3 py-1 rounded">
          Back to Dashboard
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl mb-6 max-w-md space-y-2">
        <h2 className="font-semibold mb-2">Add Topic</h2>
        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <select
          className="w-full p-2 rounded bg-slate-800"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button onClick={addTopic} className="w-full bg-indigo-600 py-2 rounded">
          Add Topic
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-3">All Topics</h2>
        <ul className="space-y-2">
          {topics.map((t) => (
            <li key={t.id} className="bg-slate-800 p-2 rounded text-sm">
              {t.subject} — {t.topic} ({t.difficulty})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}