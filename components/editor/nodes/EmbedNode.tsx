import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

interface EmbedFrameAttributes {
  src: string | null;
  width?: string;
  height?: string;
  frameborder?: string;
  allowfullscreen?: boolean;
  allow?: string;
}

// 1. React Component for the NodeView
const EmbedFrameComponent = (props: any) => {
  const { src, width, height, frameborder, allowfullscreen, allow } = props.node.attrs as EmbedFrameAttributes;

  return (
    <NodeViewWrapper className="embed-frame-wrapper">
      <iframe
        src={src || undefined}
        width={width || '100%'} // Default width
        height={height || '450px'} // Default height
        frameBorder={frameborder || "0"}
        allowFullScreen={allowfullscreen !== undefined ? allowfullscreen : true}
        allow={allow || "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"}
        title="Embed Content"
        style={{ display: 'block', border: '1px solid #ccc', borderRadius: '4px' }}
      ></iframe>
    </NodeViewWrapper>
  );
};

// 2. Tiptap Node Extension
export const EmbedFrameExtension = Node.create<EmbedFrameAttributes>({
  name: 'embedFrame',
  group: 'block',
  atom: true, // True if it's a single, indivisible block

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => ({ src: attributes.src }),
      },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => ({ width: attributes.width }),
      },
      height: {
        default: '450px',
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => ({ height: attributes.height }),
      },
      frameborder: {
        default: '0',
        parseHTML: element => element.getAttribute('frameborder'),
        renderHTML: attributes => ({ frameborder: attributes.frameborder }),
      },
      allowfullscreen: {
        default: true,
        parseHTML: element => element.getAttribute('allowfullscreen') !== null,
        renderHTML: attributes => (attributes.allowfullscreen ? { allowfullscreen: '' } : {}),
      },
      allow: {
        default: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        parseHTML: element => element.getAttribute('allow'),
        renderHTML: attributes => ({ allow: attributes.allow }),
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-type="embed-frame"]', // More specific tag to match
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return {
            src: element.getAttribute('src'),
            width: element.getAttribute('width'),
            height: element.getAttribute('height'),
            frameborder: element.getAttribute('frameborder'),
            allowfullscreen: element.getAttribute('allowfullscreen') !== null,
            allow: element.getAttribute('allow'),
          };
        }
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // HTMLAttributes already contains 'src' due to addAttributes configuration
    return ['iframe', mergeAttributes(HTMLAttributes, { 'data-type': 'embed-frame' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedFrameComponent);
  },
});

export default EmbedFrameExtension;
