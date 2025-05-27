import React, { useState, useRef, useEffect } from "react";

interface TreeNodeProps {
  node: any;
  selectedId: number;
  onSelect: (node: any) => void;
  onEdit: (node: any) => void;
  onDelete: (node: any) => void;
}

function TreeNode({ node, selectedId, onSelect, onEdit, onDelete }: TreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          addButtonRef.current && !addButtonRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Cerrar el menú cuando cambia el nodo seleccionado
  useEffect(() => {
    setIsAddMenuOpen(false);
  }, [selectedId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleAddNode = (type: 'especialidad' | 'tema' | 'contenido') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node && node.id) {
      // Llamar a la función de creación correspondiente según el tipo
      const actionMap = {
        'especialidad': () => onEdit({...node, _action: 'add-especialidad', parentNode: node}),
        'tema': () => onEdit({...node, _action: 'add-tema', parentNode: node}),
        'contenido': () => onEdit({...node, _action: 'add-contenido', parentNode: node})
      };
      
      const action = actionMap[type];
      if (action) {
        action();
        setIsAddMenuOpen(false);
      }
    }
    return false;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit({...node, _action: 'edit'});
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${node.label || node.title}"?`)) {
      onDelete(node);
    }
  };

  // Determinar qué opciones de agregar mostrar basadas en el nivel del nodo
  const nodeAddOptions = {
    area: node.level === undefined || node.level === 0, // Nivel raíz
    especialidad: node.level === 1, // Área
    tema: node.level === 2, // Especialidad
    contenido: node.level === 3 // Tema
  };

  return (
    <div style={{ marginLeft: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: "pointer",
          fontWeight: isSelected ? "bold" : undefined,
          color: isSelected ? "#1976d2" : undefined,
          background: isSelected ? "#e3f2fd" : isHovered ? '#f5f5f5' : undefined,
          borderRadius: 5,
          padding: "6px 8px",
          marginBottom: 2,
          transition: 'all 0.2s',
          minWidth: 0, // Permite que el texto se trunque correctamente
        }}
        onClick={() => onSelect(node)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasChildren ? (
          <span 
            onClick={handleToggle}
            style={{
              display: 'inline-block',
              width: '20px',
              textAlign: 'center',
              marginRight: '4px',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          >
            ▸
          </span>
        ) : (
          <span style={{ width: '16px', display: 'inline-block', marginRight: '4px' }} />
        )}
        <span style={{ 
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0, // Asegura que el texto se trunque correctamente
          paddingRight: '4px' // Espacio entre el texto y los botones
        }}>
          {node.label || node.title}
        </span>
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          marginLeft: '8px',
          opacity: isHovered || isSelected ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: isHovered || isSelected ? 'auto' : 'none'
        }}>
          {/* Botón de Agregar */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              ref={addButtonRef}
              className="add-button"
              title="Agregar"
              style={{
                background: isAddMenuOpen ? '#e8f5e9' : 'none',
                border: 'none',
                color: isAddMenuOpen ? '#2e7d32' : '#4caf50',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                transition: 'all 0.2s',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAddMenuOpen(!isAddMenuOpen);
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                if (!isAddMenuOpen) {
                  setIsAddMenuOpen(true);
                }
                
                // El menú se manejará con JSX en lugar de manipulación directa del DOM
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
            </button>
            
            {isAddMenuOpen && (
              <div 
                ref={menuRef}
                className="node-add-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0, // Alinear a la derecha del botón
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  minWidth: '160px',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {nodeAddOptions.especialidad && (
                  <div 
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={handleAddNode('especialidad')}
                  >
                    Nueva Especialidad
                  </div>
                )}
                
                {nodeAddOptions.tema && (
                  <div 
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={handleAddNode('tema')}
                  >
                    Nuevo Tema
                  </div>
                )}
                
                {nodeAddOptions.contenido && (
                  <div 
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={handleAddNode('contenido')}
                  >
                    Nuevo Contenido
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Botón de Editar */}
          <button 
            onClick={handleEdit}
            className="edit-button"
            title="Editar"
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              transition: 'all 0.2s'
            }}
          >
            ✏️
          </button>
          
          {/* Botón de Eliminar */}
          <button 
            onClick={handleDelete}
            className="delete-button"
            title="Eliminar"
            style={{
              background: 'none',
              border: 'none',
              color: '#f44336',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              transition: 'all 0.2s'
            }}
          >
            🗑️
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div style={{ marginLeft: '8px' }}>
          {node.children.map((child: any) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PageHierarchyPanelProps {
  tree: any[];
  selectedId: number | null;
  selectedNode: any | null;
  onSelect: (node: any) => void;
  loading: boolean;
  error: string | null;
  onCreateArea: () => void;
  onCreateEspecialidad: (parentId: number) => void;
  onCreateTema: (parentId: number) => void;
  onCreateContenido: (parentId: number) => void;
  onEditNode: (node: any) => void;
  onDeleteNode: (node: any) => Promise<void>;
}

interface DropdownMenuProps {
  showAddOptions: {
    area: boolean;
    especialidad: boolean;
    tema: boolean;
    contenido: boolean;
  };
  onAddArea: () => void;
  onAddEspecialidad: (id: number) => void;
  onAddTema: (id: number) => void;
  onAddContenido: (id: number) => void;
  selectedNode: any | null;
}

const DropdownMenu = ({ 
  showAddOptions,
  onAddArea, 
  onAddEspecialidad, 
  onAddTema, 
  onAddContenido,
  selectedNode
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '14px'
        }}
      >
        <span>+ Agregar</span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '180px',
          overflow: 'hidden'
        }}>
          {showAddOptions.area && (
            <div 
              style={dropdownItemStyle}
              onClick={() => {
                onAddArea();
                setIsOpen(false);
              }}
            >
              Nuevo Área
            </div>
          )}
          {showAddOptions.especialidad && selectedNode && (
            <div 
              style={dropdownItemStyle}
              onClick={() => {
                onAddEspecialidad(selectedNode.id);
                setIsOpen(false);
              }}
            >
              Nueva Especialidad
            </div>
          )}
          {showAddOptions.tema && selectedNode && (
            <div 
              style={dropdownItemStyle}
              onClick={() => {
                onAddTema(selectedNode.id);
                setIsOpen(false);
              }}
            >
              Nuevo Tema
            </div>
          )}
          {showAddOptions.contenido && selectedNode && (
            <div 
              style={dropdownItemStyle}
              onClick={() => {
                onAddContenido(selectedNode.id);
                setIsOpen(false);
              }}
            >
              Nuevo Contenido
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const dropdownItemStyle = {
  padding: '8px 12px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  ':hover': {
    backgroundColor: '#f5f5f5'
  }
};

export default function PageHierarchyPanel({
  tree, 
  selectedId, 
  selectedNode,
  onSelect, 
  loading, 
  error, 
  onCreateArea, 
  onCreateEspecialidad, 
  onCreateTema, 
  onCreateContenido,
  onEditNode,
  onDeleteNode
}: PageHierarchyPanelProps) {
  // Determinar qué opciones de creación mostrar basadas en el nodo seleccionado
  const showAddOptions = selectedNode ? {
    area: false,
    especialidad: selectedNode.level === 1,
    tema: selectedNode.level === 2,
    contenido: selectedNode.level === 3
  } : {
    area: true,
    especialidad: false,
    tema: false,
    contenido: false
  };
  // Función para manejar la creación con el ID del padre
  const handleCreateWithParent = (handler: (id: number) => void, parentId?: number) => {
    if (parentId !== undefined) {
      handler(parentId);
    }
  };

  return (
    <div style={{ 
      minWidth: 280, // Ancho mínimo aumentado para mejor visualización
      width: '280px', // Ancho fijo para consistencia
      padding: '0 8px', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden',
      borderRight: '1px solid #e0e0e0',
      backgroundColor: '#fff',
      boxSizing: 'border-box' // Asegura que el padding no afecte el ancho total
    }}>
      <div>
        <h2 style={{ marginTop: 0, fontSize: '1.25rem', marginBottom: '16px' }}>Jerarquía de Páginas</h2>
        <div style={{ 
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          padding: '8px 0',
          zIndex: 10,
          borderBottom: '1px solid #eee'
        }}>
          <DropdownMenu 
            showAddOptions={{
              area: true, // Siempre mostrar opción de agregar área
              especialidad: !!selectedNode && selectedNode.level === 1,
              tema: !!selectedNode && selectedNode.level === 2,
              contenido: !!selectedNode && selectedNode.level === 3
            }}
            onAddArea={onCreateArea}
            onAddEspecialidad={() => selectedNode && onCreateEspecialidad(selectedNode.id)}
            onAddTema={() => selectedNode && onCreateTema(selectedNode.id)}
            onAddContenido={() => selectedNode && onCreateContenido(selectedNode.id)}
            selectedNode={selectedNode}
          />
        </div>
      </div>
      <div className="hierarchy-scroll-container" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '8px 0'
      }}>
        {loading && <div style={{ color: "#888", padding: '8px 0' }}>Cargando...</div>}
        {error && <div style={{ color: "#f44336", padding: '8px 0' }}>{error}</div>}
        {tree.map((node) => (
          <TreeNode 
            key={node.id} 
            node={node} 
            selectedId={selectedId ?? -1} 
            onSelect={onSelect}
            onEdit={onEditNode}
            onDelete={onDeleteNode}
          />
        ))}
      </div>
      <style jsx global>{`
        .node-add-menu {
          position: absolute;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
          min-width: 160px;
          overflow: hidden;
        }
        
        .node-add-menu div {
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .node-add-menu div:hover {
          background-color: #f5f5f5;
        }
        
        .add-button {
          transition: all 0.2s;
        }
        
        .add-button:hover {
          background-color: #e8f5e9 !important;
          color: #2e7d32 !important;
          transform: scale(1.1);
        }
        
        .edit-button:hover {
          background-color: #e3f2fd !important;
          color: #1976d2 !important;
        }
        
        .delete-button:hover {
          background-color: #ffebee !important;
          color: #d32f2f !important;
        }
        
        /* Estilos personalizados para la barra de desplazamiento */
        .hierarchy-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }
        
        .hierarchy-scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .hierarchy-scroll-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .hierarchy-scroll-container::-webkit-scrollbar-thumb {
          background-color: #888;
          border-radius: 10px;
        }
        
        .hierarchy-scroll-container::-webkit-scrollbar-thumb:hover {
          background-color: #555;
        }
        .hierarchy-button {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .hierarchy-button:hover {
          background-color: #e0e0e0;
        }
        .hierarchy-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .edit-button:hover {
          background-color: #e3f2fd;
        }
        .delete-button:hover {
          background-color: #ffebee;
        }
      `}</style>
    </div>
  );
}
