/**
 * TileMap.js - Partitioned Corporate Office Layout
 * Features distinct partitioned rooms:
 * - Ruang Direktur / CEO Suite
 * - Ruang Manager / PM Private Office
 * - Ruang Rapat / Boardroom
 * - Central Hallway / Koridor Utama
 * - Engineering Bullpen with Cubicles (Bob & Chloe)
 * - Ruang Server / Datacenter (Dave)
 * - Pantry, Breakroom & Coffee Lounge
 */

import { MAP_COLS, MAP_ROWS, TILE_TYPES, OBJ_TYPES } from '../utils/constants.js';

export class TileMap {
  constructor() {
    this.cols = MAP_COLS;
    this.rows = MAP_ROWS;
    this.tiles = [];
    this.partitions = []; // Glass & interior partitions
    this.objects = [];
    this.collisionGrid = [];
    this.conduitPath = [];

    this.initMap();
    this.initConduits();
  }

  initMap() {
    // 1. Initialize Base Flooring Grid
    for (let y = 0; y < this.rows; y++) {
      this.tiles[y] = [];
      this.collisionGrid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        // Outer boundaries
        if (y === 0) {
          this.tiles[y][x] = TILE_TYPES.WINDOW_SKYLINE;
          this.collisionGrid[y][x] = 1;
        } else if (x === 0) {
          this.tiles[y][x] = TILE_TYPES.WALL_WEST;
          this.collisionGrid[y][x] = 1;
        } else if (x <= 6 && y <= 6) {
          // 1. Ruang Direktur (Executive Carpet)
          this.tiles[y][x] = TILE_TYPES.FLOOR_CARPET_EXECUTIVE;
          this.collisionGrid[y][x] = 0;
        } else if (x >= 7 && x <= 12 && y <= 6) {
          // 2. Ruang Manager (Warm Walnut)
          this.tiles[y][x] = TILE_TYPES.FLOOR_WOOD;
          this.collisionGrid[y][x] = 0;
        } else if (x >= 13 && y <= 6) {
          // 3. Ruang Rapat / Boardroom (Slate Carpet)
          this.tiles[y][x] = TILE_TYPES.FLOOR_CARPET_BOARDROOM;
          this.collisionGrid[y][x] = 0;
        } else if (y >= 7 && y <= 9) {
          // 4. Koridor Utama (Central Hallway)
          this.tiles[y][x] = TILE_TYPES.FLOOR_WOOD;
          this.collisionGrid[y][x] = 0;
        } else if (x <= 7 && y >= 10) {
          // 5. Pantry & Lounge (Cafe Tiles)
          this.tiles[y][x] = TILE_TYPES.FLOOR_PANTRY;
          this.collisionGrid[y][x] = 0;
        } else if (x >= 15 && y >= 10) {
          // 6. Ruang Server Datacenter (Anti-static Cyber Floor)
          this.tiles[y][x] = TILE_TYPES.FLOOR_SERVER;
          this.collisionGrid[y][x] = 0;
        } else {
          // 7. Dev & QA Bullpen (Corporate Slate)
          this.tiles[y][x] = TILE_TYPES.FLOOR_DARK;
          this.collisionGrid[y][x] = 0;
        }
      }
    }

