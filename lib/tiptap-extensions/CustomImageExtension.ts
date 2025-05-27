import Image from '@tiptap/extension-image';
import { PasteRule } from '@tiptap/core';

export const CustomImageExtension = Image.configure({
  allowBase64: true,
  inline: true, 
  HTMLAttributes: {
    class: 'tiptap-image',
  },
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.style.width || element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) return {};
          // Ensure width is a string, append 'px' if it's just a number
          const width = String(attributes.width);
          return { 
            width: /^\d+$/.test(width) ? `${width}px` : width 
          };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.style.height || element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) return {};
          // Ensure height is a string, append 'px' if it's just a number
          const height = String(attributes.height);
          return { 
            height: /^\d+$/.test(height) ? `${height}px` : height 
          };
        },
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        }
      },
      float: {
        default: 'none', // Values: 'none', 'left', 'right'
        parseHTML: element => (element.style.float as string) || 'none',
        renderHTML: attributes => {
          if (attributes.float === 'none' || !attributes.float) {
            return {};
          }
          // Apply float using the style attribute for static rendering
          return { style: `float: ${attributes.float};` };
        },
      },
    };
  },
  addPasteRules() {
    return [
      new PasteRule({
        find: /https?:\/\/\S+\.(?:png|jpe?g|gif|webp|bmp|svg|tiff|ico)\S*/g,
        handler: ({ state, range, match }) => {
          const url = match[0];
          const pastedText = state.doc.textBetween(range.from, range.to, " ");
          if (url.trim() === pastedText.trim()) {
            state.tr.replaceWith(range.from, range.to, this.type.create({ src: url }));
          }
        },
      }),
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const { width, height, float, style } = node.attrs;
    let currentStyle = '';

    // Initialize style string from existing style attribute if present
    if (typeof style === 'string' && style.trim() !== '') {
        currentStyle = style.endsWith(';') ? style : style + ';';
    }

    // Apply float
    if (float && float !== 'none') {
      currentStyle += `float: ${float};`;
    }

    // Prepare attributes for the img tag
    const attrs = { ...HTMLAttributes }; // HTMLAttributes already contains class: 'tiptap-image'

    // Apply width and height directly as attributes or via style.
    // Tiptap's default Image renderHTML uses direct attributes.
    // Let's ensure they are strings and add 'px' if they are purely numeric.
    if (width) {
        const widthStr = String(width);
        attrs.width = /^\d+$/.test(widthStr) ? `${widthStr}px` : widthStr;
    }
    if (height) {
        const heightStr = String(height);
        attrs.height = /^\d+$/.test(heightStr) ? `${heightStr}px` : heightStr;
    }
    
    // If there are styles to apply, add them to the attrs
    if (currentStyle.trim() !== '') {
      attrs.style = currentStyle.trim();
    }

    return ['img', attrs];
  }
});

export default CustomImageExtension;
