"use client";
import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true); // Default to dark

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    // On mount, set theme from localStorage or default to dark
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      setDark(false);
    } else {
      setDark(true); // Default to dark theme
    }
    // Apply theme immediately on mount
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <button
      className={`transition px-3 py-2 rounded-full shadow-lg border-2 border-indigo-200 bg-white/80 dark:bg-gray-900 dark:border-gray-700 text-indigo-700 dark:text-yellow-300 font-bold text-lg focus:outline-none hover:scale-110 hover:shadow-xl`}
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle light/dark mode"
      style={{ minWidth: 44 }}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
