import type { WebFlowEdge, WebFlowNode } from "@/lib/webflow/types";

export function autoLayoutNodes(
  nodes: WebFlowNode[],
  edges: WebFlowEdge[],
  direction: "LR" | "TB" = "LR",
): WebFlowNode[] {
  if (nodes.length === 0) return [];

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  // Calculate rank/depth of each node
  const rank = new Map<string, number>();
  const queue: string[] = [];

  nodes.forEach((n) => {
    if ((inDegree.get(n.id) || 0) === 0) {
      rank.set(n.id, 0);
      queue.push(n.id);
    }
  });

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currRank = rank.get(curr) || 0;
    const neighbors = adj.get(curr) || [];

    for (const neighbor of neighbors) {
      const nextRank = Math.max(rank.get(neighbor) || 0, currRank + 1);
      rank.set(neighbor, nextRank);
      const remainingIn = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, remainingIn);
      if (remainingIn <= 0) {
        queue.push(neighbor);
      }
    }
  }

  // Any unranked nodes (e.g. isolated or in cycle)
  nodes.forEach((n) => {
    if (!rank.has(n.id)) {
      rank.set(n.id, 0);
    }
  });

  // Group nodes by rank
  const rankGroups = new Map<number, string[]>();
  rank.forEach((r, id) => {
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(id);
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const layoutedNodes: WebFlowNode[] = [];

  const xSpacing = 320;
  const ySpacing = 180;
  const startX = 60;
  const startY = 100;

  rankGroups.forEach((nodeIds, r) => {
    nodeIds.forEach((id, index) => {
      const original = nodeMap.get(id);
      if (!original) return;

      if (direction === "LR") {
        layoutedNodes.push({
          ...original,
          position: {
            x: startX + r * xSpacing,
            y: startY + index * ySpacing,
          },
        });
      } else {
        layoutedNodes.push({
          ...original,
          position: {
            x: startX + index * xSpacing,
            y: startY + r * ySpacing,
          },
        });
      }
    });
  });

  return layoutedNodes;
}
