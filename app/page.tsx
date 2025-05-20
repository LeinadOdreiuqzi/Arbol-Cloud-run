"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)",
        padding: 0,
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: 800,
          marginBottom: "1rem",
          color: "#1e293b",
          letterSpacing: "-1px",
          textAlign: "center",
        }}
      >
        Árbol del Conocimiento Científico
      </h1>
      <p
        style={{
          fontSize: "1.3rem",
          color: "#475569",
          maxWidth: 600,
          textAlign: "center",
          marginBottom: "2.5rem",
        }}
      >
        Explora el conocimiento científico de manera jerárquica e interactiva. Accede a áreas, especialidades, temas y contenido detallado desde una única plataforma.
      </p>
      <Link
        href="/pages-arbol"
        style={{
          display: "inline-block",
          background: "#2563eb",
          color: "white",
          fontWeight: 700,
          fontSize: "1.25rem",
          padding: "1rem 2.5rem",
          borderRadius: "999px",
          boxShadow: "0 4px 24px rgba(37,99,235,0.18)",
          textDecoration: "none",
          transition: "background 0.2s, transform 0.2s",
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')}
        onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}
      >
        Ir a la Wiki
      </Link>
      <div style={{ marginTop: "3rem", color: "#64748b", fontSize: "1rem" }}>
        <span>Proyecto educativo abierto · Next.js · PostgreSQL · MDX</span>
      </div>
    </main>
  );
}