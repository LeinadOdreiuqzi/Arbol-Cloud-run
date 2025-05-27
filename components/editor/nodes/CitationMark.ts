import { Mark, mergeAttributes } from '@tiptap/core';

export interface CitationMarkAttributes {
  citationId: string;
  sourceText: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      /**
       * Set a citation mark
       */
      setCitation: (attributes: CitationMarkAttributes) => ReturnType;
      /**
       * Toggle a citation mark
       */
      toggleCitation: (attributes: CitationMarkAttributes) => ReturnType;
      /**
       * Unset a citation mark
       */
      unsetCitation: () => ReturnType;
    };
  }
}

export const CitationMark = Mark.create<CitationMarkAttributes>({
  name: 'citation',

  // Keep attributes in the HTML
  keepOnSplit: true, 
  // Inclusive false means that new text typed at the end of a mark won't get the mark.
  inclusive: false, 

  addAttributes() {
    return {
      citationId: {
        default: '',
        parseHTML: element => element.getAttribute('data-citation-id'),
        renderHTML: attributes => ({ 'data-citation-id': attributes.citationId }),
      },
      sourceText: {
        default: '',
        parseHTML: element => element.getAttribute('data-source-text'),
        renderHTML: attributes => ({ 'data-source-text': attributes.sourceText }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="citation"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false; // Should not happen with this tag selector
          const citationId = element.getAttribute('data-citation-id');
          const sourceText = element.getAttribute('data-source-text');
          if (!citationId || !sourceText) return false; // Do not parse if essential data is missing
          return { citationId, sourceText };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // HTMLAttributes already contains data-citation-id and data-source-text
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'citation', class: 'editor-citation' })];
  },

  addCommands() {
    return {
      setCitation: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleCitation: attributes => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetCitation: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

export default CitationMark;
