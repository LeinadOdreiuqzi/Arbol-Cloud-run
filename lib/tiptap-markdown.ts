import { generateHTML } from '@tiptap/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export async function tiptapJsonToMarkdown(json: any): Promise<string> {
  try {
    const tiptapMarkdown = await import('tiptap-markdown');
    // @ts-ignore - Suppress persistent error after trying multiple import methods
    return tiptapMarkdown.tiptapToMarkdown(json);
  } catch (err) {
    console.error("Error converting Tiptap JSON to Markdown:", err);
    return '';
  }
}

export async function markdownToTiptapJson(md: string): Promise<any> {
  try {
    const tiptapMarkdown = await import('tiptap-markdown');
    // @ts-ignore - Suppress persistent error after trying multiple import methods
    return tiptapMarkdown.markdownToTiptap(md);
  } catch (err) {
    console.error("Error converting Markdown to Tiptap JSON:", err);
    // Return a valid empty document structure on error
    return { type: 'doc', content: [] };
  }
}
