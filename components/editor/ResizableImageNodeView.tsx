import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import styles from './ResizableImageNodeView.module.css';

export const ResizableImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [originalPos, setOriginalPos] = useState({ x: 0, y: 0 });
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState(1);

  const { src, alt, title, width, height } = node.attrs;

  // Load initial size from attributes or natural image size
  useEffect(() => {
    if (imgRef.current) {
      if (width && height) {
        setOriginalSize({ width, height });
        setAspectRatio(width / height);
      } else {
        // If no width/height, try to get natural dimensions once loaded
        const handleLoad = () => {
          if (imgRef.current) {
            const naturalWidth = imgRef.current.naturalWidth;
            const naturalHeight = imgRef.current.naturalHeight;
            if (naturalWidth && naturalHeight) {
              setOriginalSize({ width: naturalWidth, height: naturalHeight });
              setAspectRatio(naturalWidth / naturalHeight);
              // Optionally update attributes if they were missing
              // updateAttributes({ width: naturalWidth, height: naturalHeight });
            }
          }
        };
        imgRef.current.addEventListener('load', handleLoad);
        // If already loaded (e.g. cached)
        if (imgRef.current.complete && imgRef.current.naturalWidth) {
            handleLoad();
        }
        return () => {
          imgRef.current?.removeEventListener('load', handleLoad);
        };
      }
    }
  }, [src, width, height]); // Rerun if src changes or attributes are externally updated

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent editor selection while resizing
    setIsResizing(true);
    setOriginalPos({ x: event.clientX, y: event.clientY });
    
    // Ensure originalSize is set from the current rendered size if possible
    if (imgRef.current) {
        const currentWidth = imgRef.current.offsetWidth;
        const currentHeight = imgRef.current.offsetHeight;
        setOriginalSize({ width: currentWidth, height: currentHeight });
        if (currentHeight && currentWidth / currentHeight > 0) { // Avoid division by zero
            setAspectRatio(currentWidth / currentHeight);
        } else if (imgRef.current.naturalWidth && imgRef.current.naturalHeight) {
            setAspectRatio(imgRef.current.naturalWidth / imgRef.current.naturalHeight);
        }
    }
    
    editor.commands.setNodeSelection(editor.state.selection.from); // Keep node selected
  }, [editor]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing || !imgRef.current || !aspectRatio) return;
      event.preventDefault();

      const dx = event.clientX - originalPos.x;
      // For inline images, primarily width based resize makes more sense
      let newWidth = originalSize.width + dx;
      
      // Clamp minimum size
      if (newWidth < 50) newWidth = 50; 

      const newHeight = Math.round(newWidth / aspectRatio);

      imgRef.current.style.width = `${newWidth}px`;
      imgRef.current.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      if (!isResizing || !imgRef.current) return;
      setIsResizing(false);
      
      const finalWidth = parseInt(imgRef.current.style.width, 10);
      const finalHeight = parseInt(imgRef.current.style.height, 10);

      if (!isNaN(finalWidth) && !isNaN(finalHeight)) {
          updateAttributes({ width: finalWidth, height: finalHeight });
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, originalPos, originalSize, aspectRatio, updateAttributes]);

  // Determine display dimensions
  const displayWidth = width ? `${width}px` : 'auto';
  const displayHeight = height ? `${height}px` : 'auto';

  // Get float attribute
  const floatValue = node.attrs.float || 'none';

  // Base style for NodeViewWrapper
  const wrapperStyle: React.CSSProperties = {
    display: 'inline-block', // Crucial for inline images to have size & handles
    position: 'relative',    // For positioning resize handle
    lineHeight: '0',         // To prevent extra space below the image if it's inline
    border: editor.isEditable && (editor.state.selection as any).node === node ? '2px solid blue' : 'none',
    userSelect: 'none',      // Prevent text selection during resize
    // Apply float styles
    float: floatValue as 'left' | 'right' | 'none', // Cast to expected type
  };

  if (floatValue === 'left') {
    wrapperStyle.marginRight = '1em';
    wrapperStyle.marginBottom = '0.5em';
  } else if (floatValue === 'right') {
    wrapperStyle.marginLeft = '1em';
    wrapperStyle.marginBottom = '0.5em';
  }
  // If floatValue is 'none', no additional margins are needed beyond what float:none implies.

  return (
    <NodeViewWrapper 
        as="span" // Important for inline behavior
        style={wrapperStyle}
        draggable="true" // Tiptap's default image is draggable
        data-drag-handle // Tiptap's default image is draggable
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        style={{ 
            width: displayWidth, 
            height: displayHeight,
            // cursor: 'default', // Default cursor for image itself - moved to CSS module
        }}
        className={`${styles.resizableImage} ${editor.isEditable ? 'tiptap-resizable-image' : ''}`} // Added module class, kept tiptap global class for now
      />
      {editor.isEditable && (
        <div
          role="button"
          aria-label="Resize image"
          tabIndex={0}
          onMouseDown={handleMouseDown}
          className={styles.resizeHandle} // Use class from CSS module
          style={{ // Keep dynamic opacity style
            opacity: isResizing || ((editor.state.selection as any).node === node) ? 1 : 0.3,
          }}
        />
      )}
    </NodeViewWrapper>
  );
};

export default ResizableImageNodeView;
