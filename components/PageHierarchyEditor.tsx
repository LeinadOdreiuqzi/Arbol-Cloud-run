import React, { useState } from "react";
import RichTextEditor from "./RichTextEditor";
import RichTextRenderer from "./RichTextRenderer";

// Datos mock para jerarquía
const mockPages = [
  { id: 1, title: "Área: Química", parent_id: null, level: 1, content: { blocks: [] } },
  { id: 2, title: "Especialidad: Química aplicada", parent_id: 1, level: 2, content: { blocks: [] } },
  { id: 3, title: "Tema: Química medicinal", parent_id: 2, level: 3, content: { blocks: [] } },
  { id: 4, title: "Contenido: Lípidos", parent_id: 3, level: 4, content: { blocks: [] } },
];

function buildTree(pages: any[]) {
  const map = new Map();
  pages.forEach(page => map.set(page.id, { ...page, children: [] }));
  const tree: any[] = [];
  map.forEach(page => {
    if (page.parent_id) {
      map.get(page.parent_id).children.push(page);
    } else {
      tree.push(page);
    }
  });
  return tree;
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

export default function PageHierarchyEditor() {
  const [pages, setPages] = useState<any[]>(mockPages);
  const [selectedId, setSelectedId] = useState<number>(pages[0].id);
  const selectedPage = pages.find(p => p.id === selectedId);

  const handleContentChange = (data: any) => {
    setPages(pages => pages.map(p => p.id === selectedId ? { ...p, content: data } : p));
  };

  const tree = buildTree(pages);

  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", minHeight: 400 }}>
      <div style={{ width: 260, background: "#f6f8fa", padding: 18, borderRadius: 10, boxShadow: "0 2px 8px #0001" }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Jerarquía de páginas</div>
        {tree.map(root => (
          <TreeNode key={root.id} node={root} onSelect={n => setSelectedId(n.id)} selectedId={selectedId} />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: 8 }}>{selectedPage?.title}</h3>
        <RichTextEditor content={selectedPage?.content} onChange={handleContentChange} />
        <div style={{ marginTop: 18, background: "#fafafa", padding: 18, borderRadius: 8 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Vista previa</div>
          <RichTextRenderer content={selectedPage?.content} />
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>JSON generado para la base de datos:</div>
          <textarea
            style={{ width: "100%", minHeight: 100, fontFamily: "monospace", fontSize: 13, background: "#f6f8fa", border: "1px solid #ddd", borderRadius: 6, padding: 8 }}
            readOnly
            value={JSON.stringify(selectedPage?.content, null, 2)}
            onFocus={e => e.target.select()}
          />
        </div>
      </div>
    </div>
  );
}
