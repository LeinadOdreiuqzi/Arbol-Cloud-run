"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Editor } from "@tiptap/react";

type Heading = { 
  id: string; 
  text: string; 
  level: number; 
  pos: number; // Position in the document
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface EditorTableOfContentsProps {
  editor: Editor | null;
}

export default function EditorTableOfContents({ editor }: EditorTableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  // Define theme type and use a properly typed constant
  type Theme = 'dark' | 'light';
  const theme: Theme = 'light';
  // Use type assertion to ensure type safety
  const isDark = (theme as string) === 'dark'; 

  const extractHeadingsFromEditor = useCallback(() => {
    if (!editor) return;

    const extractedHeadings: Heading[] = [];
    let idCounter = 0; // For unique IDs if multiple headings have same text

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const text = node.textContent.trim();
        if (!text) return; // Skip empty headings

        const level = node.attrs.level as number;
        // Create a unique ID for each heading
        // slugify might produce same slugs for different headings if text is similar after slugification
        // Or if headings have same text. So, append a counter.
        const baseSlug = slugify(text);
        const id = `${baseSlug}-${idCounter++}`;
        
        extractedHeadings.push({ id, text, level, pos });
      }
    });
    setHeadings(extractedHeadings);
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      setHeadings([]); // Clear headings if editor is not available
      return;
    }

    // Initial extraction
    extractHeadingsFromEditor();

    // Listen for updates
    const updateHandler = () => {
      extractHeadingsFromEditor();
    };
    editor.on("update", updateHandler);
    editor.on("selectionUpdate", updateHandler); // Also update on selection for active state later

    return () => {
      editor.off("update", updateHandler);
      editor.off("selectionUpdate", updateHandler);
    };
  }, [editor, extractHeadingsFromEditor]);

  const handleHeadingClick = (headingPos: number, headingId: string) => {
    if (!editor) return;

    // Find the node to ensure it still exists and get its current size
    let targetNode = null;
    let targetPosStart = -1;
    editor.state.doc.descendants((node, pos) => {
        if (pos === headingPos && node.type.name === 'heading') {
            targetNode = node;
            targetPosStart = pos;
            return false; // Stop iteration
        }
    });

    if (targetNode && targetPosStart !== -1) {
      const endPos = targetPosStart + (targetNode as any).nodeSize;
      editor.chain().focus().setTextSelection({ from: targetPosStart, to: endPos }).run();
      editor.commands.scrollIntoView();

      // Update URL hash without page jump (optional, for visual consistency if needed)
      // window.history.pushState(null, '', `#${headingId}`);
    } else {
        console.warn(`EditorTableOfContents: Could not find heading at pos ${headingPos} for ID ${headingId}`);
    }
  };

  if (!headings.length) return <div style={{padding: "1rem", fontSize: "0.9em", color: "#777"}}>No headings in the document.</div>;

  // Styling (simplified from WikiHeadingsLinks, can be themed later)
  const headerColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(50, 50, 50, 0.9)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const bgColor = isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(248, 248, 248, 0.8)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <div className="editor-toc" style={{ 
      padding: "12px 16px",
      borderRadius: "8px",
      background: bgColor,
      border: `1px solid ${borderColor}`,
      maxHeight: 'calc(100vh - 200px)', // Example max height, adjust as needed
      overflowY: 'auto',
      width: '100%', // Ensure it takes up its container's width
    }}>
      <h3 style={{ 
        fontSize: "0.95rem", 
        fontWeight: 600, 
        marginTop: 0,
        marginBottom: "10px", 
        color: headerColor,
        paddingBottom: "8px",
        borderBottom: `1px solid ${borderColor}`
      }}>
        Table of Contents
      </h3>
      <ul style={{ 
        margin: 0, 
        padding: 0, 
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}>
        {headings.map((h) => (
          <li 
            key={h.id} 
            style={{ 
              marginLeft: (h.level - 1) * 12, // Indentation based on level
              transition: "background-color 0.2s ease",
            }}
          >
            <a
              href={`#${h.id}`} // Still useful for semantic links, even if we handle click
              onClick={(e) => {
                e.preventDefault();
                handleHeadingClick(h.pos, h.id);
              }}
              style={{ 
                display: "block",
                padding: "3px 6px",
                borderRadius: "4px",
                fontSize: `${1 - (h.level * 0.05)}em`, // Decrease font size for deeper levels
                color: isDark ? 'rgba(200, 200, 200, 0.9)' : 'rgba(60, 60, 60, 1)',
                textDecoration: 'none',
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBgColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={h.text}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
