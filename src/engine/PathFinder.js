/**
 * PathFinder.js - A* Pathfinding for Isometric Office Navigation
 */

export class PathFinder {
  constructor(tileMap) {
    this.tileMap = tileMap;
  }

  findPath(startX, startY, endX, endY) {
    const sX = Math.round(startX);
    const sY = Math.round(startY);
    let tX = Math.round(endX);
    let tY = Math.round(endY);

    // If destination is solid, find nearest walkable neighbor
    if (!this.tileMap.isWalkable(tX, tY)) {
      const neighbors = [
        { x: tX + 1, y: tY },
        { x: tX - 1, y: tY },
        { x: tX, y: tY + 1 },
        { x: tX, y: tY - 1 }
      ].filter(n => this.tileMap.isWalkable(n.x, n.y));

      if (neighbors.length > 0) {
        // Pick neighbor closest to start
        neighbors.sort((a, b) => {
          const distA = Math.hypot(a.x - sX, a.y - sY);
          const distB = Math.hypot(b.x - sX, b.y - sY);
          return distA - distB;
        });
        tX = neighbors[0].x;
        tY = neighbors[0].y;
      } else {
        return []; // No accessible path
      }
    }

    if (sX === tX && sY === tY) return [];

    const openList = [];
    const closedSet = new Set();

    const startNode = {
      x: sX,
      y: sY,
      g: 0,
      h: Math.abs(tX - sX) + Math.abs(tY - sY),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    const key = (x, y) => `${x},${y}`;

    while (openList.length > 0) {
      // Find lowest f node
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift();

      if (current.x === tX && current.y === tY) {
        // Reconstruct path
        const path = [];
        let curr = current;
        while (curr.parent) {
          path.unshift({ x: curr.x, y: curr.y });
          curr = curr.parent;
        }
        return path;
      }

      closedSet.add(key(current.x, current.y));

      // 4 Cardinal directions for isometric grid
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (!this.tileMap.isWalkable(nx, ny)) continue;
        if (closedSet.has(key(nx, ny))) continue;

        const gScore = current.g + 1;
        let neighbor = openList.find(n => n.x === nx && n.y === ny);

        if (!neighbor) {
          neighbor = {
            x: nx,
            y: ny,
            g: gScore,
            h: Math.abs(tX - nx) + Math.abs(tY - ny),
            f: 0,
            parent: current
          };
          neighbor.f = neighbor.g + neighbor.h;
          openList.push(neighbor);
        } else if (gScore < neighbor.g) {
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
        }
      }
    }

    return []; // No path found
  }
}
