// lib/notes-graph-util.ts
export type TopicNode = {
  id: string;
  label: string;
  slug: string;
  url: string;
  children?: TopicNode[];
  content?: any;
  metadata?: {
    level: number;
    type: string;
  };
};

function robustParseContent(input: any): any {
  let value = input;
  let tries = 0;
  while (typeof value === "string" && tries < 3) {
    try {
      value = JSON.parse(value);
      tries++;
    } catch {
      break;
    }
  }
  return value;
}

export function pagesToTree(pages: Array<{
  id: number;
  title: string;
  slug: string;
  parent_id: number | null;
  level: number;
  content?: any;
}>): TopicNode[] {
  const nodes: { [key: number]: TopicNode & { parent_id: number | null } } = {};
  const roots: TopicNode[] = [];

  for (const page of pages) {
    nodes[page.id] = {
      id: String(page.id),
      label: page.title,
      slug: page.slug,
      url: `/pages-arbol/${page.slug}`,
      children: [],
      parent_id: page.parent_id,
      content: robustParseContent(page.content ?? null),
    };
  }

  for (const id in nodes) {
    const node = nodes[id];
    if (node.parent_id && nodes[node.parent_id]) {
      nodes[node.parent_id].children = nodes[node.parent_id].children || [];
      nodes[node.parent_id].children!.push(node);
    } else {
      roots.push(node);
    }
    (node as any).parent_id = undefined;
  }

  return roots;
}
