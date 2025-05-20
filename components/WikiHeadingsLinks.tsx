"use client";
import React, { useEffect, useState } from "react";

// Utility to extract headings from rendered MDX content
type Heading = { id: string; text: string; level: number };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function WikiHeadingsLinks() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Helper to extract headings
  function extractHeadings() {
    // Try .prose, fallback to .wiki-main, fallback to body
    const contentRoot =
      document.querySelector(".prose") ||
      document.querySelector(".wiki-main") ||
      document.body;
    const nodes = Array.from(contentRoot.querySelectorAll("h1, h2, h3"));
    const hs: Heading[] = nodes.map((node) => {
      const text = node.textContent || "";
      let id = node.id;
      if (!id) {
        id = slugify(text);
        node.id = id;
      }
      // Ensure scroll-margin for fixed headers
      (node as HTMLElement).style.scrollMarginTop = "80px";
      const level =
        node.tagName === "H1" ? 1 : node.tagName === "H2" ? 2 : 3;
      return { id, text, level };
    });
    setHeadings(hs);
  }

  // Detectar el tema actual
  useEffect(() => {
    if (typeof window !== "undefined") {
      const detectTheme = () => {
        const dataTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
        setTheme(dataTheme || 'light');
      };
      
      detectTheme();
      
      // Observar cambios en el tema
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'data-theme') {
            detectTheme();
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    extractHeadings();
    // Listen for DOM changes (e.g., after client-side navigation)
    const observer = new MutationObserver(extractHeadings);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: false,
    });
    return () => observer.disconnect();
  }, []);

  if (!headings.length) return null;

  // Definir colores basados en el tema
  const headerColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  const borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const bgColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)';
  const hoverBgColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';

  return (
    <div className="wiki-related" style={{ 
      padding: "0.75rem 1rem",
      borderRadius: "6px",
      background: bgColor,
      border: `1px solid ${borderColor}`,
      marginTop: "1.5rem",
      transition: "all 0.3s ease",
      maxWidth: "100%",
      overflowX: "hidden"
    }}>
      <h3 style={{ 
        fontSize: "0.9rem", 
        fontWeight: 600, 
        marginTop: 0,
        marginBottom: "0.75rem", 
        color: headerColor,
        letterSpacing: "0.01em",
        paddingBottom: "0.5rem",
        borderBottom: `1px solid ${borderColor}`
      }}>
        En esta página
      </h3>
      <ul style={{ 
        margin: 0, 
        padding: 0, 
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        width: "100%"
      }}>
        {headings.map((h) => (
          <li 
            key={h.id} 
            style={{ 
              marginLeft: (h.level - 1) * 8,
              transition: "all 0.2s ease",
              maxWidth: "100%"
            }}
          >
            <a
              href={`#${h.id}`}
              className={h.level === 1 ? "wiki-anchor-main" : "wiki-anchor-secondary"}
              style={{ 
                display: "block",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                transition: "all 0.2s ease",
                fontSize: h.level === 1 ? "0.88rem" : "0.82rem",
                borderLeft: h.level === 1 ? 
                  `2px solid ${theme === 'dark' ? 'rgba(96, 165, 250, 0.4)' : 'rgba(37, 99, 235, 0.25)'}` : 
                  'none',
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                maxWidth: "100%"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBgColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={h.text}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}