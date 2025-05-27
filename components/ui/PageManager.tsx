import React, { useEffect, useState, useRef, useCallback } from "react";
import RichTextRenderer from "@/components/ui/RichTextRenderer";
import dynamic from 'next/dynamic';
import { Editor } from "@tiptap/react";
import EditorTableOfContents from "@/components/editor/EditorTableOfContents";
import PageHierarchyPanel from "@/components/navigation/PageHierarchyPanel";

// Función para construir el árbol de páginas
function buildTree(pages: any[]) {
  const map = new Map();
  pages.forEach(page => map.set(page.id, { ...page, children: [] }));
  const tree: any[] = [];
  map.forEach(page => {
    if (page.parent_id) {
      map.get(page.parent_id)?.children.push(page);
    } else {
      tree.push(page);
    }
  });
  return tree;
}

// Función para obtener el tipo de nodo según el nivel
function getTypeByLevel(level: number) {
  switch(level) {
    case 1: return "Área";
    case 2: return "Especialidad";
    case 3: return "Tema";
    case 4: return "Contenido";
    default: return `Nivel ${level}`;
  }
}

const SimpleEditor = dynamic(() => import('../editor/SimpleEditor'), {
  ssr: false,
  loading: () => <p>Cargando editor...</p> // Optional loading indicator
});

// ... (rest of the code remains the same)

