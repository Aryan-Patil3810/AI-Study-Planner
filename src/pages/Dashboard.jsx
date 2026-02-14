import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <button onClick={logout} className="mt-4 bg-red-600 px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
}