    // 2. Add Interior Partitions & Skat Ruangan
    this.partitions = [
      // --- Skat Kaca Ruang Direktur (East wall x=6, Y=1..6) ---
      { x: 6, y: 1, type: 'v_glass', label: null },
      { x: 6, y: 2, type: 'v_glass', label: null },
      { x: 6, y: 3, type: 'v_glass', label: null },
      { x: 6, y: 4, type: 'door', label: '👑 RUANG DIREKTUR' }, // Doorway
      { x: 6, y: 5, type: 'v_glass', label: null },
      { x: 6, y: 6, type: 'corner', label: null },

      // --- Skat Kaca Ruang Direktur (South wall Y=6, X=1..5) ---
      { x: 1, y: 6, type: 'h_glass', label: null },
      { x: 2, y: 6, type: 'h_glass', label: null },
      { x: 3, y: 6, type: 'door', label: null }, // Secondary entrance
      { x: 4, y: 6, type: 'h_glass', label: null },
      { x: 5, y: 6, type: 'h_glass', label: null },

      // --- Skat Kaca Ruang Manager (South wall Y=6, X=7..12) ---
      { x: 7, y: 6, type: 'h_glass', label: null },
      { x: 8, y: 6, type: 'h_glass', label: null },
      { x: 9, y: 6, type: 'h_glass', label: null },
      { x: 10, y: 6, type: 'door', label: '👔 RUANG MANAGER' }, // Doorway
      { x: 11, y: 6, type: 'h_glass', label: null },
      { x: 12, y: 6, type: 'corner', label: null },

      // --- Skat Kaca Ruang Manager vs Boardroom (X=12, Y=1..5) ---
      { x: 12, y: 1, type: 'v_glass', label: null },
      { x: 12, y: 2, type: 'v_glass', label: null },
      { x: 12, y: 3, type: 'v_glass', label: null },
      { x: 12, y: 4, type: 'v_glass', label: null },
      { x: 12, y: 5, type: 'v_glass', label: null },

      // --- Skat Kaca Boardroom (South wall Y=6, X=13..19) ---
      { x: 13, y: 6, type: 'h_glass', label: null },
      { x: 14, y: 6, type: 'door', label: '📊 BOARDROOM' }, // Doorway
      { x: 15, y: 6, type: 'h_glass', label: null },
      { x: 16, y: 6, type: 'h_glass', label: null },
      { x: 17, y: 6, type: 'h_glass', label: null },
      { x: 18, y: 6, type: 'h_glass', label: null },

      // --- Skat Pantry vs Koridor (Y=10, X=1..7) ---
      { x: 1, y: 10, type: 'h_wall', label: null },
      { x: 2, y: 10, type: 'h_wall', label: null },
      { x: 3, y: 10, type: 'h_wall', label: null },
      { x: 4, y: 10, type: 'door', label: '☕ PANTRY & LOUNGE' }, // Archway
      { x: 5, y: 10, type: 'door', label: null },
      { x: 6, y: 10, type: 'h_wall', label: null },
      { x: 7, y: 10, type: 'corner', label: null },

      // --- Skat Pantry vs Dev Bullpen (X=7, Y=11..19) ---
      { x: 7, y: 11, type: 'v_wall', label: null },
      { x: 7, y: 12, type: 'v_wall', label: null },
      { x: 7, y: 13, type: 'v_wall', label: null },
      { x: 7, y: 14, type: 'door', label: null }, // Passage
      { x: 7, y: 15, type: 'v_wall', label: null },
      { x: 7, y: 16, type: 'v_wall', label: null },
      { x: 7, y: 17, type: 'v_wall', label: null },
      { x: 7, y: 18, type: 'v_wall', label: null },

      // --- Skat Server Room (X=15, Y=10..19) ---
      { x: 15, y: 10, type: 'corner', label: null },
      { x: 15, y: 11, type: 'door', label: '🔒 DATACENTER' }, // Security Door
      { x: 15, y: 12, type: 'v_glass', label: null },
      { x: 15, y: 13, type: 'v_glass', label: null },
      { x: 15, y: 14, type: 'v_glass', label: null },
      { x: 15, y: 15, type: 'v_glass', label: null },
      { x: 15, y: 16, type: 'v_glass', label: null },
      { x: 15, y: 17, type: 'v_glass', label: null },
      { x: 15, y: 18, type: 'v_glass', label: null }
    ];

    // Register solid partitions into collision grid
    for (const p of this.partitions) {
      if (p.type !== 'door') {
        this.collisionGrid[p.y][p.x] = 1;
      }
    }

