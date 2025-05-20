import React, { useEffect, useState, useRef, useCallback } from "react";
import RichTextRenderer from "./RichTextRenderer";
import dynamic from 'next/dynamic';

const SimpleEditor = dynamic(() => import('./SimpleEditor'), {
  ssr: false,
  loading: () => <p>Cargando editor...</p> // Optional loading indicator
});

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

function getTypeByLevel(level: number) {
  switch(level) {
    case 1: return "Área";
    case 2: return "Especialidad";
    case 3: return "Tema";
    case 4: return "Contenido";
    default: return `Nivel ${level}`;
  }
}

function TreeNode({ node, onSelect, selectedId }: { node: any, onSelect: (n: any) => void, selectedId: number }) {
  return (
    <div style={{ marginLeft: 18 }}>
      <div
        style={{
          cursor: "pointer",
          fontWeight: node.id === selectedId ? "bold" : undefined,
          color: node.id === selectedId ? "#1976d2" : undefined,
          background: node.id === selectedId ? "#e3f2fd" : undefined,
          borderRadius: 5,
          padding: "2px 6px",
          marginBottom: 2
        }}
        onClick={() => onSelect(node)}
      >
        {node.title}
      </div>
      {node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child: any) => (
            <TreeNode key={child.id} node={child} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageManager() {
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

  // --- AUTOSAVE cada 1 minuto si hay cambios ---
  /* // Disabling autosave as it seems to cause content deletion issues.
  useEffect(() => {
    console.log(`[PageManager] Autosave Setup: draftChanged=${draftChanged}, saveLoading=${saveLoading}, selectedPage=${!!selectedPage}`);
    if (autosaveTimer.current) clearInterval(autosaveTimer.current);

    if (selectedPage) { // Only set interval if a page is selected
      autosaveTimer.current = setInterval(() => {
        console.log(`[PageManager] Autosave Check: draftChanged=${draftChanged}, saveLoading=${saveLoading}`);
        if (draftChanged && !saveLoading) { // Use saveLoading here
          console.log("[PageManager] AUTOSAVING NOW...");
          handleSaveClick();
        }
      }, 60000); // 1 minuto
      console.log("[PageManager] Autosave Setup: Interval timer set.");
    } else {
      console.log("[PageManager] Autosave Setup: No selected page, interval not set.");
    }

    return () => {
      if (autosaveTimer.current) {
        clearInterval(autosaveTimer.current);
        console.log("[PageManager] Autosave Cleanup: Interval timer cleared.");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftChanged, saveLoading, selectedPage]); // Re-evaluate timer if these change
  */

  // Detecta cambios en el editor
  function handleDraftChange(data: any) {
    console.log("[PageManager] handleDraftChange: Triggered.");
    const incomingDataString = JSON.stringify(data);
    const refDataString = JSON.stringify(draftRef.current);
    const changed = incomingDataString !== refDataString;
    console.log(`[PageManager] handleDraftChange: Data changed compared to ref? ${changed}`);
    setDraftContent(data); 
    setDraftChanged(changed); 
    setShowSaveNotice(false); 
    setShowErrorNotice(false);
  }

  // Guardado manual (guarda JSON puro)
  async function handleSaveClick() {
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
  }

  function handleUndoDraft() {
    setDraftContent(draftRef.current);
    setDraftChanged(false);
    setShowSaveNotice(false);
    setShowErrorNotice(false);
  }

  // --- Modal de confirmación al cambiar de página si hay cambios sin guardar ---
  function handleSelectNodeWithGuard(node: any) {
    if (draftChanged) {
      setShowUnsavedModal(node);
    } else {
      setSelectedId(node.id);
    }
  }
  function confirmChangePage() {
    if (showUnsavedModal && typeof showUnsavedModal === 'object' && showUnsavedModal.id) {
      setSelectedId(showUnsavedModal.id);
    }
    setShowUnsavedModal(false);
  }
  function cancelChangePage() {
    setShowUnsavedModal(false);
  }
  // --- FIN lógica edición controlada ---

  const [showUnsavedModal, setShowUnsavedModal] = useState<false | any>(false);

  const handleCreateArea = async () => {
    await handleCreate(null, 1);
  };
  const handleCreateEspecialidad = async () => {
    if (!selectedPage || selectedLevel !== 1) {
      alert("Selecciona un Área para agregar una Especialidad.");
      return;
    }
    await handleCreate(selectedPage, 2);
  };
  const handleCreateTema = async () => {
    if (!selectedPage || selectedLevel !== 2) {
      alert("Selecciona una Especialidad para agregar un Tema.");
      return;
    }
    await handleCreate(selectedPage, 3);
  };
  const handleCreateContenido = async () => {
    if (!selectedPage || selectedLevel !== 3) {
      alert("Selecciona un Tema para agregar un Contenido.");
      return;
    }
    await handleCreate(selectedPage, 4);
  };

  const handleCreate = async (parent?: any, levelOverride?: number) => {
    let tipo = getTypeByLevel(levelOverride ?? (parent ? parent.level + 1 : 1));
    const title = prompt(`Título del nuevo ${tipo}:`);
    if (!title) return;
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9\-]/g, "");
    const level = levelOverride ?? (parent ? parent.level + 1 : 1);
    const parent_id = parent ? parent.id : null;
    const newPage = { title, slug, level, parent_id, content: { type: 'doc', content: [] } };
    setLoading(true);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPage)
    });
    if (res.ok) {
      const created = await res.json();
      setPages(pages => [...pages, created]);
      setSelectedId(created.id);
    }
    setLoading(false);
  };

  const handleDelete = async (page: any) => {
    if (!window.confirm(`¿Eliminar la página "${page.title}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    const res = await fetch("/api/pages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id })
    });
    if (res.ok) {
      setPages(pages => pages.filter(p => p.id !== page.id));
      setSelectedId(pages[0]?.id ?? null);
    }
    setLoading(false);
  };

  const tree = buildTree(pages);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 100px)" }}>
      {/* Sidebar */} 
      <div style={{ width: 300, borderRight: "1px solid #ccc", padding: 10, overflowY: "auto" }}>
        <h2>Jerarquía</h2>
        {loading && <p>Cargando árbol...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && pages.length > 0 && (
          tree.map(rootNode => (
            <TreeNode key={rootNode.id} node={rootNode} onSelect={handleSelectNodeWithGuard} selectedId={selectedId!} />
          ))
        )}
         <hr style={{ margin: '15px 0' }}/>
         {/* Botones para crear nuevos elementos */} 
         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
           <button onClick={handleCreateArea}>+ Nueva Área</button>
           {/* Show Especialidad button if a level 1+ item is selected, enable only if level 1 is selected */}
           {selectedLevel >= 1 && <button onClick={handleCreateEspecialidad} disabled={selectedLevel !== 1}>+ Nueva Especialidad</button>}
           {/* Show Tema button if a level 2+ item is selected, enable only if level 2 is selected */}
           {selectedLevel >= 2 && <button onClick={handleCreateTema} disabled={selectedLevel !== 2}>+ Nuevo Tema</button>}
           {/* Show Contenido button if a level 3+ item is selected, enable only if level 3 is selected */}
           {selectedLevel >= 3 && <button onClick={handleCreateContenido} disabled={selectedLevel !== 3}>+ Nuevo Contenido</button>}
         </div>
      </div>

      {/* Editor Area */} 
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {selectedPage ? (
          <>
            <input
              type="text"
              value={editTitle || selectedPage.title}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveClick} // Save title on blur maybe?
              style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: 15, padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <div style={{ flex: 1 /* Make editor container fill space */ }}>
              <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f0f7ff', borderRadius: '4px', fontSize: '0.9em' }}>
                <strong>Nota:</strong> El contenido extenso se paginará automáticamente en la visualización. No es necesario dividir manualmente el contenido en páginas.
              </div>
              <SimpleEditor
                key={selectedPage.id} // Ensure editor re-mounts cleanly on page change
                content={draftContent}
                initialContent={selectedPage.content} // Pasar el contenido inicial desde la BD
                onChange={handleDraftChange}
              />
            </div>
            <div style={{ marginTop: 15, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleSaveClick} disabled={!draftChanged || saveLoading}>
                {saveLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button onClick={handleUndoDraft} disabled={!draftChanged || saveLoading}>Descartar</button>
              {showSaveNotice && <span style={{ color: 'green' }}>Guardado ✓</span>}
              {showErrorNotice && <span style={{ color: 'red' }}>{showErrorNotice}</span>}
              {!draftChanged && !showSaveNotice && !showErrorNotice && <span style={{ color: '#888' }}>Contenido al día</span>}
            </div>
          </>
        ) : (
          <p>Selecciona una página del árbol para ver o editar su contenido.</p>
        )}
      </div>

      {/* Modal de confirmación */}
      {showUnsavedModal && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '30px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 1001 }}>
              <h3>Cambios sin guardar</h3>
              <p>Tienes cambios sin guardar. ¿Quieres descartarlos y cambiar de página?</p>
              <button onClick={confirmChangePage} style={{ marginRight: 10 }}>Sí, descartar</button>
              <button onClick={cancelChangePage}>No, cancelar</button>
          </div>
      )}
      {showUnsavedModal && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={cancelChangePage}></div>} 

    </div>
  );
}
