import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) navigate("/dashboard");
    else alert(error.message);
  };

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (!error) alert("Check email to confirm!");
    else alert(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="bg-slate-900 p-6 rounded-xl w-80 space-y-4">
        <h1 className="text-xl font-bold text-center">AI Study Planner</h1>
        <input
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-2 rounded bg-slate-800"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} className="w-full bg-indigo-600 py-2 rounded">
          Login
        </button>
        <button onClick={handleSignup} className="w-full border border-indigo-600 py-2 rounded">
          Sign Up
        </button>
      </div>
    </div>
  );
}