    // 3. Add Furniture in Their Respective Partitioned Rooms
    this.objects = [
      // === RUANG DIREKTUR / CEO SUITE ===
      { id: 'desk_ceo', type: OBJ_TYPES.DESK_CEO, x: 3, y: 3, label: 'Arthur (CEO / Bos)', solid: true, interactive: true },
      { id: 'sofa_ceo', type: OBJ_TYPES.SOFA_EXECUTIVE, x: 2, y: 5, label: 'Sofa Eksekutif Direktur', solid: true, interactive: true },
      { id: 'bookshelf_ceo', type: OBJ_TYPES.BOOKSHELF_EXECUTIVE, x: 1, y: 2, label: 'Rak Buku Dokumen Perusahaan', solid: true, interactive: true },
      { id: 'plant_ceo', type: OBJ_TYPES.PLANT, x: 1, y: 1, solid: true },

      // === RUANG MANAGER (ALICE) ===
      { id: 'desk_manager', type: OBJ_TYPES.DESK_MANAGER, x: 9, y: 3, label: 'Alice (Engineering Manager)', solid: true, interactive: true },
      { id: 'whiteboard_manager', type: OBJ_TYPES.WHITEBOARD, x: 8, y: 1, label: 'Sprint Planning Board', solid: true, interactive: true },
      { id: 'plant_manager', type: OBJ_TYPES.PLANT, x: 11, y: 1, solid: true },

      // === RUANG RAPAT / BOARDROOM ===
      { id: 'meeting_table', type: OBJ_TYPES.MEETING_TABLE, x: 16, y: 3, label: 'Meja Rapat Konferensi', solid: true, interactive: true },
      { id: 'plant_boardroom', type: OBJ_TYPES.PLANT, x: 18, y: 1, solid: true },

      // === ENGINEERING BULLPEN & CUBICLES ===
      // Bob's Dev Cubicle (with partition screens)
      { id: 'desk_dev', type: OBJ_TYPES.DESK_DEV_CUBICLE, x: 9, y: 13, label: 'Bob (Lead Dev Cubicle)', solid: true, interactive: true },
      // Chloe's QA Cubicle (with partition screens)
      { id: 'desk_qa', type: OBJ_TYPES.DESK_QA_CUBICLE, x: 13, y: 13, label: 'Chloe (Lead QA Cubicle)', solid: true, interactive: true },

      // === RUANG SERVER / DATACENTER (DAVE) ===
      { id: 'server_rack_1', type: OBJ_TYPES.SERVER_RACK, x: 18, y: 12, label: 'Kubernetes Cluster Alpha', solid: true, interactive: true },
      { id: 'server_rack_2', type: OBJ_TYPES.SERVER_RACK, x: 18, y: 15, label: 'Database Cluster Beta', solid: true, interactive: true },
      { id: 'desk_devops', type: OBJ_TYPES.DESK_MANAGER, x: 16, y: 14, label: 'Dave (DevOps Terminal)', solid: true, interactive: true },

      // === PANTRY & BREAKROOM ===
      { id: 'coffee_bar', type: OBJ_TYPES.COFFEE_BAR, x: 3, y: 16, label: 'Espresso Bar (Click to Brew)', solid: true, interactive: true },
      { id: 'water_cooler', type: OBJ_TYPES.WATER_COOLER, x: 1, y: 15, label: 'Water Dispenser', solid: true, interactive: true },
      { id: 'sofa_pantry', type: OBJ_TYPES.SOFA_PANTRY, x: 4, y: 12, label: 'Sofa Istirahat Karyawan', solid: true, interactive: true },
      { id: 'plant_pantry', type: OBJ_TYPES.PLANT, x: 1, y: 18, solid: true },

      // === DECORATIVE CORRIDOR GREENERY ===
      { id: 'plant_corridor_1', type: OBJ_TYPES.PLANT, x: 6, y: 8, solid: true },
      { id: 'plant_corridor_2', type: OBJ_TYPES.PLANT, x: 14, y: 8, solid: true }
    ];

    // Mark furniture as solid
    for (const obj of this.objects) {
      if (obj.solid && this.isInside(obj.x, obj.y)) {
        this.collisionGrid[obj.y][obj.x] = 1;
      }
    }
  }

  // Optical fiber conduits running from Dev Cubicle along hallway into Server Room
  initConduits() {
    this.conduitPath = [
      { x: 10, y: 13 },
      { x: 11, y: 13 },
      { x: 11, y: 12 },
      { x: 11, y: 11 },
      { x: 12, y: 11 },
      { x: 13, y: 11 },
      { x: 14, y: 11 },
      { x: 15, y: 11 }, // Passes through datacenter door
      { x: 16, y: 11 },
      { x: 17, y: 11 },
      { x: 17, y: 12 },
      { x: 18, y: 12 }
    ];
  }

  isInside(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  isWalkable(x, y) {
    if (!this.isInside(x, y)) return false;
    return this.collisionGrid[y][x] === 0;
  }

  getObjectAt(x, y) {
    return this.objects.find(o => o.x === Math.round(x) && o.y === Math.round(y));
  }
}
