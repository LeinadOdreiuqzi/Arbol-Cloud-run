import React, { useState, useRef, useEffect, useCallback } from 'react' // Added useCallback
import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react' // Added BubbleMenu, Editor
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
// @ts-ignore - Missing type definitions for these extensions
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'

// Add type declarations for the missing commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleUnderline: {
      toggleUnderline: () => ReturnType;
    };
    setFontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType;
    };
    unsetFontFamily: {
      unsetFontFamily: () => ReturnType;
    };
    setColor: {
      setColor: (color: string) => ReturnType;
    };
    unsetColor: {
      unsetColor: () => ReturnType;
    };
    toggleHighlight: {
      toggleHighlight: (attributes: { color: string }) => ReturnType;
    };
    unsetHighlight: {
      unsetHighlight: () => ReturnType;
    };
  }
}
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
// Node, NodeViewWrapper, PasteRule are encapsulated in new extension files or not needed at top level
import { ReactNodeViewRenderer } from '@tiptap/react' // Still needed for ResizableImageNodeView
import { EmbedFrameExtension } from './nodes/EmbedNode';
import { CitationMark } from './nodes/CitationMark';
import ResizableImageNodeView from './ResizableImageNodeView';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import AutoJoiner from 'tiptap-extension-auto-joiner';

// Import refactored extensions
import { VideoExtension, getVideoEmbedUrl } from '@/lib/tiptap-extensions/VideoExtension' // getVideoEmbedUrl still needed for MenuBar
import { CustomImageExtension as EditorCustomImageExtension } from '@/lib/tiptap-extensions/CustomImageExtension'

// Estilos para el editor
import './SimpleEditor.css'

// DropdownMenu Component
interface DropdownMenuProps {
  title: string | React.ReactNode;
  editor: Editor | null;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  title,
  editor,
  children,
  icon,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Focus first focusable element when dropdown opens
      const firstFocusable = panelRef.current?.querySelector('button, [href], [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        (firstFocusable as HTMLElement).focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // Define the expected props for menu items
  interface MenuItemProps {
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    [key: string]: any; // Allow additional props
  }
  
  // Type guard to check if a component expects an editor prop
  const isEditorComponent = (
    component: React.ElementType<any>,
    props: any
  ): props is { editor: Editor | null } => {
    return typeof component === 'function' && 
           'propTypes' in component && 
           'editor' in (component as any).propTypes;
  };

  // Ensure editor is passed to children
  const childrenWithProps = React.Children.map(children, child => {
    if (!React.isValidElement<MenuItemProps>(child)) {
      return child;
    }

    const childProps = child.props as MenuItemProps;
    const className = `dropdown-item ${childProps.className || ''}`.trim();
    
    // Create a new props object with known properties
    const newProps: Partial<MenuItemProps> = {
      ...childProps,
      className,
      onClick: (e: React.MouseEvent) => {
        childProps.onClick?.(e);
        if (!childProps.disabled) {
          setIsOpen(false);
        }
      }
    };

    // Only add editor prop if the child is a custom component that needs it
    if (typeof child.type === 'function' && isEditorComponent(child.type, child.props)) {
      newProps.editor = editor;
    }

    return React.cloneElement(child, newProps);
  });

  return (
    <div 
      className={`dropdown-menu ${className}`} 
      ref={menuRef}
      onKeyDown={handleKeyDown}
    >
      <button 
        ref={buttonRef}
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={`dropdown-${title}`}
      >
        {icon && <span className="dropdown-icon">{icon}</span>}
        <span className="dropdown-title">{title}</span>
        <span className="dropdown-arrow" aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      <div 
        id={`dropdown-${title}`}
        ref={panelRef}
        className={`dropdown-panel ${isOpen ? 'open' : ''}`}
        role="menu"
        aria-orientation="vertical"
        tabIndex={-1}
      >
        {childrenWithProps}
      </div>
    </div>
  );
};


// getVideoEmbedUrl, VideoComponent, and VideoExtension (Tiptap Node) are now imported or handled by VideoExtension.ts

const MenuBar = ({ editor }: { editor: Editor | null }) => { // Allow null for editor prop
  const fileInputRef = useRef<HTMLInputElement>(null)
  const citationData = useRef({
    sources: new Map<string, string>(),
    nextId: 1
  })

  if (!editor) {
    return null
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        editor.chain().focus().setImage({ src: result }).run()
      }
    }

