"use client";
import React from 'react';
import styles from './RichTextRenderer.module.css';

import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { CustomImageExtension } from '@/lib/tiptap-extensions/CustomImageExtension';
import { VideoExtension } from '@/lib/tiptap-extensions/VideoExtension';
import { EmbedFrameExtension } from '../editor/nodes/EmbedNode';
import { CitationMark } from '../editor/nodes/CitationMark';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";


interface RichTextRendererProps {
  content: any; // Puede ser string (HTML) o JSON de TipTap
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  if (!content) {
    return <div className={styles['rich-text-empty']}>No hay contenido disponible</div>;
  }

  let html = '';
  if (typeof content === 'string') {
    // If content is already HTML, trust it but consider sanitization in a real app
    html = content;
  } else if (typeof content === 'object' && content.type === 'doc' && Array.isArray(content.content)) {
    // Check if content is a valid TipTap JSON object
    try {
      html = generateHTML(content, [
        // Configure StarterKit with only the extensions we need
        StarterKit.configure({
          // Ensure heading levels match SimpleEditor for consistency
          heading: {
            levels: [1, 2, 3, 4],
          },
          // Disable extensions we don't need
          dropcursor: false,
          gapcursor: false,
          // Explicitly enable other extensions we want to use
          blockquote: {},
          bulletList: {},
          codeBlock: {},
          hardBreak: {},
          horizontalRule: {},
          listItem: {},
          orderedList: {},
          paragraph: {}
        }),
        // Add our custom extensions
        CustomImageExtension,
        VideoExtension,
        // Add other extensions
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        }),
        Table.configure({ resizable: true }), 
        TableRow,
        TableHeader,
        TableCell,
        EmbedFrameExtension,
        CitationMark,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Subscript,
        Superscript,
        // Add any other extensions from SimpleEditor that affect HTML output
        // Placeholder is editor-only, not needed for rendering
        // GlobalDragHandle and AutoJoiner are editor-only
      ]);
    } catch (error) {
      console.error("Error generating HTML from TipTap JSON:", error);
      html = '<em>Contenido no válido o error al renderizar.</em>';
    }
  }

  return (
    <div 
      className={styles['rich-text-content']}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichTextRenderer;