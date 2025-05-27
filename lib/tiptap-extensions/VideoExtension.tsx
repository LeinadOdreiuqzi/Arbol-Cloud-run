import { Node, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { PasteRule } from '@tiptap/core'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import React from 'react'

// Helper function to convert video URLs to embeddable format
export function getVideoEmbedUrl(url: string): string | null {
  let embedUrl = url;
  if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else {
      return null; // Not a valid YouTube URL for embedding
    }
  } else if (url.includes('vimeo.com')) {
    const videoIdMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (videoId) {
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    } else {
      return null; // Not a valid Vimeo URL for embedding
    }
  } else {
    return null; // Not a YouTube or Vimeo URL
  }
  return embedUrl;
}

// Componente para insertar videos embebidos
interface VideoAttributes {
  src: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

const VideoComponent = ({ node }: { node: ProseMirrorNode }) => {
  return (
    <NodeViewWrapper className="video-wrapper">
      <div className="video-container">
        <iframe
          src={node.attrs.src as string}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Embedded video"
        />
      </div>
    </NodeViewWrapper>
  );
};

// Extensión personalizada para videos embebidos
export const VideoExtension = Node.create({
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
        tag: 'iframe[src*="youtube.com"], iframe[src*="vimeo.com"]', // For parsing existing iframes if any
      },
      {
        tag: 'div[data-type="video"] iframe', // For custom representation if already wrapped
      },
      {
        tag: 'div[data-type="video"]', // For custom representation
        getAttrs: (dom: HTMLElement) => {
            const iframe = dom.querySelector('iframe');
            return { src: iframe?.getAttribute('src') };
        }
      }
    ]
  },
  renderHTML({ HTMLAttributes }) {
    // Return an iframe for semantic HTML. This is what RichTextRenderer will use.
    return ['div', {'data-type': 'video', class: 'video-wrapper'}, ['iframe', { ...HTMLAttributes, frameBorder: 0, allowFullScreen: '', allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" }]];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoComponent)
  },
  addPasteRules() {
    return [
      new PasteRule({
        find: /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)\S+/g,
        handler: ({ state, range, match }) => {
          const url = match[0];
          const embedUrl = getVideoEmbedUrl(url);

          if (embedUrl) {
            const { tr } = state;
            const node = state.schema.nodes.video.create({ src: embedUrl });
            tr.replaceWith(range.from, range.to, node);
          }
        },
      }),
    ]
  },
})
