import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    target_exam: "",
    daily_hours: 2,
    exam_date: "",
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name: form.full_name,
      username: form.username,
      target_exam: form.target_exam || null,
      daily_hours: form.daily_hours,
      exam_date: form.exam_date || null,
    });

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSignup}
        className="bg-slate-900 p-6 rounded-xl w-full max-w-md space-y-3"
      >
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>

        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />

        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Target Exam / Goal</label>
          <input
            className="w-full p-2 rounded bg-slate-800"
            placeholder="e.g., JEE, GATE, Placements, DSA Prep"
            value={form.target_exam}
            onChange={(e) => setForm({ ...form, target_exam: e.target.value })}
          />
          <p className="text-xs text-gray-400">
            Tell us what you’re preparing for so we can personalize your study plan.
          </p>
        </div>


        <div className="space-y-1">
          <label className="text-sm text-gray-300">Daily Study Hours</label>
          <input
            type="number"
            min={1}
            max={12}
            className="w-full p-2 rounded bg-slate-800"
            placeholder="e.g., 3"
            value={form.daily_hours}
            onChange={(e) =>
              setForm({ ...form, daily_hours: Number(e.target.value) })
            }
          />
          <p className="text-xs text-gray-400">
            How many hours can you study per day on average?
          </p>
        </div>


        <div className="space-y-1">
          <label className="text-sm text-gray-300">Exam Date / Target Deadline (Optional)</label>
          <input
            type="date"
            className="w-full p-2 rounded bg-slate-800"
            value={form.exam_date}
            onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
          />
          <p className="text-xs text-gray-400">
            If you don’t know the exact date, you can skip this for now and update later.
          </p>
        </div>



        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded font-semibold"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}