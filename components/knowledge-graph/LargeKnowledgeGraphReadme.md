# LargeKnowledgeGraph Component

This React component uses `react-force-graph-2d` to render a knowledge graph with at least 1,000 topics and subtopics connected by random links. It is optimized for performance and responsiveness.

## Features
- Canvas rendering for high performance with large graphs
- Responsive sizing
- Node hover and click interaction (zoom to node)
- Color-coding by group

## Usage
1. Install the dependency:
   ```bash
   npm install react-force-graph
   ```
2. Import and use the component:
   ```tsx
   import LargeKnowledgeGraph from "../components/LargeKnowledgeGraph";
   <LargeKnowledgeGraph />
   ```

You can replace the mock data generator with your own topic/subtopic data for production use.
