import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'; 
import { useEditor, EditorContent, Editor, BubbleMenu, JSONContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'; 
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table'; 
import TableRow from '@tiptap/extension-table-row'; 
import TableCell from '@tiptap/extension-table-cell'; 
import TableHeader from '@tiptap/extension-table-header'; 
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Extension } from '@tiptap/core'; 
import { Plugin, PluginKey } from '@tiptap/pm/state'; 
import { createLowlight, all } from 'lowlight'; 
import tippy, { Instance as TippyInstance, Props as TippyProps } from 'tippy.js'; 
import 'tippy.js/dist/tippy.css'; 
import { Suggestion, SuggestionProps, SuggestionKeyDownProps, SuggestionOptions } from '@tiptap/suggestion'; 

import css from './RichTextEditor.module.css';
import BlockInsertHandle from '../lib/tiptap-extensions/BlockInsertHandle'; 
import ImageNodeView from './ImageNodeView'; 

// Create the lowlight instance with all registered languages
const lowlightInstance = createLowlight(all); 

// --- Slash Command Configuration ---

interface CommandProps extends SuggestionProps {
  editor: Editor;
  range: any; // Keeping 'any' for now, Tiptap types can be complex here
}

interface CommandItem {
  title: string;
  command: (props: CommandProps) => void;
}

