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
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(node);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${node.label || node.title}"?`)) {
      onDelete(node);
    }
  };

  return (
    <div style={{ marginLeft: 8 }}>
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
        }}
        onClick={() => onSelect(node)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasChildren && (
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
        )}
        <span style={{ 
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
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
            }}
          >
            ✏️
          </button>
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
            }}
          >
            🗑️
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div style={{ marginLeft: '16px' }}>
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

const DropdownMenu = ({ 
  onAddArea, 
  onAddEspecialidad, 
  onAddTema, 
  onAddContenido,
  parentId
}: { 
  onAddArea: () => void; 
  onAddEspecialidad: (id: number) => void; 
  onAddTema: (id: number) => void; 
  onAddContenido: (id: number) => void;
  parentId?: number;
}) => {
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
          <div 
            style={dropdownItemStyle}
            onClick={() => {
              parentId ? onAddEspecialidad(parentId) : onAddArea();
              setIsOpen(false);
            }}
          >
            {parentId ? 'Nueva Especialidad' : 'Nuevo Área'}
          </div>
          {parentId && (
            <>
              <div 
                style={dropdownItemStyle}
                onClick={() => {
                  onAddTema(parentId);
                  setIsOpen(false);
                }}
              >
                Nuevo Tema
              </div>
              <div 
                style={dropdownItemStyle}
                onClick={() => {
                  onAddContenido(parentId);
                  setIsOpen(false);
                }}
              >
                Nuevo Contenido
              </div>
            </>
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
  // Función para manejar la creación con el ID del padre
  const handleCreateWithParent = (handler: (id: number) => void, parentId?: number) => {
    if (parentId !== undefined) {
      handler(parentId);
    }
  };

  return (
    <div style={{ minWidth: 240, padding: '0 8px' }}>
      <h2 style={{ marginTop: 0, fontSize: '1.25rem', marginBottom: '16px' }}>Jerarquía de Páginas</h2>
      <div style={{ 
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px'
      }}>
        <DropdownMenu 
          onAddArea={onCreateArea}
          onAddEspecialidad={(parentId) => handleCreateWithParent(onCreateEspecialidad, parentId)}
          onAddTema={(parentId) => handleCreateWithParent(onCreateTema, parentId)}
          onAddContenido={(parentId) => handleCreateWithParent(onCreateContenido, parentId)}
        />
      </div>
      {loading && <div style={{ color: "#888", padding: '8px 0' }}>Cargando...</div>}
      {error && <div style={{ color: "#f44336", padding: '8px 0' }}>{error}</div>}
      <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
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
      <style jsx>{`
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
