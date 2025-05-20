import React from "react";

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

export default function PageHierarchyPanel({
  tree, selectedId, onSelect, loading, error, onCreateArea, onCreateEspecialidad, onCreateTema, onCreateContenido
}: any) {
  return (
    <div style={{ minWidth: 240 }}>
      <h2 style={{ marginTop: 0 }}>Jerarquía de Páginas</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={onCreateArea} disabled={loading} style={{ marginRight: 6 }}>+ Área</button>
        <button onClick={onCreateEspecialidad} disabled={loading} style={{ marginRight: 6 }}>+ Especialidad</button>
        <button onClick={onCreateTema} disabled={loading} style={{ marginRight: 6 }}>+ Tema</button>
        <button onClick={onCreateContenido} disabled={loading}>+ Contenido</button>
      </div>
      {loading && <div style={{ color: "#888" }}>Cargando...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        {tree.map((node: any) => (
          <TreeNode key={node.id} node={node} onSelect={onSelect} selectedId={selectedId ?? -1} />
        ))}
      </div>
    </div>
  );
}
