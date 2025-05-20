import React, { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Node, NodeViewWrapper } from '@tiptap/react'

// Estilos para el editor
import './SimpleEditor.css'

// Componente para insertar videos embebidos
const VideoComponent = (props: any) => {
  return (
    <NodeViewWrapper className="video-wrapper">
      <div className="video-container">
        <iframe
          src={props.node.attrs.src}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </NodeViewWrapper>
  )
}

// Extensión personalizada para videos embebidos
const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-type="video"]',
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'video', ...HTMLAttributes }]
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoComponent)
  },
})

const MenuBar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      // Procesar URL para obtener el formato embebido correcto
      let embedUrl = url
      
      // Convertir URL de YouTube a formato embebido
      if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
        const videoId = url.includes('youtube.com/watch') 
          ? new URL(url).searchParams.get('v')
          : url.split('/').pop()
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`
        }
      }
      // Convertir URL de Vimeo a formato embebido
      else if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop()
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`
        }
      }
      
      editor.chain().focus().insertContent({
        type: 'video',
        attrs: { src: embedUrl }
      }).run()
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
      <div className="menu-section">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Negrita"
        >
          <span className="icon">B</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Cursiva"
        >
          <span className="icon">I</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="Tachado"
        >
          <span className="icon">S</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'is-active' : ''}
          title="Código"
        >
          <span className="icon">{'</>'}</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={editor.isActive('subscript') ? 'is-active' : ''}
          title="Subíndice"
        >
          <span className="icon">ₓ</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={editor.isActive('superscript') ? 'is-active' : ''}
          title="Superíndice"
        >
          <span className="icon">ˣ</span>
        </button>
      </div>

      <div className="menu-section">
        <button onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Limpiar formato">
          <span className="icon">Clear</span>
        </button>
        <button onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'is-active' : ''}
          title="Párrafo"
        >
          <span className="icon">P</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Encabezado 1"
        >
          <span className="icon">H1</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Encabezado 2"
        >
          <span className="icon">H2</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          title="Encabezado 3"
        >
          <span className="icon">H3</span>
        </button>
      </div>

      <div className="menu-section">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Lista con viñetas"
        >
          <span className="icon">•</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Lista numerada"
        >
          <span className="icon">1.</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="Bloque de código"
        >
          <span className="icon">{'{ }'}</span>
        </button>
      </div>

      <div className="menu-section">
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Subir imagen desde el equipo"
        >
          <span className="icon">📤</span>
        </button>
        <button
          onClick={() => {
            const url = window.prompt('URL de la imagen')
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }}
          title="Insertar imagen por URL"
        >
          <span className="icon">🖼️</span>
        </button>
        <button
          onClick={insertVideo}
          title="Insertar video"
        >
          <span className="icon">🎬</span>
        </button>
        <button
          onClick={() => {
            const url = window.prompt('URL')
            if (url) {
              editor.chain().focus().toggleLink({ href: url }).run()
            }
          }}
          className={editor.isActive('link') ? 'is-active' : ''}
          title="Insertar enlace"
        >
          <span className="icon">🔗</span>
        </button>
      </div>

      <div className="menu-section">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
          title="Alinear a la izquierda"
        >
          <span className="icon">⟵</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
          title="Centrar"
        >
          <span className="icon">⟷</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
          title="Alinear a la derecha"
        >
          <span className="icon">⟶</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
          title="Justificar"
        >
          <span className="icon">☰</span>
        </button>
      </div>

      <div className="menu-section">
        <button onClick={() => editor.chain().focus().undo().run()} title="Deshacer">
          <span className="icon">↩️</span>
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
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
}

const SimpleEditor = ({ content, onChange, initialContent }: SimpleEditorProps) => {
  const [isReady, setIsReady] = useState(false)
  
  // Usar useEffect para manejar la carga inicial del contenido desde la BD
  useEffect(() => {
    if (initialContent && !isReady) {
      setIsReady(true)
    }
  }, [initialContent, isReady])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Escribe algo…',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        allowBase64: true,
        inline: true,
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
      VideoExtension,
    ],
    content: initialContent || content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  // Actualizar el contenido del editor cuando cambia externamente
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      // Solo actualizar si el contenido es diferente al actual
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(content)
      
      if (currentContent !== newContent) {
        editor.commands.setContent(content, false)
      }
    }
  }, [editor, content])

  return (
    <div className="simple-editor">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default SimpleEditor