// components/ImageNodeView.tsx
import React from 'react';
import { NodeViewWrapper, NodeViewProps, NodeViewContent } from '@tiptap/react';
import css from './ImageNodeView.module.css'; // We'll create this CSS file next

export const ImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, editor }) => {
  const { src, alt, title, width, height } = node.attrs;

  // Basic rendering for now - just the image
  // We will add resize handles, alignment controls, caption later

  return (
    <NodeViewWrapper className={css.imageWrapper} data-drag-handle> {/* data-drag-handle makes the whole wrapper draggable if needed */}
      <img
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        className={`${css.resizableImage} ${selected ? css.selected : ''}`}
      />
      {/* Placeholder for caption later */}
      {/* <NodeViewContent as="figcaption" /> */}
    </NodeViewWrapper>
  );
};

export default ImageNodeView;