    reader.readAsDataURL(file)
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const insertVideo = () => {
    const url = window.prompt('Ingresa la URL del video (YouTube, Vimeo, etc.)')
    if (url) {
      const embedUrl = getVideoEmbedUrl(url);
      if (embedUrl) {
        editor.chain().focus().insertContent({
          type: 'video',
          attrs: { src: embedUrl }
        }).run()
      } else {
        alert("URL de video no válida o no soportada.");
      }
    }
  }

  return (
    <div className="menu-bar">
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handleImageUpload} 
      />

      <DropdownMenu title="Formato" editor={editor}>
        <button onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Negrita">
          <span className="icon">𝐁</span> Negrita
        </button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Cursiva">
          <span className="icon">𝐼</span> Cursiva
        </button>
        <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className={editor?.isActive('underline') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Subrayado">
          <span className="icon"><u>U</u></span> Subrayado
        </button>
        <button onClick={() => editor?.chain().focus().toggleStrike().run()} className={editor?.isActive('strike') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Tachado">
          <span className="icon">S̶</span> Tachado
        </button>
        <button onClick={() => editor?.chain().focus().toggleCode().run()} className={editor?.isActive('code') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Código">
          <span className="icon">{'</>'}</span> Código
        </button>
        <button onClick={() => editor?.chain().focus().toggleSubscript().run()} className={editor?.isActive('subscript') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Subíndice">
          <span className="icon">ₓ</span> Subíndice
        </button>
        <button onClick={() => editor?.chain().focus().toggleSuperscript().run()} className={editor?.isActive('superscript') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Superíndice">
          <span className="icon">ˣ</span> Superíndice
        </button>
        <button onClick={() => editor?.chain().focus().unsetAllMarks().run()} title="Limpiar formato" className="menu-bar-button">
          <span className="icon">🧹</span> Limpiar Formato
        </button>
      </DropdownMenu>

      <DropdownMenu title="Fuente" editor={editor}>
        <div className="dropdown-item-group">
          <label htmlFor="font-family-select" className="dropdown-label">Familia:</label>
          <select
            id="font-family-select"
            className="dropdown-select"
            value={editor?.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) editor?.chain().focus().setFontFamily(value).run();
              else editor?.chain().focus().unsetFontFamily().run();
            }}
          >
            <option value="">Default</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="sans-serif">Sans-Serif (Genérico)</option>
            <option value="serif">Serif (Genérico)</option>
            <option value="monospace">Monospace (Genérico)</option>
          </select>
        </div>
        {/* Font size control will be omitted as per instructions due to complexity */}
      </DropdownMenu>

      <DropdownMenu title="Color" editor={editor}>
        <div className="dropdown-item-group">
          <label htmlFor="text-color-input" className="dropdown-label">Texto:</label>
          <div className="color-input-wrapper">
            <input
              type="color"
              id="text-color-input"
              className="dropdown-color-picker"
              value={editor?.getAttributes('textStyle').color || '#000000'}
              onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
              title="Color de Texto"
            />
            <button onClick={() => editor?.chain().focus().unsetColor().run()} className="menu-bar-button clear-color-button" title="Limpiar color de texto">
              <span className="icon">🚫</span>
            </button>
          </div>
        </div>
        <div className="dropdown-item-group">
          <label htmlFor="highlight-color-input" className="dropdown-label">Resaltado:</label>
          <div className="color-input-wrapper">
            <input
              type="color"
              id="highlight-color-input"
              className="dropdown-color-picker"
              value={editor?.isActive('highlight') ? editor.getAttributes('highlight').color || '#FFFF00' : '#FFFF00'}
              onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
              data-testid="set-highlight"
              title="Color de Resaltado"
            />
            <button onClick={() => editor?.chain().focus().unsetHighlight().run()} className="menu-bar-button clear-color-button" title="Limpiar resaltado">
              <span className="icon">🚫</span>
            </button>
          </div>
        </div>
      </DropdownMenu>

      <DropdownMenu title="Estilo" editor={editor}>
        <button onClick={() => editor?.chain().focus().setParagraph().run()} className={editor?.isActive('paragraph') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Párrafo">
          <span className="icon">¶</span> Párrafo
        </button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={editor?.isActive('heading', { level: 1 }) ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Encabezado 1">
          <span className="icon">H₁</span> Encabezado 1
        </button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Encabezado 2">
          <span className="icon">H₂</span> Encabezado 2
        </button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={editor?.isActive('heading', { level: 3 }) ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Encabezado 3">
          <span className="icon">H₃</span> Encabezado 3
        </button>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Lista con viñetas">
          <span className="icon">●</span> Lista Viñetas
        </button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Lista numerada">
          <span className="icon">₁₂₃</span> Lista Numerada
        </button>
        <button onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={editor?.isActive('codeBlock') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Bloque de código">
          <span className="icon">{'{ }'}</span> Bloque Código
        </button>
        <button onClick={() => editor?.chain().focus().sinkListItem('listItem').run()} disabled={!editor?.can().sinkListItem('listItem')} title="Aumentar sangría"  className="menu-bar-button">
          <span className="icon">→</span> Aumentar Sangría
        </button>
        <button onClick={() => editor?.chain().focus().liftListItem('listItem').run()} disabled={!editor?.can().liftListItem('listItem')} title="Disminuir sangría" className="menu-bar-button">
          <span className="icon">←</span> Disminuir Sangría
        </button>
      </DropdownMenu>

      <DropdownMenu title="Insertar" editor={editor}>
        <button onClick={() => fileInputRef.current?.click()} title="Subir imagen desde el equipo" className="menu-bar-button">
          <span className="icon">📤</span> Subir Imagen
        </button>
        <button onClick={() => { const url = window.prompt('URL de la imagen'); if (url) editor?.chain().focus().setImage({ src: url }).run(); }} title="Insertar imagen por URL" className="menu-bar-button">
          <span className="icon">🖼️</span> Imagen por URL
        </button>
        <button onClick={insertVideo} title="Insertar video" className="menu-bar-button">
          <span className="icon">🎬</span> Video
        </button>
        <button onClick={() => { const url = window.prompt('URL'); if (url) editor?.chain().focus().toggleLink({ href: url }).run(); }} className={editor?.isActive('link') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Insertar enlace">
          <span className="icon">🔗</span> Enlace
        </button>
        <button onClick={() => { const url = window.prompt('Ingresa la URL SRC del iframe a embeber:'); if (url) { if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) { alert('URL inválida. Debe comenzar con http:// o https://'); return; } editor?.chain().focus().insertContent({ type: 'embedFrame', attrs: { src: url }, }).run(); } }} title="Embeber Iframe" className="menu-bar-button">
          <span className="icon">{'{...}'}</span> Embeber Iframe
        </button>
        <button onClick={() => { if (!editor) return; const { empty } = editor.state.selection; if (empty) { alert('Por favor, selecciona el texto que deseas citar.'); return; } const sourceText = window.prompt('Ingresa el texto fuente de la cita (ej: Autor, Año, Título):'); if (!sourceText) return; let citationId = citationData.current.sources.get(sourceText); if (!citationId) { citationId = String(citationData.current.nextId++); citationData.current.sources.set(sourceText, citationId); } editor.chain().focus().toggleMark('citation', { citationId, sourceText }).run(); }} className={editor?.isActive('citation') ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Añadir/Quitar Cita">
          <span className="icon">[1]</span> Cita
        </button>
      </DropdownMenu>

      <DropdownMenu title="Alinear" editor={editor}>
        <button onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={editor?.isActive({ textAlign: 'left' }) ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Alinear a la izquierda">
          <span className="icon">⟵</span> Izquierda
        </button>
        <button onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={editor?.isActive({ textAlign: 'center' }) ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Centrar">
          <span className="icon">⟷</span> Centro
        </button>
        <button onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={editor?.isActive({ textAlign: 'right' }) ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Alinear a la derecha">
          <span className="icon">⟶</span> Derecha
        </button>
        <button onClick={() => editor?.chain().focus().setTextAlign('justify').run()} className={editor?.isActive({ textAlign: 'justify' }) ? 'is-active menu-bar-button' : 'menu-bar-button'} title="Justificar">
          <span className="icon">☰</span> Justificar
        </button>
      </DropdownMenu>

      <DropdownMenu title="Tabla" editor={editor}>
        <button onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} disabled={!editor?.can().insertTable()} className="menu-bar-button" title="Insertar Tabla">
          <span className="icon">📄</span> Insertar Tabla
        </button>
        <hr className="dropdown-separator" />
        <button onClick={() => editor?.chain().focus().addRowBefore().run()} disabled={!editor?.can().addRowBefore()} className="menu-bar-button" title="Añadir Fila Antes">
          <span className="icon">⬆️</span> Añadir Fila Antes
        </button>
        <button onClick={() => editor?.chain().focus().addRowAfter().run()} disabled={!editor?.can().addRowAfter()} className="menu-bar-button" title="Añadir Fila Después">
          <span className="icon">⬇️</span> Añadir Fila Después
        </button>
        <button onClick={() => editor?.chain().focus().deleteRow().run()} disabled={!editor?.can().deleteRow()} className="menu-bar-button" title="Eliminar Fila">
          <span className="icon">🗑️</span> Eliminar Fila
        </button>
        <hr className="dropdown-separator" />
        <button onClick={() => editor?.chain().focus().addColumnBefore().run()} disabled={!editor?.can().addColumnBefore()} className="menu-bar-button" title="Añadir Columna Antes">
          <span className="icon">⬅️</span> Añadir Col. Antes
        </button>
        <button onClick={() => editor?.chain().focus().addColumnAfter().run()} disabled={!editor?.can().addColumnAfter()} className="menu-bar-button" title="Añadir Columna Después">
          <span className="icon">➡️</span> Añadir Col. Después
        </button>
        <button onClick={() => editor?.chain().focus().deleteColumn().run()} disabled={!editor?.can().deleteColumn()} className="menu-bar-button" title="Eliminar Columna">
          <span className="icon">🗑️</span> Eliminar Columna
        </button>
        <hr className="dropdown-separator" />
        <button onClick={() => editor?.chain().focus().mergeCells().run()} disabled={!editor?.can().mergeCells()} className="menu-bar-button" title="Combinar Celdas">
          <span className="icon">➕</span> Combinar Celdas
        </button>
        <button onClick={() => editor?.chain().focus().splitCell().run()} disabled={!editor?.can().splitCell()} className="menu-bar-button" title="Dividir Celda">
          <span className="icon">➖</span> Dividir Celda
        </button>
        <hr className="dropdown-separator" />
        <button onClick={() => editor?.chain().focus().toggleHeaderColumn().run()} disabled={!editor?.can().toggleHeaderColumn()} className="menu-bar-button" title="Cabecera de Columna">
          <span className="icon">🔝</span> Cabecera Columna
        </button>
        <button onClick={() => editor?.chain().focus().toggleHeaderRow().run()} disabled={!editor?.can().toggleHeaderRow()} className="menu-bar-button" title="Cabecera de Fila">
          <span className="icon">🔝</span> Cabecera Fila
        </button>
        <button onClick={() => editor?.chain().focus().toggleHeaderCell().run()} disabled={!editor?.can().toggleHeaderCell()} className="menu-bar-button" title="Cabecera de Celda">
          <span className="icon">🔝</span> Cabecera Celda
        </button>
        <hr className="dropdown-separator" />
        <button onClick={() => editor?.chain().focus().deleteTable().run()} disabled={!editor?.can().deleteTable()} className="menu-bar-button" title="Eliminar Tabla">
          <span className="icon">❌</span> Eliminar Tabla
        </button>
      </DropdownMenu>
      
      {/* History buttons can remain outside or in their own small group if preferred */}
      <div className="menu-section"> {/* Keeping history as a separate, always visible section */}
        <button onClick={() => editor?.chain().focus().undo().run()} title="Deshacer" className="menu-bar-button">
          <span className="icon">↩️</span>
        </button>
        <button onClick={() => editor?.chain().focus().redo().run()} title="Rehacer" className="menu-bar-button">
          <span className="icon">↪️</span>
        </button>
      </div>
    </div>
  )
}

interface SimpleEditorProps {
  content: any;
  onChange: (content: any) => void;
  initialContent?: any;
  onEditorReady?: (editor: any) => void; // Changed 'Editor' to 'any' to avoid import issues here, Tiptap Editor type
}

const SimpleEditor = ({ content, onChange, initialContent, onEditorReady }: SimpleEditorProps) => {
  const [isReady, setIsReady] = useState(false);
  const citationData = useRef<{ sources: Map<string, string>; nextId: number }>({
    sources: new Map(),
    nextId: 1,
  });
  
  // Usar useEffect para manejar la carga inicial del contenido desde la BD
  useEffect(() => {
    if (initialContent && !isReady) {
      setIsReady(true)
    }
  }, [initialContent, isReady])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Ensure headings have levels needed for ToC
        heading: {
          levels: [1, 2, 3, 4],
        },
        // Disable default text-align as we use a separate extension
        // textAlign: false, // This might be needed if StarterKit includes it by default
      }),
      FontFamily, // Added FontFamily
      TextStyle,  // Added TextStyle (super important, enables color, font family etc.)
      Color,      // Added Color
      Highlight.configure({ multicolor: true }), // Added Highlight with multicolor
      Placeholder.configure({
        placeholder: 'Escribe algo…',
      }),
      Underline, 
      Link.configure({
        openOnClick: false, 
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      // Use the imported custom image extension, configured with ResizableImageNodeView for the editor
      EditorCustomImageExtension.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ResizableImageNodeView);
        },
        // renderHTML logic is already in EditorCustomImageExtension, suitable for static output.
        // NodeView (ResizableImageNodeView) handles editor rendering.
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      VideoExtension, // Use the imported VideoExtension
      EmbedFrameExtension,
      CitationMark,
      GlobalDragHandle.configure({
        // Add any specific configurations here if needed
      }),
      AutoJoiner,
    ],
    content: initialContent || content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  // Call onEditorReady when editor is initialized
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
    // Optional: Cleanup if onEditorReady needs to be recalled if editor instance changes
    // return () => { if (editor) { /* editor.destroy() or similar if needed */ } }
  }, [editor, onEditorReady]);

  // Populate citation data from existing content when editor is created or content changes.
  useEffect(() => {
    if (editor && (content || initialContent)) {
      const newSources = new Map<string, string>();
      let maxId = 0;
      editor.state.doc.descendants((node, pos) => {
        node.marks.forEach(mark => {
          if (mark.type.name === 'citation') {
            const { citationId, sourceText } = mark.attrs;
            if (citationId && sourceText) {
              newSources.set(sourceText, citationId);
              const numericId = parseInt(citationId, 10);
              if (!isNaN(numericId) && numericId > maxId) {
                maxId = numericId;
              }
            }
          }
        });
      });
      citationData.current.sources = newSources;
      citationData.current.nextId = maxId + 1;
    }
  }, [editor, content, initialContent]);


  // Función para validar la estructura del contenido
  const isValidContent = (content: any): boolean => {
    try {
      if (!content) return false;
      
      // Si es un string, intentar parsearlo
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Verificar la estructura básica del documento
      return (
        parsedContent &&
        typeof parsedContent === 'object' &&
        parsedContent.type === 'doc' &&
        Array.isArray(parsedContent.content)
      );
    } catch (error) {
      console.error('Error validando contenido:', error);
      return false;
    }
  };

  // Función para crear un documento vacío
  const createEmptyDoc = () => ({
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: []
    }]
  });

  // Actualizar el contenido del editor cuando cambia externamente
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    
    try {
      // Si no hay contenido, establecer un documento vacío
      if (!content) {
        editor.commands.setContent(createEmptyDoc());
        return;
      }

      // Validar el contenido
      if (!isValidContent(content)) {
        console.error('Contenido inválido para el editor:', content);
        editor.commands.setContent(createEmptyDoc());
        return;
      }

      // Parsear el contenido si es necesario
      const contentToSet = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Solo actualizar si el contenido es diferente al actual
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(contentToSet);
      
      if (currentContent === newContent) return;
      
      // Intentar establecer el contenido con manejo de errores
      try {
        editor.commands.setContent(contentToSet, false);
      } catch (error) {
        console.error('Error al establecer el contenido:', error);
        // Intentar con un documento vacío en caso de error
        editor.commands.setContent(createEmptyDoc());
      }
    } catch (error) {
      console.error('Error al procesar el contenido:', error);
      // En caso de error, establecer un documento vacío
      if (!editor.isDestroyed) {
        editor.commands.setContent(createEmptyDoc());
      }
    }
  }, [editor, content])

