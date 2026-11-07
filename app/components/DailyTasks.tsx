"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  done: boolean;
  dayKey: string;
};

const STORAGE_KEY = "daily-tasks-v1";

function dayKeyFromDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const todayKey = dayKeyFromDate();

  useEffect(() => {
    setTasks(loadTasks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTasks(tasks);
  }, [tasks, hydrated]);

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dayKey === todayKey),
    [tasks, todayKey]
  );

  const doneCount = todayTasks.filter((t) => t.done).length;
  const total = todayTasks.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const addTask = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const title = draft.trim();
      if (!title) return;
      setTasks((prev) => [
        ...prev,
        { id: newId(), title, done: false, dayKey: todayKey },
      ]);
      setDraft("");
    },
    [draft, todayKey]
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setTasks((prev) =>
      prev.filter((t) => !(t.dayKey === todayKey && t.done))
    );
  }, [todayKey]);

  const dateLabel = formatPersianDate(new Date());

  return (
    <div className="tasks-app">
      <header className="tasks-header">
        <div>
          <p className="tasks-eyebrow">برنامه امروز</p>
          <h1 className="tasks-title">کارهای روزانه</h1>
          <p className="tasks-date">{dateLabel}</p>
        </div>
        {total > 0 && (
          <div className="tasks-progress" aria-label={`پیشرفت: ${progress} درصد`}>
            <span className="tasks-progress-value">{progress}٪</span>
            <span className="tasks-progress-label">
              {doneCount} از {total} انجام شد
            </span>
          </div>
        )}
      </header>

      <form className="tasks-form" onSubmit={addTask}>
        <label className="visually-hidden" htmlFor="new-task">
          کار جدید
        </label>
        <input
          id="new-task"
          type="text"
          className="tasks-input"
          placeholder="مثلاً: ورزش، تماس با مشتری، خرید…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="off"
          disabled={!hydrated}
        />
        <button type="submit" className="tasks-btn tasks-btn-primary" disabled={!draft.trim()}>
          افزودن
        </button>
      </form>

      <ul className="tasks-list" aria-live="polite">
        {!hydrated && (
          <li className="tasks-empty">در حال بارگذاری…</li>
        )}
        {hydrated && todayTasks.length === 0 && (
          <li className="tasks-empty">
            هنوز کاری برای امروز ندارید. اولین مورد را اضافه کنید.
          </li>
        )}
        {todayTasks.map((task) => (
          <li key={task.id} className={`tasks-item${task.done ? " is-done" : ""}`}>
            <label className="tasks-check">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span className="tasks-check-ui" aria-hidden />
            </label>
            <span className="tasks-item-title">{task.title}</span>
            <button
              type="button"
              className="tasks-btn-icon"
              onClick={() => removeTask(task.id)}
              aria-label={`حذف: ${task.title}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {doneCount > 0 && (
        <div className="tasks-footer">
          <button type="button" className="tasks-btn tasks-btn-ghost" onClick={clearDone}>
            پاک کردن انجام‌شده‌ها
          </button>
        </div>
      )}

      <p className="tasks-hint">
        کارها در همین مرورگر ذخیره می‌شوند و هر روز لیست جداگانه دارید.
      </p>
    </div>
  );
}
