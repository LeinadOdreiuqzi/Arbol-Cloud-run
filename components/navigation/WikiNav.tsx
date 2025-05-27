"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

// Type definition for topic tree nodes
type TopicNode = {
  id: string;
  label: string;
  url: string;
  children?: TopicNode[];
};

// Fetch the topic tree from the API
async function fetchNotesTree(): Promise<TopicNode[]> {
  const res = await fetch("/api/pages");
  if (!res.ok) throw new Error("Failed to fetch notes tree");
  return res.json();
}

function TopicDropdown({ node }: { node: TopicNode }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!node.children && node.children.length > 0;

  return (
    <li style={{ marginBottom: hasChildren ? 12 : 2 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {typeof node.url === 'string' && node.url ? (
          <Link href={node.url} className={hasChildren ? "wiki-link-main" : "wiki-anchor-secondary"}>
            {node.label}
          </Link>
        ) : (
          <span className={hasChildren ? "wiki-link-main" : "wiki-anchor-secondary"}>
            {node.label}
          </span>
        )}
        {hasChildren && (
          <button
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
            onClick={() => setOpen(o => !o)}
            style={{
              marginLeft: 6,
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 18,
              color: open ? "#2563eb" : "#64748b",
              width: 24,
              height: 24,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.18s, background 0.18s",
              outline: open ? "2px solid #2563eb22" : "none",
              boxShadow: "none"
            }}
            tabIndex={0}
          >
            {open ? "▾" : "▸"}
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul style={{ marginLeft: 20, marginTop: 4 }}>
          {node.children!.map(child => (
            <TopicDropdown key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

import TextSizeControls from './TextSizeControls';

export default function WikiNav({ initialNavOpen = true, ThemeToggle }: { 
  initialNavOpen?: boolean; 
  ThemeToggle: React.ComponentType; 
}) {
  const [navOpen, setNavOpen] = useState(initialNavOpen);
  const [tree, setTree] = useState<TopicNode[] | null>(null);
  
  useEffect(() => {
    fetchNotesTree().then(setTree).catch(() => setTree([]));
  }, []);

  return (
    <aside className={`wiki-nav${navOpen ? "" : " nav-hidden"}`} style={{ position: "relative" }}>
      <button
        className="wiki-nav-toggle"
        aria-label={navOpen ? "Hide navigation" : "Show navigation"}
        onClick={() => setNavOpen(!navOpen)}
        style={{
          position: "absolute",
          top: 12,
          left: navOpen ? "100%" : 8,
          transform: navOpen ? "translateX(-100%)" : "none",
          zIndex: 50,
          marginLeft: navOpen ? 0 : 0,
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "50%",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          cursor: "pointer",
          boxShadow: "0 1px 4px 0 #0001",
          transition: "left 0.3s, background 0.2s, color 0.2s"
        }}
      >
        {navOpen ? "←" : "→"}
      </button>
      <div style={{ display: navOpen ? "block" : "none" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <ThemeToggle />
          <TextSizeControls />
        </div>
        <nav aria-label="Wiki Topics">
          <h2 style={{ fontSize: "1.1em", marginBottom: 12, fontWeight: 600 }}>Topics & Subtopics</h2>
          {tree ? (
            <ul>
              {tree.map(node => (
                <TopicDropdown key={node.id} node={node} />
              ))}
            </ul>
          ) : (
            <div>Loading...</div>
          )}
        </nav>
      </div>
    </aside>
  );
}