export default function PageManager() {
  const [isHierarchyVisible, setIsHierarchyVisible] = useState(true);
  const [isPreviewModeActive, setIsPreviewModeActive] = useState(false);
  const [isTocVisible, setIsTocVisible] = useState(true); // New state for ToC visibility
  const [activeEditorInstance, setActiveEditorInstance] = useState<Editor | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number|null>(null);
  const [loading, setLoading] = useState(false); 
  const [saveLoading, setSaveLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const selectedPage = pages.find(p => p.id === selectedId);
  const [draftContent, setDraftContent] = useState<any>(selectedPage?.content || { type: 'doc', content: [] });
  const [draftChanged, setDraftChanged] = useState(false);
  const [showSaveNotice, setShowSaveNotice] = useState(false);
  const [showErrorNotice, setShowErrorNotice] = useState<string | false>(false);
  const draftRef = useRef<any>(null); 
  const selectedLevel = selectedPage?.level ?? 0;
  const autosaveTimer = useRef<NodeJS.Timeout|null>(null);

  const [showUnsavedModal, setShowUnsavedModal] = useState<false | any>(false);

  const handleSelectNodeWithGuard = (node: any) => {
    if (draftChanged) {
      setShowUnsavedModal(node);
    } else {
      setSelectedId(node.id);
    }
  };

  const confirmChangePage = () => {
    if (showUnsavedModal && typeof showUnsavedModal === 'object' && showUnsavedModal.id) {
      setSelectedId(showUnsavedModal.id);
    }
    setShowUnsavedModal(false);
  };

  const cancelChangePage = () => {
    setShowUnsavedModal(false);
  };

  const handleDraftChange = (data: any) => {
    console.log("[PageManager] handleDraftChange: Triggered.");
    const incomingDataString = JSON.stringify(data);
    const refDataString = JSON.stringify(draftRef.current);
    const changed = incomingDataString !== refDataString;
    console.log(`[PageManager] handleDraftChange: Data changed compared to ref? ${changed}`);
    setDraftContent(data);
    setDraftChanged(changed);
    setShowSaveNotice(false);
    setShowErrorNotice(false);
  };

  const handleSaveClick = async () => {
    if (!selectedPage) {
      console.warn("[PageManager] handleSaveClick: No selected page, aborting save.");
      return;
    }
    if (saveLoading) {
      console.warn("[PageManager] handleSaveClick: Save already in progress, aborting.");
      return;
    }

    console.log(`[PageManager] handleSaveClick: Starting save for page ID: ${selectedPage.id}`);
    console.log("[PageManager] handleSaveClick: Content being saved:", JSON.stringify(draftContent));
    setSaveLoading(true);
    const updated = { ...selectedPage, content: draftContent, title: editTitle || selectedPage.title };

    try {
      const res = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setPages(pages => pages.map(p => p.id === updated.id ? updated : p));
        setDraftChanged(false);
        setShowSaveNotice(true);
        setTimeout(() => setShowSaveNotice(false), 2000);
        draftRef.current = draftContent;
        console.log("[PageManager] handleSaveClick: Save successful. draftRef updated, draftChanged set to false.");
      } else {
        console.error(`[PageManager] handleSaveClick: Save failed! Status: ${res.status}`);
        setShowErrorNotice(`Error al guardar (${res.status}). Intenta de nuevo.`);
      }
    } catch (error) {
      console.error("[PageManager] handleSaveClick: Error saving:", error);
      setShowErrorNotice("Error de red al guardar. Revisa tu conexión.");
    } finally {
      setSaveLoading(false);
      console.log("[PageManager] handleSaveClick: Save process finished.");
    }
  };

  const handleUndoDraft = () => {
    setDraftContent(draftRef.current);
    setDraftChanged(false);
    setShowSaveNotice(false);
    setShowErrorNotice(false);
  };

  console.log("[PageManager] Component Mounted");

  // Cargar jerarquía desde la API REAL
  useEffect(() => {
    setLoading(true);
    fetch("/api/pages")
      .then(res => res.json())
      .then(data => {
        setPages(data);
        setSelectedId(data[0]?.id ?? null);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar las páginas");
        setLoading(false);
      });
  }, []);

  // Effect to load selected page content
  useEffect(() => {
    console.log("[PageManager] Load Effect: Triggered for selectedPage ID:", selectedPage?.id);
    const newContent = selectedPage?.content || { type: 'doc', content: [] };
    setDraftContent(newContent);
    setDraftChanged(false);
    setShowSaveNotice(false);
    setShowErrorNotice(false);
    draftRef.current = newContent; 
    console.log("[PageManager] Load Effect: draftRef updated to:", JSON.stringify(draftRef.current));
    console.log("[PageManager] Load Effect: draftChanged set to false");
  }, [selectedPage]);

  // ... (rest of the code remains the same)

  const handleCreateArea = async () => {
    const tipo = getTypeByLevel(1);
    const title = prompt(`Título del nuevo ${tipo}:`);
    if (!title) return;
    await handleCreate(null, 1, title);
  };

  const handleCreateEspecialidad = async () => {
    if (!selectedPage || selectedLevel !== 1) {
      alert("Selecciona un Área para agregar una Especialidad.");
      return;
    }
    const tipo = getTypeByLevel(2);
    const title = prompt(`Título de la nueva ${tipo}:`);
    if (!title) return;
    await handleCreate(selectedPage, 2, title);
  };

  const handleCreateTema = async () => {
    if (!selectedPage || selectedLevel !== 2) {
      alert("Selecciona una Especialidad para agregar un Tema.");
      return;
    }
    const tipo = getTypeByLevel(3);
    const title = prompt(`Título del nuevo ${tipo}:`);
    if (!title) return;
    await handleCreate(selectedPage, 3, title);
  };

  const handleCreateContenido = async () => {
    if (!selectedPage || selectedLevel !== 3) {
      alert("Selecciona un Tema para agregar un Contenido.");
      return;
    }
    const tipo = getTypeByLevel(4);
    const title = prompt(`Título del nuevo ${tipo}:`);
    if (!title) return;
    await handleCreate(selectedPage, 4, title);
  };

  const handleCreate = async (parent: any, level: number, title: string) => {
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9\-]/g, "");
    const parent_id = parent ? parent.id : null;
    const newPage = { 
      title, 
      slug, 
      level, 
      parent_id, 
      content: { type: 'doc', content: [] },
      label: title // Asegurarse de que la propiedad label esté presente
    };
    
    setLoading(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPage)
      });
      
      if (res.ok) {
        const created = await res.json();
        setPages(pages => [...pages, { ...created, label: created.title }]);
        setSelectedId(created.id);
        return true;
      } else {
        const error = await res.json();
        console.error("Error creating page:", error);
        alert(`Error al crear la página: ${error.message || 'Error desconocido'}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating page:", error);
      alert("Error de red al crear la página");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = async (node: any): Promise<void> => {
    if (!node) return;
    
    // Verificar si el nodo tiene hijos
    const hasChildren = pages.some((p: any) => p.parent_id === node.id);
    if (hasChildren) {
      alert("No se puede eliminar un nodo que tiene elementos hijos. Por favor, elimina primero los elementos hijos.");
      return;
    }
    
    if (!window.confirm(`¿Eliminar "${node.label || node.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: node.id })
      });
      
      if (res.ok) {
        setPages((currentPages: any[]) => {
          const updatedPages = currentPages.filter(p => p.id !== node.id);
          // Si el nodo eliminado es el seleccionado, seleccionar el primero disponible
          if (selectedId === node.id) {
            setSelectedId(updatedPages[0]?.id ?? null);
          }
          return updatedPages;
        });
      } else {
        const error = await res.json();
        console.error("Error deleting page:", error);
        alert(`Error al eliminar: ${error.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Error de red al eliminar la página");
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditNode = (node: any) => {
    const newTitle = prompt("Nuevo nombre:", node.label || node.title);
    if (!newTitle || newTitle === node.label) return;
    
    const updateNode = async () => {
      setLoading(true);
      try {
        const updatedNode = { ...node, title: newTitle, label: newTitle };
        const res = await fetch("/api/pages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedNode)
        });
        
        if (res.ok) {
          setPages(pages => 
            pages.map(p => p.id === node.id ? { ...p, title: newTitle, label: newTitle } : p)
          );
        } else {
          const error = await res.json();
          throw new Error(error.message || 'Error al actualizar');
        }
      } catch (error) {
        console.error("Error updating node:", error);
        alert("Error al actualizar el elemento");
      } finally {
        setLoading(false);
      }
    };
    
    updateNode();
  };

  const tree = buildTree(pages);

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh",
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Panel de jerarquía */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        borderRight: "1px solid #ccc",
        width: isHierarchyVisible ? 300 : 40,
        overflow: 'hidden',
        transition: 'width 0.3s ease-in-out',
        position: 'relative',
        flexShrink: 0
      }}>
        {/* Botón de alternar navegación */}
        <div style={{
          padding: '10px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '60px',
          backgroundColor: '#f8f9fa',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {isHierarchyVisible && <span>Navegación</span>}
          <button 
            onClick={() => setIsHierarchyVisible(!isHierarchyVisible)} 
            className="pm-button pm-button-subtle"
            style={{ 
              backgroundColor: 'white',
              border: '1px solid #ddd',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isHierarchyVisible ? 'auto' : '30px'
            }}
            title={isHierarchyVisible ? "Ocultar navegación" : "Mostrar navegación"}
          >
            {isHierarchyVisible ? "◀ Ocultar" : "☰"}
          </button>
        </div>
        {isHierarchyVisible && (
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '0 8px 16px 8px',
            width: '100%'
          }}>
            <PageHierarchyPanel
              tree={tree.map(node => ({
                ...node,
                // Asegurarse de que cada nodo tenga un label
                label: node.label || node.title,
                // Asegurarse de que los hijos también tengan label
                children: (node.children || []).map((child: any) => ({
                  ...child,
                  label: child.label || child.title
                }))
              }))}
              selectedId={selectedId}
              onSelect={handleSelectNodeWithGuard}
              loading={loading}
              error={error}
              onCreateArea={handleCreateArea}
              onCreateEspecialidad={handleCreateEspecialidad}
              onCreateTema={handleCreateTema}
              onCreateContenido={handleCreateContenido}
              onEditNode={handleEditNode}
              onDeleteNode={handleDeleteNode}
            />
          </div>
        )}
      </div>

      {/* Editor Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'row', 
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        minHeight: 0 // Asegura que el contenedor no exceda el espacio disponible
      }}>
        {/* Main Editor Content */}
        <div style={{ 
          flex: 3, 
          padding: "12px", 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          margin: 0,
          minHeight: 0 // Asegura que el contenedor no exceda el espacio disponible
        }}>
          {selectedPage ? (
            <>
              {!isPreviewModeActive ? (
                <>
                  {/* Existing Title Input */}
                  <input
                    type="text"
                    value={editTitle || selectedPage.title}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveClick}
                    style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: 15, padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  {/* Existing "Nota:" div */}
                  <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f0f7ff', borderRadius: '4px', fontSize: '0.9em' }}>
                    <strong>Nota:</strong> El contenido extenso se paginará automáticamente en la visualización. No es necesario dividir manualmente el contenido en páginas.
                  </div>
                  {/* Existing SimpleEditor component */}
                  <SimpleEditor
                    key={selectedPage.id}
                    content={draftContent}
                    initialContent={selectedPage.content}
                    onChange={handleDraftChange}
                    onEditorReady={setActiveEditorInstance}
                  />
                  {/* Existing Save/Undo buttons and notices */}
                  <div style={{ marginTop: 15, display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={handleSaveClick} disabled={!draftChanged || saveLoading} className="pm-button pm-button-primary">
                      {saveLoading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    <button onClick={handleUndoDraft} disabled={!draftChanged || saveLoading} className="pm-button pm-button-secondary">Descartar</button>
                    {/* Preview Toggle Button - Moved here */}
                    <button 
                      onClick={() => setIsPreviewModeActive(!isPreviewModeActive)}
                      className="pm-button" // Using pm-button, could be pm-button-secondary too
                      style={{ marginLeft: 'auto' }} // Keep marginLeft: auto for positioning
                    >
                      {isPreviewModeActive ? "Volver al Editor" : "Previsualizar Contenido"}
                    </button>
                    {showSaveNotice && <span style={{ color: 'green' }}>Guardado ✓</span>}
                    {showErrorNotice && <span style={{ color: 'red' }}>{showErrorNotice}</span>}
                    {!draftChanged && !showSaveNotice && !showErrorNotice && <span style={{ color: '#888' }}>Contenido al día</span>}
                  </div>
                </>
              ) : (
                // Preview Mode Content - Estilo similar a pages-arbol
                <div style={{ 
                  padding: '2.5rem 3rem',
                  minHeight: '100vh',
                  color: 'var(--foreground, #283044)',
                  background: 'var(--background, #f8f9fa)',
                  fontSize: '1.125rem',
                  lineHeight: 1.7,
                  borderRadius: '8px',
                  boxShadow: '0 1px 8px rgba(0, 0, 0, 0.03)',
                  margin: '1.5rem auto',
                  maxWidth: '80ch',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border, #e2e8f0)',
                    paddingBottom: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <h1 style={{ 
                      fontSize: '1.8em', 
                      fontWeight: 700, 
                      margin: 0,
                      color: 'var(--foreground, #283044)'
                    }}>
                      {editTitle || selectedPage.title}
                    </h1>
                    <button 
                      onClick={() => setIsPreviewModeActive(false)}
                      className="pm-button pm-button-primary"
                      style={{ 
                        marginLeft: '15px',
                        padding: '8px 15px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      Volver al Editor
                    </button>
                  </div>
                  <div 
                    className="prose-preview" 
                    style={{ 
                      maxWidth: '100%',
                      margin: '0 auto',
                      fontFamily: 'Geist, Arial, Helvetica, sans-serif',
                      color: 'var(--foreground, #283044)'
                    }}
                  >
                    <RichTextRenderer content={draftContent} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>Selecciona una página del árbol para ver o editar su contenido.</p>
          )}
        </div>
        {/* Panel derecho - Tabla de Contenidos */}
        {!isPreviewModeActive && selectedPage && (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            borderLeft: "1px solid #ccc",
            width: isTocVisible ? 250 : 40,
            overflow: 'hidden',
            transition: 'width 0.3s ease-in-out',
            position: 'relative',
            flexShrink: 0
          }}>
            {/* Encabezado del panel TOC */}
            <div style={{
              padding: '10px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '60px',
              backgroundColor: '#f8f9fa',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              {isTocVisible && <span>Contenido</span>}
              <button 
                onClick={() => setIsTocVisible(!isTocVisible)} 
                className="pm-button pm-button-subtle"
                style={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: isTocVisible ? 'auto' : '30px'
                }}
                title={isTocVisible ? "Ocultar contenido" : "Mostrar contenido"}
              >
                {isTocVisible ? "Ocultar ▶" : "☰"}
              </button>
            </div>
            {/* Collapsible ToC Content Panel */}
            <div style={{
              flex: 1, // Takes available space in the column
              width: isTocVisible ? 250 : 0, // Animate width (adjust as needed)
              padding: isTocVisible ? "10px 10px 10px 0px" : 0, // Animate padding (adjust right padding)
              overflowY: "auto",
              overflowX: "hidden", // Hide content that overflows during transition
              transition: "width 0.3s ease-in-out, padding 0.3s ease-in-out",
              display: 'flex', // Keep as flex to allow EditorTableOfContents to fill height
              flexDirection: 'column',
              visibility: isTocVisible ? 'visible' : 'hidden', // Use visibility for smoother transition with padding
            }}>
              {/* Inner content visibility still controlled by isTocVisible to prevent rendering when hidden */}
              <div style={{ display: isTocVisible ? 'block' : 'none', flexShrink: 0 /* Prevent shrinking */ }}>
                <EditorTableOfContents editor={activeEditorInstance} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
