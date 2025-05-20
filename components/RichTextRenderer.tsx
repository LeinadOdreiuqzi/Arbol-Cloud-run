"use client";
import React from 'react';
import styles from './RichTextRenderer.module.css';

import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
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
    html = content;
  } else if (typeof content === 'object') {
    try {
      html = generateHTML(content, [
        StarterKit,
        Link,
        Image,
        Table,
        TableRow,
        TableCell,
        TableHeader,
      ]);
    } catch {
      html = '<em>Contenido no válido</em>';
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