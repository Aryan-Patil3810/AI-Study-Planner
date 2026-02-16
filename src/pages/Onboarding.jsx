import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [fullName, setFullName] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) navigate("/");
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("Not authenticated");
      setLoading(false);
      return;
    }

    // 1. Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        target_exam: targetExam,
        daily_hours: dailyHours,
      })
      .eq("id", user.id);

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    // 2. Create study plan
    const { error: planError } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: examDate,
      });

    if (planError) {
      alert(planError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 p-6 rounded-xl w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Set up your study plan</h1>

        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Target Exam (e.g. JEE / DSA)"
          value={targetExam}
          onChange={(e) => setTargetExam(e.target.value)}
          required
        />

        <input
          type="number"
          min="1"
          max="12"
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Daily Study Hours"
          value={dailyHours}
          onChange={(e) => setDailyHours(e.target.value)}
          required
        />

        <input
          type="date"
          className="w-full p-2 rounded bg-slate-800"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 py-2 rounded font-semibold"
        >
          {loading ? "Creating plan..." : "Create Study Plan"}
        </button>
      </form>
    </div>
  );
}