// Define command items
const commandItems: CommandItem[] = [
  { title: 'Paragraph', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('paragraph').run() },
  { title: 'Heading 1', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
  { title: 'Heading 2', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
  { title: 'Heading 3', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() },
  { title: 'Bullet List', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  { title: 'Numbered List', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
  { title: 'Table', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: 'Code Block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  // Add Image command
  {
    title: 'Image',
    command: ({ editor, range }) => {
      const url = window.prompt('Enter image URL');
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
];

// Suggestion configuration object
type EditorSuggestionOptions = Omit<SuggestionOptions<CommandItem>, 'editor'>;

const suggestionConfig: EditorSuggestionOptions = {
  items: ({ query }: { query: string }) => {
    return commandItems.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10); // Filter and limit items
  },
  render: () => {
    let component: HTMLDivElement | null;
    let popup: any; // Store tippy instance

    return {
      onStart: (props: SuggestionProps<CommandItem>) => {
        component = document.createElement('div');
        component.className = css.suggestionPopup;
        document.body.appendChild(component);

        const updateList = (items: CommandItem[]) => {
          if (!component) return;
          component.innerHTML = ''; 
          if (items.length === 0) return;

          const ul = document.createElement('ul');
          items.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = item.title;
            li.setAttribute('data-index', String(index));
            li.addEventListener('click', () => {
              props.command(item); 
            });
            ul.appendChild(li);
          });
          component.appendChild(ul);
        };

        popup = tippy(document.body, {
          getReferenceClientRect: () => {
            // Handle potential null from Tiptap's clientRect
            const rect = props.clientRect?.();
            return rect || new DOMRect(0, 0, 0, 0); // Provide a default if null
          },
          appendTo: () => document.body,
          content: component,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });

        updateList(props.items);
      },

      onUpdate(props: SuggestionProps<CommandItem>) {
        if (!component || !popup) return;

        const updateList = (items: CommandItem[]) => {
          if (!component) return;
          component.innerHTML = ''; 
          if (items.length === 0) return;

          const ul = document.createElement('ul');
          items.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = item.title;
            li.setAttribute('data-index', String(index));
            li.addEventListener('click', () => {
              props.command(item);
            });
            ul.appendChild(li);
          });
          component.appendChild(ul);
        };
        updateList(props.items);

        if (props.items.length === 0) {
          popup[0]?.hide();
        } else {
          popup[0]?.show();
          popup[0]?.setProps({
            getReferenceClientRect: () => {
              const rect = props.clientRect?.();
              return rect || new DOMRect(0, 0, 0, 0);
            },
          });
        }
      },

      onKeyDown({ event }: SuggestionKeyDownProps) {
        if (event.key === 'Escape') {
          popup[0]?.hide();
          return true; // Mark event as handled
        }
        return false; // Don't mark event as handled
      },

      onExit() {
        popup?.[0]?.destroy(); 
        component?.remove();
        component = null; 
      },
    };
  },
  char: '/',
  command: ({ editor, range, props }: { editor: Editor, range: any, props: CommandItem }) => {
    // 'props' here is the selected 'CommandItem'
    props.command({ editor, range, query: '', text: '', items: [], command: props.command, decorationNode: null, clientRect: null });
  },
  allow: ({ state, range }: { state: any, range: any }) => {
    // Example: Only allow in empty paragraphs
    // const $from = state.selection.$from
    // const parent = $from.parent
    return true; // Always allow for now
  },
};

// --- RichTextEditor Component Props Interface ---
interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
}

// --- RichTextEditor Component ---
const RichTextEditor = forwardRef<any, RichTextEditorProps>((props, ref) => {
  const { content, onChange } = props;
  const [isFocused, setIsFocused] = useState(false);
  const draftRef = useRef<JSONContent | null>(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
      }),
      Link.configure({ openOnClick: false }), 
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView);
        },
      }),
      Table.configure({ resizable: true }), 
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Escribe el contenido aquí… o presiona "/" para comandos' }),
      CodeBlockLowlight.configure({ lowlight: lowlightInstance }),

      Extension.create({
        name: 'ensureTrailingParagraph',
        addProseMirrorPlugins() {
          return [
            new Plugin({
              key: new PluginKey('ensureTrailingParagraph'),
              appendTransaction: (transactions, oldState, newState) => {
                const lastNode = newState.doc.lastChild;
                const endPos = newState.doc.content.size;
                const paragraphNode = newState.schema.nodes.paragraph;
                if (lastNode && lastNode.type !== paragraphNode) {
                  return newState.tr.insert(endPos, paragraphNode.create());
                }
                return;
              },
            }),
          ];
        },
      }),

      // Custom Extension for '+' block insert handle
      BlockInsertHandle,

      Extension.create({
        name: 'slashCommands',
        addProseMirrorPlugins() {
          return [
            Suggestion({...suggestionConfig, editor: this.editor}), // Pass editor instance here
          ];
        },
      }),
    ],
    content: content || { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      console.log("[RichTextEditor] onUpdate triggered");
      const currentJson = editor.getJSON();
      onChange(currentJson);
    },
    onCreate: ({ editor }) => {
      draftRef.current = editor.getJSON();
      console.log("[RichTextEditor] onCreate: draftRef initialized.");
    },
    onDestroy: () => {
      console.log("[RichTextEditor] onDestroy");
    },
    immediatelyRender: false,
    autofocus: false,
    editorProps: {
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus(),
    // Keep null checks as editor might still be null initially
    setContent: (newContent: JSONContent) => editor?.commands.setContent(newContent, false),
    getJSON: () => editor?.getJSON(),
  }), [editor]);

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const editorElement = editor?.options.element;
    editorElement?.addEventListener('focusin', handleFocus);
    editorElement?.addEventListener('focusout', handleBlur);

    return () => {
      editorElement?.removeEventListener('focusin', handleFocus);
      editorElement?.removeEventListener('focusout', handleBlur);
    };
  }, [editor]);

  useEffect(() => {
    console.log("[RichTextEditor] Content Prop Effect: Received new content.");
    const editorJsonString = JSON.stringify(editor?.getJSON() || {});
    const contentJsonString = JSON.stringify(content || { type: 'doc', content: [] });

    if (editor && contentJsonString !== editorJsonString) {
      console.log("[RichTextEditor] Content Prop Effect: Updating editor content.");
      editor.commands.setContent(content || { type: 'doc', content: [] }, false);
      draftRef.current = editor.getJSON();
      console.log("[RichTextEditor] Content Prop Effect: draftRef updated.");
    } else {
      console.log("[RichTextEditor] Content Prop Effect: Content matches editor state or editor not ready, skipping update.");
    }
  }, [content, editor]);

  // Define the addImage function here
  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // Expose editor instance if needed via ref
  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }));

  useEffect(() => {
    // Update editor content if the prop changes externally
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      console.log("[RichTextEditor] External content update detected, applying to editor.");
      draftRef.current = content; // Update ref first
      editor.commands.setContent(content, false); // Update editor without emitting update
    }
  }, [content, editor]);


  // Insert Table Function
  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  // Insert Image Function (Example) - Renamed from addImage to avoid conflict if needed
  const insertImage = useCallback(() => {
    const url = window.prompt('URL de la imagen');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);


  if (!editor) {
    return <div>Cargando editor...</div>;
  }

  return (
    <div className={`${css.editorContainer} ${isFocused ? css.focused : ''}`}>
      {/* Use the standard BubbleMenu and render buttons inside */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100, placement: 'top-start' }} className={css.bubbleMenu}>
          {/* Formatting Buttons */}
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? css.isActive : ''}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? css.isActive : ''}>I</button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? css.isActive : ''}>S</button>
          <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? css.isActive : ''}>Code</button>
          <span className={css.separator}>|</span>
          {/* Block Type Buttons */}
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? css.isActive : ''}>H1</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? css.isActive : ''}>H2</button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? css.isActive : ''}>List</button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? css.isActive : ''}>Num</button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? css.isActive : ''}>Quote</button>
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? css.isActive : ''}>Code Block</button>
          <span className={css.separator}>|</span>
          {/* Insert Buttons - Use the functions directly in onClick */}
          <button onClick={insertImage}>IMG</button>
          <button onClick={insertTable}>Table</button> {/* Add Table button */}
        </BubbleMenu>
      )}
      <EditorContent
        editor={editor}
        className={css.editorContent}
        onContextMenu={(e) => {
          e.preventDefault();
          // No need to manually show/hide BubbleMenu here if using standard one
        }}
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor'; // Add display name

export default RichTextEditor;
