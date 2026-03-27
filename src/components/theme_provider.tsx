"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "./common"

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("theme") === "dark"
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

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
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-xl"
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5">
        {dark ? (
          <Sun className="h-6 w-6 text-amber-500 transition-all animate-in zoom-in rotate-0" />
        ) : (
          <Moon className="h-6 w-6 text-slate-700 transition-all animate-in zoom-in rotate-0" />
        )}
      </div>
    </Button>
  )
}
