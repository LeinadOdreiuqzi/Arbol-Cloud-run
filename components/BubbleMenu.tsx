import React, { useEffect, useRef } from 'react';
import { BubbleMenu as TiptapBubbleMenu, useEditor } from '@tiptap/react';

interface BubbleMenuProps {
  editor: any;
  onInsertTable: () => void;
  onInsertImage: () => void;
}

const BubbleMenu: React.FC<BubbleMenuProps> = ({ editor, onInsertTable, onInsertImage }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Prevent default right-click and show bubble menu
  useEffect(() => {
    if (!editor) return;
    const handleContextMenu = (event: MouseEvent) => {
      if (!editor.options.element.contains(event.target as Node)) return;
      event.preventDefault();
      // Select position under cursor
      const pos = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
      if (pos) {
        editor.chain().focus().setTextSelection(pos.pos).run();
      }
      editor.commands.focus();
      // Show menu (simulate selection)
      editor.chain().setTextSelection(editor.state.selection.from).run();
    };
    editor.options.element.addEventListener('contextmenu', handleContextMenu);
    return () => {
      editor.options.element.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <TiptapBubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div ref={menuRef} style={{ display: 'flex', gap: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 8, boxShadow: '0 2px 12px #0002', zIndex: 1000 }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()} style={{ fontWeight: 700 }}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} style={{ fontStyle: 'italic' }}>I</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lista</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Lista</button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝ Cita</button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{'</>'}</button>
        <button onClick={onInsertTable}>Tabla</button>
        <button onClick={onInsertImage}>Imagen</button>
      </div>
    </TiptapBubbleMenu>
  );
};

export default BubbleMenu;
