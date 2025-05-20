// lib/tiptap-extensions/BlockInsertHandle.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, Selection } from '@tiptap/pm/state';
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';

const BlockInsertHandlePluginKey = new PluginKey('blockInsertHandle');

export const BlockInsertHandle = Extension.create({
  name: 'blockInsertHandle',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: BlockInsertHandlePluginKey,
        state: {
          init() { return { decorationSet: DecorationSet.empty }; },
          apply(tr, value, oldState, newState) {
            // Only recalculate decorations if the document or selection changed
            // or if the set is missing (initial state)
            if (!tr.docChanged && !tr.selectionSet && value.decorationSet) {
                // If only selection changed, map existing decorations
                return {
                    decorationSet: value.decorationSet.map(tr.mapping, tr.doc)
                };
            }

            const decorations: Decoration[] = [];
            const { doc } = newState;

            doc.forEach((node: Node, pos: number) => {
              // Logic to decide where to put the handle
              // Rule: Show handle ONLY *after* block nodes that are direct children of the main doc.
              // Avoid showing after inline content or within complex nodes like table cells.

              // Consider only top-level block nodes
              const $pos = doc.resolve(pos);
              if ($pos.parent.type.name === 'doc' && node.isBlock) {
                // Calculate the position *after* the current block node
                const handlePos = pos + node.nodeSize;

                // Create the DOM element for the handle
                const handle = document.createElement('button');
                handle.className = 'block-insert-handle'; // Add CSS class
                handle.innerHTML = '+'; // Use innerHTML for content if needed, or textContent
                handle.title = 'Insert paragraph below';
                handle.type = 'button'; // Prevent form submission if inside a form
                handle.setAttribute('data-handle-pos', String(handlePos));

                // Create a widget decoration
                const deco = Decoration.widget(handlePos, handle, {
                  side: 1, // Place it relative to the position (positive means after)
                  key: `block-insert-${pos}`, // Unique key
                });
                decorations.push(deco);
              }
            });

            return {
              decorationSet: DecorationSet.create(doc, decorations),
            };
          },
        },
        props: {
          decorations(state) {
            // Get decorations from the plugin state
            const pluginState = BlockInsertHandlePluginKey.getState(state);
            return pluginState?.decorationSet;
          },
          handleDOMEvents: {
            mousedown: (view: EditorView, event: Event): boolean => {
              const target = event.target as HTMLElement;

              if (target?.classList.contains('block-insert-handle')) {
                event.preventDefault();
                event.stopPropagation();

                const insertAttr = target.getAttribute('data-handle-pos');
                const insertPos = insertAttr ? parseInt(insertAttr, 10) : null;

                if (insertPos === null || isNaN(insertPos)) {
                    console.error("BlockInsertHandle: Could not determine insertion position from handle.");
                    return true; // Event handled (failed)
                }

                const currentState = view.state;
                const currentSchema = currentState.schema;

                // Check if position is valid in the *current* document state
                if (insertPos > currentState.doc.content.size) {
                    console.error("BlockInsertHandle: Insertion position out of bounds.");
                    return true; // Event handled (failed)
                }

                const newNode = currentSchema.nodes.paragraph.createAndFill();
                if (!newNode) return true; // Should not happen with paragraph

                let transaction = currentState.tr.insert(insertPos, newNode);

                // Set selection inside the new paragraph
                const selectionPos = insertPos + 1;
                if (selectionPos <= transaction.doc.content.size) {
                     // Resolve position in the *updated* document (after insert)
                    const resolvedPos = transaction.doc.resolve(selectionPos);
                    transaction = transaction.setSelection(Selection.near(resolvedPos, 1)); // Use Selection.near for better positioning
                }

                view.dispatch(transaction);
                view.focus();
                return true; // Indicate that the event was handled
              }
              return false; // Event not handled by this plugin
            },
          },
        },
      }),
    ];
  },
});

export default BlockInsertHandle;
