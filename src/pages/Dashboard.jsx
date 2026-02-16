import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tasksToday, setTasksToday] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [loading, setLoading] = useState(true);

  const [newTask, setNewTask] = useState({ title: "", subject: "", duration_minutes: 30 });
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", subject: "", duration_minutes: 30 });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return navigate("/login");
      const user = userData.user;

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(p);

      const { data: t } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: true });
      setTasksToday(t || []);

      const { data: s } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!s) {
        const { data: created } = await supabase
          .from("streaks")
          .insert({ user_id: user.id, current_streak: 0, longest_streak: 0 })
          .select()
          .single();
        setStreak(created || { current_streak: 0, longest_streak: 0 });
      } else setStreak(s);

      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      setLoading(false);
    };
    init();
  }, [navigate, today]);

  useEffect(() => {
    if (editingTask) {
      setEditForm({
        title: editingTask.title,
        subject: editingTask.subject,
        duration_minutes: editingTask.duration_minutes,
      });
    }
  }, [editingTask]);

  const refreshToday = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: true });
    setTasksToday(data || []);
  };

  const addTask = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!newTask.title) return alert("Enter a task title");

    await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTask.title,
      subject: newTask.subject,
      duration_minutes: newTask.duration_minutes,
      date: today,
      status: "pending",
    });

    setNewTask({ title: "", subject: "", duration_minutes: 30 });
    refreshToday();
  };

  const generateTodayPlan = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user || !profile) return;

    const { data: existing } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today);

    if (existing?.length) return alert("Today's plan already exists.");

    const exam = (profile.target_exam || "").toLowerCase();
    const topics = exam.includes("jee")
      ? [
          { title: "Physics Practice", subject: "Physics", topic: "Kinematics", duration: 60 },
          { title: "Chemistry Revision", subject: "Chemistry", topic: "Mole Concept", duration: 45 },
          { title: "Maths Practice", subject: "Mathematics", topic: "Quadratic Equations", duration: 45 },
        ]
      : [
          { title: "DSA Practice", subject: "DSA", topic: "Arrays", duration: 60 },
          { title: "DSA Practice", subject: "DSA", topic: "Strings", duration: 45 },
          { title: "Revise Concepts", subject: "Core CS", topic: "OOPS Basics", duration: 30 },
        ];

    const payload = topics.map((t) => ({
      user_id: user.id,
      title: t.title,
      subject: t.subject,
      topic: t.topic,
      duration_minutes: t.duration,
      date: today,
      status: "pending",
    }));

    await supabase.from("tasks").insert(payload);
    refreshToday();
  };

  const [aiLoading, setAiLoading] = useState(false);
  const generatePlanWithAI = async () => {
    try {
      setAiLoading(true);

      const res = await fetch("/api/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, today }),
      });

      const data = await res.json();
      const planText = data.planText;

      if (!planText) {
        console.log("AI raw output:", data.raw);
        alert("AI gave an unexpected format. Retrying usually fixes it.");
        setAiLoading(false);
        return;
      }

      let tasks;
      try {
        tasks = JSON.parse(planText);
      } catch (e) {
        console.log("AI raw JSON text:", planText);
        alert("AI response format issue. Click Generate again.");
        setAiLoading(false);
        return;
      }


      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      const payload = tasks.map((t) => ({
        user_id: user.id,
        title: t.title,
        subject: t.subject,
        duration_minutes: t.duration_minutes,
        date: today,
        status: "pending",
      }));

      await supabase.from("tasks").insert(payload);
      refreshToday();
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI plan.");
    } finally {
      setAiLoading(false);
    }
  };



  const optimizePlan = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const y = new Date();
    y.setDate(new Date().getDate() - 1);
    const ymd = y.toISOString().slice(0, 10);

    const { data: pending } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", ymd)
      .eq("status", "pending");

    if (!pending?.length) return alert("No pending tasks from yesterday.");

    const moved = pending.map((t) => ({
      user_id: user.id,
      title: t.title,
      subject: t.subject,
      topic: t.topic,
      duration_minutes: t.duration_minutes,
      date: today,
      status: "pending",
    }));

    await supabase.from("tasks").insert(moved);
    refreshToday();
    alert("Optimized: pending tasks moved to today.");
  };

  const toggleTask = async (task) => {
    const next = task.status === "completed" ? "pending" : "completed";
    await supabase.from("tasks").update({ status: next }).eq("id", task.id);
    refreshToday();
    updateStreakIfNeeded();
  };

  const updateStreakIfNeeded = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const { data: todayTasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("user_id", user.id)
      .eq("date", today);

    const anyCompleted = (todayTasks || []).some((t) => t.status === "completed");
    if (!anyCompleted) return;

    const { data: s } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const y = new Date();
    y.setDate(new Date().getDate() - 1);
    const ymd = y.toISOString().slice(0, 10);

    let nextStreak = 1;
    if (s?.last_completed_date === ymd) nextStreak = (s.current_streak || 0) + 1;

    const longest = Math.max(s?.longest_streak || 0, nextStreak);

    const { data: updated } = await supabase
      .from("streaks")
      .update({
        current_streak: nextStreak,
        longest_streak: longest,
        last_completed_date: today,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updated) setStreak(updated);
  };

  const remindMe = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Study Reminder", { body: "Time to complete your study tasks for today!" });
    } else alert("Enable browser notifications to receive reminders.");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard…
      </div>
    );
  }

  const completed = tasksToday.filter((t) => t.status === "completed").length;
  const progress = tasksToday.length ? Math.round((completed / tasksToday.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold mr-auto">
          Hi there, {profile?.username || profile?.full_name } 👋
        </h1>
        <button onClick={logout} className="bg-red-600 px-3 py-1 rounded text-sm">
          Logout
        </button>
      </div>

      {/* Add Task */}
      <div className="bg-slate-900 p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-3">Add a Task</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="p-2 rounded bg-slate-800"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <input
            className="p-2 rounded bg-slate-800"
            placeholder="Subject"
            value={newTask.subject}
            onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
          />
          <input
            type="number"
            className="p-2 rounded bg-slate-800"
            placeholder="Duration (min)"
            value={newTask.duration_minutes}
            onChange={(e) =>
              setNewTask({ ...newTask, duration_minutes: Number(e.target.value) })
            }
          />
          <button onClick={addTask} className="bg-indigo-600 rounded px-3 py-2">
            Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Tasks" value={tasksToday.length} />
        <StatCard title="Completed" value={completed} />
        <StatCard title="Progress" value={`${progress}%`} />
        <StatCard title="🔥 Streak" value={`${streak.current_streak} (Best ${streak.longest_streak})`} />
      </div>

      {/* Today */}
      <div className="bg-slate-900 p-4 rounded-xl mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold mr-auto">Today’s Plan</h2>
          <button
            onClick={generatePlanWithAI}
              disabled={aiLoading}
              className="bg-purple-600 px-3 py-1 rounded text-sm disabled:opacity-60"
          >
          {aiLoading ? "Generating..." : "Generate with AI ✨"}
        </button>

          <button onClick={optimizePlan} className="bg-emerald-600 px-3 py-1 rounded text-sm">
            Optimize (AI)
          </button>
          <button onClick={remindMe} className="bg-yellow-600 px-3 py-1 rounded text-sm">
            Remind Me
          </button>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-3 mb-4">
          <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${progress}%` }} />
        </div>

        {tasksToday.length === 0 ? (
          <p className="text-gray-400">No tasks yet for today.</p>
        ) : (
          <ul className="space-y-2">
            {tasksToday.map((task) => (
              <li
                key={task.id}
                className={`flex items-center justify-between p-3 rounded ${
                  task.status === "completed" ? "bg-green-700" : "bg-slate-800"
                }`}
              >
                <div>
                  <p className={`font-medium ${task.status === "completed" ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-400">
                    {task.subject} • {task.duration_minutes} min
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleTask(task)}
                    className="text-xs bg-black/30 px-2 py-1 rounded"
                  >
                    {task.status === "completed" ? "Undo" : "Done"}
                  </button>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-xs bg-indigo-600 px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <WeeklyCalendar />

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-5 rounded-xl w-full max-w-sm space-y-3">
            <h3 className="text-lg font-semibold">Edit Task</h3>
            <input
              className="w-full p-2 rounded bg-slate-800"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <input
              className="w-full p-2 rounded bg-slate-800"
              value={editForm.subject}
              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
            />
            <input
              type="number"
              className="w-full p-2 rounded bg-slate-800"
              value={editForm.duration_minutes}
              onChange={(e) =>
                setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })
              }
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await supabase.from("tasks").update(editForm).eq("id", editingTask.id);
                  setEditingTask(null);
                  refreshToday();
                }}
                className="bg-indigo-600 px-3 py-1 rounded"
              >
                Save
              </button>
              <button onClick={() => setEditingTask(null)} className="bg-gray-600 px-3 py-1 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyCalendar() {
  const [days, setDays] = useState([]);

  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(new Date().getDate() + i);
      arr.push(d.toISOString().slice(0, 10));
    }
    setDays(arr);
  }, []);

  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">This Week</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {days.map((date) => (
          <WeekDay key={date} date={date} />
        ))}
      </div>
    </div>
  );
}

function WeekDay({ date }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    supabase.from("tasks").select("id,title,status").eq("date", date).then(({ data }) => {
      setTasks(data || []);
    });
  }, [date]);

  return (
    <div className="bg-slate-800 p-3 rounded">
      <p className="text-sm text-gray-400 mb-1">{date}</p>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-500">No tasks</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((t) => (
            <li key={t.id} className="text-sm">
              • {t.title} {t.status === "completed" ? "✅" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
