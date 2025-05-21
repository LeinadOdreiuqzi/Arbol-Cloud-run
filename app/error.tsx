'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ color: '#e11d48', fontSize: '2rem', marginBottom: '1rem' }}>
        Error en la aplicación
      </h1>
      <div style={{ 
        background: '#fee2e2', 
        borderRadius: '0.5rem', 
        padding: '1rem', 
        marginBottom: '1rem',
        textAlign: 'left',
        overflow: 'auto'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Detalles del error:</p>
        <pre style={{ fontSize: '0.875rem' }}>
          {error?.message || 'Error desconocido'}
        </pre>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            ID de diagnóstico: {error.digest}
          </p>
        )}
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <p style={{ marginBottom: '1rem' }}>
          Esto podría deberse a un problema de conexión a la base de datos o a un error en la carga de la página.
        </p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Intentar nuevamente
        </button>
        <div style={{ marginTop: '1rem' }}>
          <a
            href="/"
            style={{
              color: '#2563eb',
              textDecoration: 'underline',
              display: 'inline-block',
              marginTop: '0.5rem'
            }}
          >
            Volver a la página principal
          </a>
        </div>
      </div>
    </div>
  );
}
