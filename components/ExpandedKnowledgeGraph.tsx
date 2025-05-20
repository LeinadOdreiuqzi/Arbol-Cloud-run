"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const initialNodes = [
  { id: "science-tree", label: "Science Tree", color: "#2463eb", type: "root" },
  { id: "chemistry", label: "Chemistry", color: "#f59e42", type: "main" },
  { id: "biology", label: "Biology", color: "#22c55e", type: "main" },
  { id: "physics", label: "Physics", color: "#f43f5e", type: "main" },
];
const edges = [
  { from: "science-tree", to: "chemistry" },
  { from: "science-tree", to: "biology" },
  { from: "science-tree", to: "physics" },
  { from: "chemistry", to: "biology" },
  { from: "chemistry", to: "physics" },
];

const NODE_SIZES: Record<string, number> = {
  root: 24,
  main: 16,
  sub: 10,
};
const WIDTH = 700;
const HEIGHT = 520;
const PHYSICS_ITER = 2;

function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "light";
}

const ExpandedKnowledgeGraph: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [dragged, setDragged] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseMoved, setMouseMoved] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; vx: number; vy: number }>>(() => {
    const cx = WIDTH / 2, cy = HEIGHT / 2, r = 170;
    const obj: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
    initialNodes.forEach((n) => {
      if (n.type === "root") {
        obj[n.id] = { x: cx, y: cy, vx: 0, vy: 0 };
      } else {
        const angleStep = (2 * Math.PI) / (initialNodes.length - 1);
        obj[n.id] = {
          x: cx + r * Math.cos((initialNodes.findIndex(nd => nd.id === n.id) - 1) * angleStep),
          y: cy + r * Math.sin((initialNodes.findIndex(nd => nd.id === n.id) - 1) * angleStep),
          vx: 0,
          vy: 0,
        };
      }
    });
    return obj;
  });
  const router = useRouter();

  // THEME: Watch for changes
  useEffect(() => {
    const update = () => setTheme(getTheme());
    update();
    window.addEventListener("storage", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true });
    return () => {
      window.removeEventListener("storage", update);
      observer.disconnect();
    };
  }, []);

  // PHYSICS: Simple force-directed layout
  useEffect(() => {
    let animation: number;
    function step() {
      setPositions(prev => {
        const next = { ...prev };
        for (let i = 0; i < initialNodes.length; ++i) {
          for (let j = i + 1; j < initialNodes.length; ++j) {
            const a = initialNodes[i], b = initialNodes[j];
            const dx = next[a.id].x - next[b.id].x;
            const dy = next[a.id].y - next[b.id].y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const minDist = (NODE_SIZES[a.type || 'sub'] || 10) + (NODE_SIZES[b.type || 'sub'] || 10) + 10;
            if (dist < minDist) {
              const force = 0.12 * (minDist - dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              next[a.id].vx += fx;
              next[a.id].vy += fy;
              next[b.id].vx -= fx;
              next[b.id].vy -= fy;
            }
          }
        }
        for (const edge of edges) {
          const a = next[edge.from], b = next[edge.to];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const desired = 120;
          if (dist > 0.1) {
            const force = 0.03 * (dist - desired);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }
        for (const n of initialNodes) {
          if (dragged === n.id) continue;
          next[n.id].vx *= 0.7;
          next[n.id].vy *= 0.7;
          next[n.id].x += next[n.id].vx;
          next[n.id].y += next[n.id].vy;
          next[n.id].x = Math.max(NODE_SIZES[n.type || 'sub'] || 10, Math.min(WIDTH - (NODE_SIZES[n.type || 'sub'] || 10), next[n.id].x));
          next[n.id].y = Math.max(NODE_SIZES[n.type || 'sub'] || 10, Math.min(HEIGHT - (NODE_SIZES[n.type || 'sub'] || 10), next[n.id].y));
        }
        return next;
      });
      animation = requestAnimationFrame(step);
    }
    for (let i = 0; i < PHYSICS_ITER; ++i) step();
    return () => cancelAnimationFrame(animation);
  }, [dragged]);

  function handlePointerDown(e: React.PointerEvent, id: string) {
    setDragged(id);
    setMouseMoved(false);
    setOffset({
      x: positions[id].x - e.nativeEvent.offsetX,
      y: positions[id].y - e.nativeEvent.offsetY,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragged) return;
    setMouseMoved(true);
    setPositions(prev => ({
      ...prev,
      [dragged]: {
        ...prev[dragged],
        x: e.nativeEvent.offsetX + offset.x,
        y: e.nativeEvent.offsetY + offset.y,
        vx: 0,
        vy: 0,
      },
    }));
  }
  function handlePointerUp() {
    setDragged(null);
    setTimeout(() => setMouseMoved(false), 0);
  }

  // Highlight logic
  const related = hovered
    ? [
        hovered,
        ...edges
          .filter(e => e.from === hovered || e.to === hovered)
          .map(e => (e.from === hovered ? e.to : e.from)),
      ]
    : [];

  // Theme-based colors
  const bg = theme === "dark" ? "#232329" : "#f0f0f0";
  const edgeColor = theme === "dark" ? "#444" : "#bbb";
  const highlightEdge = theme === "dark" ? "#60a5fa" : "#2463eb";
  const textColor = theme === "dark" ? "#eee" : "#222";

  function handleNodeClick(id: string) {
    if (!dragged && !mouseMoved) {
      setSelected(id);
      router.push(`/notes/${id}`);
    }
  }

  return (
    <div
      style={{ width: WIDTH, height: HEIGHT, background: bg, borderRadius: 12, boxShadow: "0 4px 32px #0003", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Close button */}
      <button
        type="button"
        aria-label="Close expanded graph"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 2,
          width: 32,
          height: 32,
          border: "none",
          borderRadius: 8,
          background: bg,
          boxShadow: "0 1px 4px 0 #0002",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M4 4l10 10M14 4L4 14" stroke={theme === "dark" ? "#eee" : "#222"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <svg width={WIDTH} height={HEIGHT} style={{ display: "block", touchAction: "none" }}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          const isRelated = hovered && (related.includes(edge.from) && related.includes(edge.to));
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isRelated ? highlightEdge : edgeColor}
              strokeWidth={isRelated ? 3 : 1.5}
              opacity={hovered && !isRelated ? 0.15 : 1}
            />
          );
        })}
        {/* Nodes with variable size */}
        {initialNodes.map(node => {
          const pos = positions[node.id];
          const isActive = hovered === node.id || selected === node.id;
          const isRelated = related.includes(node.id);
          const r = NODE_SIZES[node.type || 'sub'] || 10;
          return (
            <g
              key={node.id}
              tabIndex={0}
              style={{ cursor: dragged === node.id ? "grabbing" : "pointer" }}
              onClick={() => handleNodeClick(node.id)}
              onPointerDown={e => handlePointerDown(e, node.id)}
              onMouseOver={() => setHovered(node.id)}
              onFocus={() => setHovered(node.id)}
              onMouseOut={() => setHovered(null)}
              onBlur={() => setHovered(null)}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={isActive ? node.color : isRelated ? node.color + "88" : theme === "dark" ? "#18181b" : "#fff"}
                stroke={isActive || isRelated ? node.color : edgeColor}
                strokeWidth={isActive ? 4 : 2}
                opacity={hovered && !isRelated ? 0.13 : 1}
              />
              <text
                x={pos.x}
                y={pos.y + r + 14}
                textAnchor="middle"
                fontWeight={isActive ? "bold" : 500}
                fontSize={r >= 20 ? 17 : r >= 14 ? 13 : 10}
                fill={isActive || isRelated ? textColor : theme === "dark" ? "#aaa" : "#888"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ExpandedKnowledgeGraph;
