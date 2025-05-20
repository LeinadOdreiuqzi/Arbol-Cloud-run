// lib/page-hierarchy-service.ts
import { TopicNode } from './notes-graph-util';

// Interfaz para los datos de la página tal como vienen de la base de datos
export interface PageData {
  id: number;
  title: string;
  slug: string;
  parent_id: number | null;
  level: number;
  content?: any;
}

/**
 * Convierte los datos planos de la tabla pages en una estructura jerárquica
 * para ser utilizada por el componente HierarchicalNavigation
 */
export function buildHierarchyFromPages(pages: PageData[]): TopicNode[] {
  // Mapa para acceder rápidamente a los nodos por ID
  const nodeMap = new Map<number, TopicNode>();
  const rootNodes: TopicNode[] = [];
  
  // Primero creamos todos los nodos
  pages.forEach(page => {
    // Determinar el tipo de nodo basado en su nivel
    let nodeType = '';
    switch (page.level) {
      case 1: nodeType = 'area'; break;
      case 2: nodeType = 'especialidad'; break;
      case 3: nodeType = 'tema'; break;
      case 4: nodeType = 'contenido'; break;
      default: nodeType = `nivel-${page.level}`;
    }
    
    const node: TopicNode = {
      id: String(page.id),
      label: page.title,
      slug: page.slug,
      url: `/pages-arbol/${page.slug}`,
      children: [],
      content: page.content,
      // Añadir metadatos adicionales para facilitar la visualización
      metadata: {
        level: page.level,
        type: nodeType
      }
    };
    
    nodeMap.set(page.id, node);
  });
  
  // Luego establecemos las relaciones jerárquicas
  pages.forEach(page => {
    const node = nodeMap.get(page.id);
    
    if (page.parent_id === null) {
      // Es un nodo raíz (Área)
      rootNodes.push(node!);
    } else {
      // Es un nodo hijo
      const parentNode = nodeMap.get(page.parent_id);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node!);
      }
    }
  });
  
  // Ordenar los nodos por nivel y luego por título para una mejor visualización
  rootNodes.sort((a, b) => {
    const aMetadata = a.metadata as any;
    const bMetadata = b.metadata as any;
    if (aMetadata?.level === bMetadata?.level) {
      return a.label.localeCompare(b.label);
    }
    return (aMetadata?.level || 0) - (bMetadata?.level || 0);
  });
  
  // Ordenar recursivamente los hijos de cada nodo
  const sortChildren = (node: TopicNode) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => {
        const aMetadata = a.metadata as any;
        const bMetadata = b.metadata as any;
        if (aMetadata?.level === bMetadata?.level) {
          return a.label.localeCompare(b.label);
        }
        return (aMetadata?.level || 0) - (bMetadata?.level || 0);
      });
      
      node.children.forEach(sortChildren);
    }
  };
  
  rootNodes.forEach(sortChildren);
  
  return rootNodes;
}

/**
 * Obtiene la jerarquía de páginas directamente desde la API
 */
export async function fetchPageHierarchy(): Promise<TopicNode[]> {
  try {
    const response = await fetch('/api/page-hierarchy');
    if (!response.ok) {
      throw new Error('Error al cargar la jerarquía de páginas');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener la jerarquía de páginas:', error);
    return [];
  }
}