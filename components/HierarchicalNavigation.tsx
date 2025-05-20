'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { TopicNode } from '@/lib/notes-graph-util';

interface HierarchicalNavigationProps {
  nodes: TopicNode[];
  selectedSlug: string | null;
  theme: 'dark' | 'light';
}

// Extend the TopicNode type to include ancestors for search results
interface TopicNodeWithPath extends TopicNode {
  ancestors?: {
    id: string;
    label: string;
    slug: string;
    url: string;
  }[];
}

// Función para obtener el nivel de profundidad de un nodo
const getNodeLevel = (node: TopicNode): number => {
  // Si el nodo tiene metadatos con nivel, usamos ese valor
  if (node.metadata?.level) {
    return node.metadata.level;
  }
  
  // Como fallback, extraemos el nivel del nodo basado en la estructura de la URL
  const urlParts = node.url.split('/');
  return urlParts.length - 2; // Ajustar según la estructura real
};

// Función para obtener el tipo de nodo basado en su nivel o metadatos
const getNodeType = (node: TopicNode): string => {
  // Si el nodo tiene metadatos con tipo, usamos ese valor
  if (node.metadata?.type) {
    // Convertir primera letra a mayúscula
    const type = node.metadata.type;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  // Como fallback, determinamos el tipo basado en el nivel
  const level = getNodeLevel(node);
  switch (level) {
    case 1: return 'Área';
    case 2: return 'Especialidad';
    case 3: return 'Tema';
    case 4: return 'Contenido';
    default: return `Nivel ${level}`;
  }
};

// Componente de nodo optimizado con React.memo para evitar re-renderizados innecesarios
const TreeNode = React.memo(({ 
  node, 
  depth, 
  isLastChild, 
  parentId, 
  isExpanded, 
  isSelected, 
  isFavorite,
  theme,
  onToggleExpand, 
  onToggleFavorite 
}: {
  node: TopicNode;
  depth: number;
  isLastChild: boolean;
  parentId: string | null;
  isExpanded: boolean;
  isSelected: boolean;
  isFavorite: boolean;
  theme: 'dark' | 'light';
  onToggleExpand: (nodeId: string) => void;
  onToggleFavorite: (nodeId: string) => void;
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const nodeLevel = getNodeLevel(node);
  const nodeType = getNodeType(node);
  
  // Calcular colores para el tema
  const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  const mutedTextColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.5)';
  const highlightColor = theme === 'dark' ? '#60a5fa' : '#2563eb';
  const borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
  const expandButtonColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)';
  
  // Calcular el estilo de indentación basado en la profundidad
  // Usamos un enfoque que limita la indentación máxima y usa colores para diferenciar niveles
  const maxIndent = 32; // Indentación máxima en píxeles
  const baseIndent = 8; // Indentación base por nivel
  const actualIndent = depth > 0 ? Math.min(depth * baseIndent, maxIndent) : 0;
  
  // Determinar el color de borde izquierdo basado en el nivel para ayudar a distinguir visualmente
  const getBorderColor = () => {
    if (depth === 0) return 'transparent';
    
    // Colores más sutiles para diferentes niveles de profundidad
    const levelColors = theme === 'dark' 
      ? ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'] 
      : ['#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669'];
    
    // Usar un color basado en el módulo para ciclar a través de los colores
    const baseColor = levelColors[(depth - 1) % levelColors.length];
    
    // Hacer el color más sutil con transparencia
    return theme === 'dark'
      ? `${baseColor}80` // 50% de opacidad
      : `${baseColor}40`; // 25% de opacidad
  };
  
  // Determinar el estilo de fondo basado en el nivel
  const getBackgroundStyle = () => {
    if (depth === 0) return 'transparent';
    
    // Gradiente sutil basado en la profundidad para ayudar a distinguir niveles
    const opacity = theme === 'dark' 
      ? Math.min(0.03 + (depth * 0.008), 0.1)  // Más sutil para tema oscuro
      : Math.min(0.01 + (depth * 0.004), 0.05); // Más sutil para tema claro
      
    return theme === 'dark'
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`;
  };
  
  return (
    <li 
      className={`nav-node ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} depth-${depth}`}
      style={{
        position: 'relative',
        paddingBottom: isLastChild && depth > 0 ? '2px' : '1px',
        marginBottom: '1px',
      }}
    >
      <div 
        className="node-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '5px 6px',
          paddingLeft: `${actualIndent + 8}px`,
          borderRadius: '4px',
          backgroundColor: isSelected 
            ? theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)' 
            : getBackgroundStyle(),
          transition: 'all 0.2s ease',
          position: 'relative',
          borderLeft: depth > 0 ? `2px solid ${getBorderColor()}` : 'none',
          marginLeft: '4px',
        }}
      >
        {/* Botón de expansión para nodos con hijos */}
        {hasChildren && (
          <button
            className="expand-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
              marginRight: '6px',
              borderRadius: '2px',
              padding: 0,
              transition: 'all 0.2s ease',
              color: expandButtonColor,
              fontSize: '9px',
            }}
          >
            <span 
              style={{
                transition: 'transform 0.2s ease',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                display: 'inline-block',
              }}
            >
              ▶
            </span>
          </button>
        )}
        
        {!hasChildren && (
          <div style={{ width: '22px' }} />
        )}
        
        {/* Enlace al nodo */}
        <Link
          href={node.url}
          className="node-link"
          style={{
            textDecoration: 'none',
            color: isSelected 
              ? highlightColor
              : textColor,
            fontWeight: isSelected ? 500 : depth === 0 ? 500 : 400,
            fontSize: depth === 0 ? '0.92rem' : '0.88rem',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            padding: '2px 0',
            letterSpacing: '0.01em',
          }}
        >
          {node.label}
        </Link>
        
        {/* Contador de hijos - más sutil */}
        {hasChildren && (
          <span 
            className="children-count"
            style={{
              fontSize: '0.7rem',
              padding: '0 4px',
              color: mutedTextColor,
              marginLeft: '4px',
              fontWeight: 400,
              opacity: 0.8,
            }}
          >
            {node.children?.length || 0}
          </span>
        )}
        
        {/* Botón de favorito - más sutil */}
        <button
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(node.id);
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            marginLeft: '2px',
            opacity: isFavorite ? 1 : 0.2,
            color: isFavorite ? (theme === 'dark' ? '#fbbf24' : '#f59e0b') : (theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'inherit'),
            transition: 'all 0.2s ease',
            fontSize: '0.85rem',
          }}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      
      {/* Renderizar hijos si el nodo está expandido */}
      {hasChildren && isExpanded && (
        <ul 
          className="node-children"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginTop: '1px',
          }}
        >
          {node.children?.map((child, index) => (
            <TreeNodeContainer
              key={child.id}
              node={child}
              depth={depth + 1}
              isLastChild={index === (node.children?.length || 0) - 1}
              parentId={node.id}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

TreeNode.displayName = 'TreeNode';

// Container component that connects TreeNode to the parent state
const TreeNodeContainer = React.memo(({ 
  node, 
  depth, 
  isLastChild, 
  parentId 
}: {
  node: TopicNode;
  depth: number;
  isLastChild: boolean;
  parentId: string | null;
}) => {
  // Use the navigation context
  const { 
    expandedNodes, 
    toggleNodeExpansion, 
    favorites, 
    toggleFavorite, 
    selectedSlug, 
    theme,
    isSearching
  } = useNavigationContext();
  
  const isExpanded = expandedNodes[node.id];
  const isFavorite = favorites.includes(node.id);
  const isSelected = node.slug === selectedSlug;
  const hasChildren = node.children && node.children.length > 0;
  
  // Determine if this node should be displayed based on depth and expansion state
  const shouldDisplay = depth === 0 || (depth > 0 && parentId && expandedNodes[parentId]);
  
  // Para búsquedas, mostramos la ruta completa al nodo
  const isInSearchResults = isSearching;
  
  // Si estamos en modo búsqueda y este nodo está en los resultados, siempre mostrarlo
  if (!shouldDisplay && !isInSearchResults) return null;
  
  // Calcular un nivel visual efectivo para limitar la indentación en niveles muy profundos
  // Esto ayuda a mantener la legibilidad incluso en niveles muy anidados
  const effectiveDepth = Math.min(depth, 5);
  
  // Comprobar si es el área de Química para el manejo especial
  const isChemistry = node.label.toLowerCase().includes('química') || 
                      node.label.toLowerCase().includes('quimica') || 
                      node.slug?.toLowerCase().includes('quimica') || 
                      node.slug?.toLowerCase().includes('química');
  
  return (
    <TreeNode
      node={node}
      depth={effectiveDepth}
      isLastChild={isLastChild}
      parentId={parentId}
      isExpanded={isExpanded}
      isSelected={isSelected}
      isFavorite={isFavorite}
      theme={theme}
      onToggleExpand={toggleNodeExpansion}
      onToggleFavorite={toggleFavorite}
    />
  );
});

TreeNodeContainer.displayName = 'TreeNodeContainer';

// Create a context to avoid prop drilling
interface NavigationContextType {
  expandedNodes: Record<string, boolean>;
  toggleNodeExpansion: (nodeId: string) => void;
  favorites: string[];
  toggleFavorite: (nodeId: string) => void;
  clearAllFavorites: () => void;
  selectedSlug: string | null;
  theme: 'dark' | 'light';
  isSearching: boolean;
}

const NavigationContext = React.createContext<NavigationContextType | null>(null);

const useNavigationContext = () => {
  const context = React.useContext(NavigationContext);
  if (context === null) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
};

const HierarchicalNavigation: React.FC<HierarchicalNavigationProps> = ({ nodes, selectedSlug, theme }) => {
  // Estado para nodos expandidos
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Estado para la búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TopicNodeWithPath[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estado para favoritos
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Estado para el renderizado virtualizado
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [itemsToRender, setItemsToRender] = useState(50); // Número inicial de elementos a renderizar
  
  // Referencia al contenedor para scroll
  const navContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Verificar si un nodo es el área de Química para evitar expandirlo automáticamente
  const isChemistryArea = useCallback((node: TopicNode): boolean => {
    return node.label.toLowerCase().includes('química') || 
           node.label.toLowerCase().includes('quimica') || 
           node.slug?.toLowerCase().includes('quimica') || 
           node.slug?.toLowerCase().includes('química');
  }, []);
  
  // Función para alternar la expansión de un nodo
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  }, []);
  
  // Función para alternar un nodo como favorito
  const toggleFavorite = useCallback((nodeId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId];
      
      // Guardar inmediatamente en localStorage para evitar pérdida de datos
      if (typeof window !== 'undefined') {
        localStorage.setItem('wiki-favorites', JSON.stringify(newFavorites));
      }
      
      return newFavorites;
    });
  }, []);

  // Limpiar todos los favoritos
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wiki-favorites');
    }
  }, []);
  
  // Memoize the context value to prevent unnecessary re-renders
  const navigationContextValue = useMemo(() => ({
    expandedNodes,
    toggleNodeExpansion,
    favorites,
    toggleFavorite,
    clearAllFavorites,
    selectedSlug,
    theme,
    isSearching
  }), [expandedNodes, favorites, selectedSlug, theme, isSearching, toggleNodeExpansion, toggleFavorite, clearAllFavorites]);
  
  // Expandir automáticamente los nodos padres del nodo seleccionado
  useEffect(() => {
    if (!selectedSlug) return;
    
    const expandPathToNode = (nodeList: TopicNode[], path: string[] = []): string[] | null => {
      for (const node of nodeList) {
        if (node.slug === selectedSlug) {
          return [...path, node.id];
        }
        
        if (node.children && node.children.length > 0) {
          const foundPath = expandPathToNode(node.children, [...path, node.id]);
          if (foundPath) return foundPath;
        }
      }
      
      return null;
    };
    
    const nodePath = expandPathToNode(nodes);
    
    if (nodePath) {
      // Solo expandir los nodos en la ruta al nodo seleccionado, no todos los nodos
      const newExpandedNodes: Record<string, boolean> = {};
      
      // Filtrar nodos para evitar expandir automáticamente el área de Química
      nodePath.forEach(id => {
        // Encontrar el nodo actual para verificar si es el área de Química
        const findNode = (nodeList: TopicNode[], nodeId: string): TopicNode | null => {
          for (const node of nodeList) {
            if (node.id === nodeId) return node;
            if (node.children && node.children.length > 0) {
              const found = findNode(node.children, nodeId);
              if (found) return found;
            }
          }
          return null;
        };
        
        const currentNode = findNode(nodes, id);
        
        // Solo expandir si no es el área de Química o si es el nodo seleccionado
        if (currentNode && (!isChemistryArea(currentNode) || currentNode.slug === selectedSlug)) {
          newExpandedNodes[id] = true;
        }
      });
      
      // Actualizar el estado con solo los nodos que deben estar expandidos
      setExpandedNodes(newExpandedNodes);
      
      // Scroll to selected node after a short delay to ensure DOM is updated
      setTimeout(() => {
        const selectedElement = document.querySelector('.nav-node.selected');
        if (selectedElement && contentRef.current) {
          selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [nodes, selectedSlug, isChemistryArea]);
  
  // Cargar favoritos desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFavorites = localStorage.getItem('wiki-favorites');
      if (storedFavorites) {
        try {
          const parsedFavorites = JSON.parse(storedFavorites);
          if (Array.isArray(parsedFavorites)) {
            setFavorites(parsedFavorites);
          }
        } catch (e) {
          console.error('Error parsing favorites:', e);
          // Si hay un error, limpiar localStorage
          localStorage.removeItem('wiki-favorites');
        }
      }
    }
  }, []);
  
  // Handle scroll events for virtual scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const { scrollTop, clientHeight, scrollHeight } = contentRef.current;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      
      // Load more items when user scrolls past 80% of the current view
      if (scrollPercentage > 0.8 && nodes.length > itemsToRender) {
        setItemsToRender(prev => Math.min(prev + 30, nodes.length));
      }
      
      // Adjust visible range based on scroll position
      const estimatedItemHeight = 36; // Average height of an item in pixels
      const startIndex = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - 10);
      setVisibleStartIndex(startIndex);
    };
    
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [nodes.length, itemsToRender]);
  
  // Función para buscar nodos
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Debounce search for better performance
    const debounceTimer = setTimeout(() => {
      // Función recursiva para buscar en el árbol
      const searchInTree = (nodeList: TopicNode[], ancestors: TopicNodeWithPath['ancestors'] = []): TopicNodeWithPath[] => {
        let results: TopicNodeWithPath[] = [];
        
        for (const node of nodeList) {
          // Crear una copia del nodo con información de ancestros para mostrar breadcrumbs
          const nodeWithPath: TopicNodeWithPath = {
            ...node,
            ancestors: [...(ancestors || [])]
          };
          
          // Buscar en el título del nodo
          if (node.label.toLowerCase().includes(term.toLowerCase())) {
            results.push(nodeWithPath);
          }
          
          // Buscar en los hijos
          if (node.children && node.children.length > 0) {
            results = [
              ...results, 
              ...searchInTree(
                node.children, 
                [...(ancestors || []), { id: node.id, label: node.label, slug: node.slug, url: node.url }]
              )
            ];
          }
        }
        
        return results;
      };
      
      // Limitar a 50 resultados para evitar sobrecarga
      const results = searchInTree(nodes).slice(0, 50);
      setSearchResults(results as TopicNodeWithPath[]);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [nodes]);
  
  // Renderizar un nodo individual - Esta función será reemplazada por el componente TreeNode
  const renderNode = useCallback((node: TopicNode, depth: number = 0, isLastChild: boolean = false, parentId: string | null = null) => {
    return (
      <TreeNodeContainer
        key={node.id}
        node={node}
        depth={depth}
        isLastChild={isLastChild}
        parentId={parentId}
      />
    );
  }, []);
  
  // Renderizar la sección de favoritos
  const renderFavorites = useCallback(() => {
    // Encontrar los nodos favoritos
    const favoriteNodes: TopicNode[] = [];
    
    const findNodeById = (nodeList: TopicNode[], id: string): TopicNode | null => {
      for (const node of nodeList) {
        if (node.id === id) return node;
        if (node.children && node.children.length > 0) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    // Buscar todos los nodos favoritos
    favorites.forEach(id => {
      const node = findNodeById(nodes, id);
      if (node) favoriteNodes.push(node);
    });
    
    // Si no hay favoritos, no mostrar la sección
    if (favoriteNodes.length === 0) {
      return null;
    }
    
    // Colores para tema oscuro
    const headerColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.7)';
    
    return (
      <div className="favorites-section">
        <h3 
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            margin: '16px 0 8px 0',
            padding: '0 8px',
            color: headerColor,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            paddingBottom: '6px'
          }}
        >
          <span>Favoritos</span>
          {favoriteNodes.length > 0 && (
            <button
              onClick={clearAllFavorites}
              style={{
                background: 'none',
                border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                padding: '3px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>✕</span>
              Limpiar
            </button>
          )}
        </h3>
        <ul 
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {favoriteNodes.map(node => (
            <TreeNodeContainer
              key={`fav-${node.id}`}
              node={node}
              depth={0}
              isLastChild={false}
              parentId={null}
            />
          ))}
        </ul>
      </div>
    );
  }, [favorites, nodes, theme, clearAllFavorites]);
  
  // Renderizar los resultados de búsqueda
  const renderSearchResults = useCallback(() => {
    if (!isSearching || searchResults.length === 0) return null;
    
    // Colores para tema oscuro
    const headerColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.7)';
    const breadcrumbColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)';
    const dividerColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    
    return (
      <div className="search-results">
        <h3 
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            margin: '16px 0 8px 0',
            padding: '0 8px',
            color: headerColor,
          }}
        >
          Resultados ({searchResults.length})
        </h3>
        <ul 
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {searchResults.map((node) => (
            <li key={`search-${node.id}`}>
              {/* Mostrar breadcrumbs para resultados de búsqueda */}
              {node.ancestors && node.ancestors.length > 0 && (
                <div 
                  className="search-breadcrumbs"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0 8px 2px 12px',
                    color: breadcrumbColor,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {node.ancestors.map((ancestor, idx: number) => (
                    <React.Fragment key={ancestor.id}>
                      <Link 
                        href={ancestor.url}
                        style={{
                          color: breadcrumbColor,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100px',
                          display: 'inline-block',
                        }}
                      >
                        {ancestor.label}
                      </Link>
                      <span 
                        style={{ 
                          margin: '0 4px',
                          color: dividerColor,
                          fontSize: '0.7rem',
                        }}
                      >
                        /
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}
              <TreeNodeContainer
                node={node}
                depth={0}
                isLastChild={false}
                parentId={null}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }, [isSearching, searchResults, theme]);
  
  // Renderizar el árbol principal con virtualización
  const renderVirtualizedTree = useCallback(() => {
    if (nodes.length === 0) {
      return <div>No hay temas disponibles</div>;
    }
    
    // Determinar el rango de nodos a renderizar
    const endIndex = Math.min(visibleStartIndex + itemsToRender, nodes.length);
    const visibleNodes = nodes.slice(visibleStartIndex, endIndex);
    
    // Calcular la altura total estimada para mantener el scroll correcto
    const estimatedItemHeight = 36; // Altura promedio de un ítem en píxeles
    const topPadding = visibleStartIndex * estimatedItemHeight;
    const bottomPadding = Math.max(0, (nodes.length - endIndex) * estimatedItemHeight);
    
    return (
      <div className="virtualized-tree-container" style={{ position: 'relative' }}>
        {/* Espaciador superior para mantener la posición de scroll */}
        {topPadding > 0 && <div style={{ height: `${topPadding}px` }} />}
        
        {/* Nodos visibles */}
        <ul 
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {visibleNodes.map((node, index) => (
            <TreeNodeContainer
              key={node.id}
              node={node}
              depth={0}
              isLastChild={index === visibleNodes.length - 1 && endIndex === nodes.length}
              parentId={null}
            />
          ))}
        </ul>
        
        {/* Espaciador inferior para mantener la posición de scroll */}
        {bottomPadding > 0 && <div style={{ height: `${bottomPadding}px` }} />}
      </div>
    );
  }, [nodes, visibleStartIndex, itemsToRender]);
  
  // Función para colapsar todos los nodos
  const collapseAll = useCallback(() => {
    setExpandedNodes({});
  }, []);
  
  // Función para expandir solo el primer nivel
  const expandFirstLevel = useCallback(() => {
    const newExpandedNodes: Record<string, boolean> = {};
    
    // Expandir solo los nodos de nivel 1
    nodes.forEach(node => {
      if (getNodeLevel(node) === 1) {
        newExpandedNodes[node.id] = true;
      }
    });
    
    setExpandedNodes(newExpandedNodes);
  }, [nodes]);
  
  return (
    <NavigationContext.Provider value={navigationContextValue}>
    <div 
      className="hierarchical-navigation"
      ref={navContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Barra de búsqueda */}
      <div 
        className="search-bar"
        style={{
          padding: '0 8px 12px 8px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: theme === 'dark' ? 'var(--nav-bg)' : 'var(--nav-bg)',
          borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          marginBottom: '8px'
        }}
      >
        <div 
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Buscar temas..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
              color: theme === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.8)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
          <span 
            style={{
              position: 'absolute',
              left: '10px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Botones de control para expandir/colapsar */}
        {!isSearching && (
          <div className="tree-controls" style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '8px',
            padding: '0 4px'
          }}>
            <button
              onClick={collapseAll}
              style={{
                background: 'none',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                width: '100%'
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>⟰</span>
              Colapsar todo
            </button>
          </div>
        )}
      </div>
      
      {/* Contenido principal */}
      <div 
        className="navigation-content"
          ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px',
          color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
            scrollBehavior: 'smooth',
        }}
      >
        {/* Mostrar resultados de búsqueda si está buscando */}
        {renderSearchResults()}
        
        {/* Mostrar favoritos si no está buscando */}
        {!isSearching && renderFavorites()}
        
        {/* Árbol principal si no está buscando */}
        {!isSearching && (
          <div className="main-tree">
            {favorites.length > 0 && (
              <h3 
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  margin: '16px 0 8px 0',
                  padding: '0 8px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
                }}
              >
                Todos los temas
              </h3>
            )}
              
              {/* Usar renderizado virtualizado para mejorar el rendimiento con miles de nodos */}
              {renderVirtualizedTree()}
          </div>
        )}
      </div>
    </div>
    </NavigationContext.Provider>
  );
};

export default React.memo(HierarchicalNavigation);