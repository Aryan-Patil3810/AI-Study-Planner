import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-6">
        <h1 className="text-xl font-bold tracking-wide">AI Study Planner</h1>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded border border-white/20 hover:bg-white/10 transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center px-6 py-20">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Study smarter. <br />
            Let <span className="text-indigo-400">AI plan</span> your success.
          </h2>

          <p className="text-gray-300 max-w-xl mb-8">
            AI Study Planner creates personalized daily schedules, tracks your progress,
            keeps you consistent with streaks, and helps you optimize your learning —
            all in one clean dashboard.
          </p>

          <div className="flex gap-4">
            <Link
              to="/signup"
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Start for Free
            </Link>
            <Link
              to="/login"
              className="border border-white/20 hover:bg-white/10 px-6 py-3 rounded-lg transition"
            >
              I already have an account
            </Link>
          </div>

          {/* Trust badges / features */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-400">
            <div>⚡ Smart Plans</div>
            <div>📊 Progress Tracking</div>
            <div>🔥 Streaks</div>
            <div>🔔 Reminders</div>
          </div>
        </div>

        {/* Mock UI Card */}
        <div className="relative">
          <div className="bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Today’s Plan</h3>
            <ul className="space-y-3">
              <li className="flex justify-between bg-slate-800 p-3 rounded">
                <span>Physics – Kinematics</span>
                <span className="text-indigo-400">60 min</span>
              </li>
              <li className="flex justify-between bg-slate-800 p-3 rounded">
                <span>DSA – Arrays</span>
                <span className="text-indigo-400">45 min</span>
              </li>
              <li className="flex justify-between bg-slate-800 p-3 rounded">
                <span>Revision</span>
                <span className="text-indigo-400">30 min</span>
              </li>
            </ul>
            <div className="mt-4 h-2 bg-slate-800 rounded-full">
              <div className="h-2 w-2/3 bg-indigo-600 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm pb-6">
        © {new Date().getFullYear()} AI Study Planner. Built with ❤️ for focused learners.
      </footer>
    </div>
  );
}
