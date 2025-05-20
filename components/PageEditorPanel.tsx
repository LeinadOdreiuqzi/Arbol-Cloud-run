import React from "react";
import RichTextEditor from "./RichTextEditor";

export default function PageEditorPanel({
  selectedPage, draftContent, draftChanged, loading, editTitle, showSaveNotice, showErrorNotice,
  onEditTitle, onDelete, onDraftChange, onSave, onUndoDraft, getTypeByLevel
}: any) {
  return (
    <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
      {selectedPage ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <input
              value={editTitle}
              onChange={e => onEditTitle(e.target.value)}
              placeholder={selectedPage.title}
              style={{ fontSize: 20, fontWeight: 600, border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', marginRight: 12 }}
            />
            <span style={{ color: '#888', fontSize: 14 }}>
              [{getTypeByLevel(selectedPage.level)}]
            </span>
            <button onClick={() => onDelete(selectedPage)} style={{ color: 'red', border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', marginLeft: 8 }}>🗑️</button>
          </div>
          <RichTextEditor key={`editor-page-${selectedPage?.id}`} content={draftContent} onChange={onDraftChange} />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onSave} disabled={loading || !draftChanged} style={{marginRight:8}}>Guardar cambios</button>
            <button onClick={onUndoDraft} disabled={loading || !draftChanged}>Deshacer cambios</button>
            {showSaveNotice && <span style={{color:'#27ae60',marginLeft:8}}>¡Cambios guardados!</span>}
            {showErrorNotice && <span style={{color:'#c00',marginLeft:8}}>{showErrorNotice}</span>}
          </div>
        </div>
      ) : (
        <div style={{ color: '#888' }}>Selecciona una página para editar</div>
      )}
    </div>
  );
}
