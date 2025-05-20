"use client";
import React, { useEffect, useState } from "react";

type ThemeType = "light" | "dark" | "sepia";

interface ThemeToggleProps {
  style?: React.CSSProperties;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const [theme, setTheme] = useState<ThemeType>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as ThemeType | null;
    if (stored && ["light", "dark", "sepia"].includes(stored)) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    const themeOrder: ThemeType[] = ["light", "sepia", "dark"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  if (!mounted) return null; // Hide until client-side

  // Colores optimizados para cada tema que reducen fatiga visual
  const themeStyles = {
    light: {
      background: "#f9f9f9",
      color: "#2d3748",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
    },
    sepia: {
      background: "#f5efdc",
      color: "#433422",
      border: "1px solid #e6d9be",
      boxShadow: "0 1px 3px rgba(122, 95, 51, 0.1)"
    },
    dark: {
      background: "#2a2b36",
      color: "#e2e8f0",
      border: "1px solid #3a3b47",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
    }
  };

  const themeIcons = {
    light: "☀️",
    sepia: "📙",
    dark: "🌙"
  };

  const activeTheme = themeStyles[theme];

  return (
    <div className="theme-toggle-container" style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "center",
      ...style
    }}>
      <button
        className="theme-toggle"
        onClick={cycleTheme}
        aria-label={`Current theme: ${theme}. Click to change theme.`}
        title={`Current theme: ${theme}. Click to change theme.`}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0",
          width: "38px",
          height: "38px",
          zIndex: 1,
          background: activeTheme.background,
          color: activeTheme.color,
          border: activeTheme.border,
          borderRadius: "8px",
          fontSize: 18,
          cursor: "pointer",
          boxShadow: activeTheme.boxShadow,
          transition: "all 0.25s ease",
        }}
      >
        {themeIcons[theme]}
      </button>
      <span style={{
        fontSize: "0.7rem",
        opacity: 0.8,
        color: "var(--foreground)",
        textAlign: "center",
        marginTop: "-2px"
      }}>
        {theme === "light" ? "Claro" : theme === "sepia" ? "Sepia" : "Oscuro"}
      </span>
    </div>
  );
};

export default ThemeToggle;