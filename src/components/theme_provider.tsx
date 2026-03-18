"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark")
      setDark(true)
    } else {
      document.documentElement.classList.remove("dark")
      setDark(false)
    }
  }, [])

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }

    setDark(!dark)
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-xl transition-all"
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5">
        {dark ? (
          <Sun className="h-6 w-6 text-amber-500 transition-all animate-in zoom-in rotate-0" />
        ) : (
          <Moon className="h-6 w-6 text-slate-700 transition-all animate-in zoom-in rotate-0" />
        )}
      </div>
    </button>
  )
}