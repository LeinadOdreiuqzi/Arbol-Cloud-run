'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import HierarchicalNavigation from './HierarchicalNavigation';
import { TopicNode } from '@/lib/notes-graph-util';

// Importamos la función fetchPageHierarchy desde el servicio
import { fetchPageHierarchy } from '@/lib/page-hierarchy-service';

interface PageHierarchyNavigationProps {
  selectedSlug?: string | null;
  theme?: 'dark' | 'light';
}

/**
 * Componente que carga la jerarquía de páginas desde la API
 * y las muestra utilizando el componente HierarchicalNavigation
 */
const PageHierarchyNavigation: React.FC<PageHierarchyNavigationProps> = ({ selectedSlug = null, theme: propTheme }) => {
  const [nodes, setNodes] = useState<TopicNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = propTheme || (resolvedTheme as 'dark' | 'light') || 'light';
  
  // Cargar la jerarquía de páginas al montar el componente
  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        setLoading(true);
        
        // Implementamos un timeout para mostrar un mensaje si la carga tarda demasiado
        const timeoutId = setTimeout(() => {
          if (loading) {
            console.log('La carga está tardando más de lo esperado...');
            // Podríamos actualizar el estado para mostrar un mensaje diferente
          }
        }, 5000);
        
        const hierarchyData = await fetchPageHierarchy();
        setNodes(hierarchyData);
        setError(null);
        
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Error al cargar la jerarquía:', err);
        setError('No se pudo cargar la estructura de páginas');
      } finally {
        setLoading(false);
      }
    };
    
    loadHierarchy();
  }, []);
  
  // Función para reintentar la carga en caso de error
  const handleRetry = useCallback(() => {
    const loadHierarchy = async () => {
      try {
        setLoading(true);
        setError(null);
        const hierarchyData = await fetchPageHierarchy();
        setNodes(hierarchyData);
      } catch (err) {
        console.error('Error al reintentar cargar la jerarquía:', err);
        setError('No se pudo cargar la estructura de páginas');
      } finally {
        setLoading(false);
      }
    };
    
    loadHierarchy();
  }, []);
  
  if (loading) {
    return (
      <div className="loading-container" style={{ 
        padding: '20px', 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="loading-spinner" style={{ 
          width: '40px', 
          height: '40px', 
          margin: '0 auto',
          border: `4px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderLeftColor: theme === 'dark' ? '#60a5fa' : '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ 
          marginTop: '10px', 
          fontSize: '0.9rem', 
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
        }}>
          Cargando estructura de páginas...
        </p>
        <p style={{ 
          fontSize: '0.8rem', 
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
          maxWidth: '200px',
          marginTop: '5px'
        }}>
          Esto puede tardar unos momentos si hay muchas páginas
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container" style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: 'var(--text-error)',
        backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
        borderRadius: '8px',
        margin: '10px'
      }}>
        <p style={{ fontSize: '0.9rem' }}>
          <span style={{ marginRight: '8px' }}>⚠️</span>
          {error}
        </p>
        <button 
          onClick={handleRetry}
          style={{
            marginTop: '10px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
            color: theme === 'dark' ? '#60a5fa' : '#2563eb',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <HierarchicalNavigation 
      nodes={nodes} 
      selectedSlug={selectedSlug} 
      theme={theme} 
    />
  );
};

export default PageHierarchyNavigation;