  return (
    <div className="simple-editor" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MenuBar editor={editor} />
      {editor && (
        <>
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100, placement: 'top', appendTo: 'parent' }}
            className="image-bubble-menu"
            shouldShow={({ editor: currentEditor }) => currentEditor.isActive('image')}
          >
            <button
              onClick={() => editor.chain().focus().updateAttributes('image', { float: 'left' }).run()}
              className={editor.isActive('image', { float: 'left' }) ? 'is-active' : ''}
            >
              Izquierda
            </button>
            <button
              onClick={() => editor.chain().focus().updateAttributes('image', { float: 'right' }).run()}
              className={editor.isActive('image', { float: 'right' }) ? 'is-active' : ''}
            >
              Derecha
            </button>
            <button
              onClick={() => editor.chain().focus().updateAttributes('image', { float: 'none' }).run()}
              className={editor.isActive('image', { float: 'none' }) ? 'is-active' : ''}
            >
              Original
            </button>
             <button onClick={() => {
                const newAlt = window.prompt('Texto alternativo:', editor.getAttributes('image').alt || '');
                if (newAlt !== null) {
                  editor.chain().focus().updateAttributes('image', { alt: newAlt }).run();
                }
              }}>
              Alt
            </button>
            <button onClick={() => {
                const newWidth = window.prompt('Ancho (ej: 300px, 50%):', editor.getAttributes('image').width || '');
                 if (newWidth !== null) {
                  editor.chain().focus().updateAttributes('image', { width: newWidth }).run();
                }
            }}>
              Ancho
            </button>
          </BubbleMenu>

          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100, placement: 'bottom', appendTo: 'parent' }}
            className="text-bubble-menu"
            shouldShow={({ editor: currentEditor, view, state, from, to }) => {
              if (!currentEditor.isEditable) return false;
              if (currentEditor.isActive('image')) return false;
              const { empty } = view.state.selection;
              if (empty) return false;
              // Ensure the selection contains text or is not just an empty node
              let hasTextContent = false;
              currentEditor.state.doc.nodesBetween(from, to, (node) => {
                if (node.isText || (node.textContent && node.textContent.trim().length > 0)) {
                  hasTextContent = true;
                }
                return !hasTextContent; // stop iterating if text found
              });
              return hasTextContent;
            }}
          >
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Negrita">𝐁</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Cursiva">𝐼</button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Subrayado"><u>U</u></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Tachado">S̶</button>
            
            <span className="bubble-menu-separator"></span>

            <button onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'is-active' : ''} title="Párrafo">¶</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="H1">H₁</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="H2">H₂</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="H3">H₃</button>

            <span className="bubble-menu-separator"></span>

            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Viñetas">●</button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Lista Numerada">₁₂₃</button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Cita">❞</button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''} title="Bloque Código">{`</>`}</button>
            
            <span className="bubble-menu-separator"></span>
            
            <button 
              onClick={() => {
                const currentLink = editor.getAttributes('link').href;
                if (editor.isActive('link')) {
                  const url = window.prompt('Editar URL del enlace o dejar vacío para quitar:', currentLink || '');
                  if (url === null) return; // Cancelado
                  if (url === '') {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
                  }
                } else {
                  const url = window.prompt('Ingresar URL del enlace:');
                  if (url) {
                    editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
                  }
                }
              }}
              className={editor.isActive('link') ? 'is-active' : ''}
              title="Enlace"
            >
              🔗
            </button>
             <button onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} title="Quitar Enlace">
              Quitar 🔗
            </button>
          </BubbleMenu>
        </>
      )}
      <EditorContent editor={editor} style={{ flexGrow: 1, overflowY: 'auto' }}/>
    </div>
  )
}

export default SimpleEditor