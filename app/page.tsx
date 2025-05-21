"use client";
import Link from "next/link";
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Marcar como cargado después de que el componente se monte en el cliente
    setIsLoaded(true);

    // Verificar que podemos acceder a los APIs del navegador
    try {
      // Verificar que estamos en el cliente
      if (typeof window !== 'undefined') {
        console.log('Página cargada correctamente en el cliente');
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Error desconocido al cargar la página');
      }
      console.error('Error al cargar la página:', error);
    }
  }, []);

  if (errorMessage) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#e11d48' }}>Error al cargar la página</h1>
        <p>{errorMessage}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

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
      {isLoaded ? (
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
      ) : (
        <div style={{
          display: "inline-block",
          background: "#94a3b8",
          color: "white",
          fontWeight: 700,
          fontSize: "1.25rem",
          padding: "1rem 2.5rem",
          borderRadius: "999px",
          boxShadow: "0 4px 24px rgba(148,163,184,0.18)",
        }}>
          Cargando...
        </div>
      )}
      <div style={{ marginTop: "3rem", color: "#64748b", fontSize: "1rem" }}>
        <span>Proyecto educativo abierto · Next.js · PostgreSQL · MDX</span>
      </div>
    </main>
  );
}