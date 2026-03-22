import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { LEVELS, type LevelConfig } from '../levels/LevelData';

const TILE_SIZE = 16;

const T = {
  EMPTY: -1,
  GROUND_TOP: 0,
  GROUND_FILL: 1,
  PLATFORM: 2,
  STONE: 3,
} as const;

type EditorTool =
  | 'platform' | 'wall' | 'gap' | 'erase'
  | 'orc' | 'boss' | 'checkpoint' | 'food' | 'essence'
  | 'player_spawn' | 'boss_arena_wall';

const ENTITY_TOOLS: EditorTool[] = [
  'orc', 'boss', 'checkpoint', 'food', 'essence', 'player_spawn', 'boss_arena_wall',
];

export class LevelEditorScene extends Phaser.Scene {
  private levelIndex: number = 0;
  private editableConfig!: LevelConfig;
  private tileData: number[][] = [];
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private entityMarkers!: Phaser.GameObjects.Group;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private cursorHighlight!: Phaser.GameObjects.Rectangle;
  private currentTool: EditorTool = 'platform';
  private isPainting: boolean = false;
  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private showGrid: boolean = true;
  private uiPanel: HTMLDivElement | null = null;
  private cursorInfoEl: HTMLDivElement | null = null;
  private zoomInfoEl: HTMLDivElement | null = null;
  private toolButtons: Map<EditorTool, HTMLButtonElement> = new Map();
  private lastCamScrollX: number = -1;
  private lastCamScrollY: number = -1;
  private lastCamZoom: number = -1;

  constructor() {
    super({ key: 'LevelEditorScene' });
  }

  create(): void {
    // Parse level from URL: ?editor or ?editor=2
    const params = new URLSearchParams(window.location.search);
    const editorParam = params.get('editor');
    const levelNum = editorParam && editorParam !== '' && editorParam !== 'true'
      ? parseInt(editorParam, 10)
      : 1;
    this.levelIndex = Math.max(0, Math.min(4, (isNaN(levelNum) ? 1 : levelNum) - 1));

    this.entityMarkers = this.add.group();

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setScrollFactor(0);
    this.gridGraphics.setDepth(50);

    this.cursorHighlight = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xffffff, 0.25);
    this.cursorHighlight.setScrollFactor(0);
    this.cursorHighlight.setDepth(51);
    this.cursorHighlight.setVisible(false);

    // Camera
    this.cameras.main.setZoom(0.5);
    this.cameras.main.setBackgroundColor('#020610');

    // Input — keyboard
    this.cursorKeys = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Zoom via scroll wheel
    this.input.on('wheel', (_ptr: unknown, _objs: unknown, _dx: number, deltaY: number) => {
      const cam = this.cameras.main;
      const delta = deltaY > 0 ? -0.05 : 0.05;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom + delta, 0.2, 2.0));
      this.drawGrid();
      this.updateCursorHighlight(this.input.activePointer);
    });

    // Mouse painting
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.isPainting = true;
      this.handlePointerAction(ptr);
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      this.updateCursorHighlight(ptr);
      this.updateCursorInfo(ptr);
      if (!this.isPainting) return;
      // Only tile tools (not entity tools) should paint on drag
      if (!ptr.rightButtonDown() && ENTITY_TOOLS.includes(this.currentTool)) return;
      this.handlePointerAction(ptr);
    });
    this.input.on('pointerup', () => { this.isPainting = false; });
    this.input.on('pointerupoutside', () => { this.isPainting = false; });

    // Global mouseup to reset painting if cursor leaves canvas
    window.addEventListener('mouseup', this._onWindowMouseUp = () => { this.isPainting = false; });

    // Load initial level
    this.loadLevel(this.levelIndex);

    // DOM panel
    this.createDomPanel();
  }

  private _onWindowMouseUp: (() => void) | null = null;

  // ─── Level Loading ──────────────────────────────────────────────────────────

  private loadLevel(index: number): void {
    this.levelIndex = index;

    // Deep copy level config
    this.editableConfig = JSON.parse(JSON.stringify(LEVELS[index])) as LevelConfig;

    // Destroy old tilemap
    if (this.map) {
      this.groundLayer?.destroy();
      this.map.destroy();
    }

    // Clear entity markers
    this.entityMarkers.clear(true, true);

    // Generate grid data and textures
    this.initTileData();
    this.generateTileTextures();
    this.buildTilemap();
    this.rebuildEntityMarkers();

    // Reset camera
    this.cameras.main.setScroll(0, 0);
    const mapW = this.editableConfig.mapWidthTiles * TILE_SIZE;
    const mapH = this.editableConfig.mapHeightTiles * TILE_SIZE;
    this.cameras.main.setBounds(-32, -32, mapW + 64, mapH + 64);

    // Sync level selector if panel exists
    const sel = this.uiPanel?.querySelector('#ed-level-select') as HTMLSelectElement | null;
    if (sel) sel.value = String(index);
  }

  private initTileData(): void {
    const cfg = this.editableConfig;
    const W = cfg.mapWidthTiles;
    const H = cfg.mapHeightTiles;

    this.tileData = Array.from({ length: H }, () => new Array(W).fill(T.EMPTY));

    const groundRow = H - 2;
    const fillRow = H - 1;

    const gapCols = new Set<number>();
    for (const gap of cfg.gaps) {
      for (let c = gap.start; c <= gap.end; c++) gapCols.add(c);
    }

    for (let col = 0; col < W; col++) {
      if (gapCols.has(col)) continue;
      this.tileData[groundRow][col] = T.GROUND_TOP;
      this.tileData[fillRow][col] = T.GROUND_FILL;
    }

    for (const p of cfg.platforms) {
      for (let i = 0; i < p.width; i++) {
        const col = p.x + i;
        if (col < W) this.tileData[p.y][col] = T.PLATFORM;
      }
    }

    for (const w of cfg.walls) {
      for (let row = w.yTop; row <= w.yBot; row++) {
        if (row < H) this.tileData[row][w.x] = T.STONE;
      }
    }
  }

  // ─── Tile Texture Generation ─────────────────────────────────────────────────

  private generateTileTextures(): void {
    const S = TILE_SIZE;
    const lv = this.editableConfig;
    const pfx = 'editor_tile_';
    const tsKey = 'editor_tileset';

    // Remove old textures
    for (const suffix of ['ground_top', 'ground_fill', 'platform', 'stone']) {
      if (this.textures.exists(pfx + suffix)) this.textures.remove(pfx + suffix);
    }
    if (this.textures.exists(tsKey)) this.textures.remove(tsKey);

    const makeTile = (suffix: string, drawFn: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.add.graphics();
      g.setVisible(false);
      drawFn(g);
      g.generateTexture(pfx + suffix, S, S);
      g.destroy();
    };

    makeTile('ground_top', (g) => {
      g.fillStyle(lv.groundColor, 1); g.fillRect(0, 0, S, S);
      g.fillStyle(lv.groundDetailColor, 1);
      g.fillRect(2, 6, 3, 2); g.fillRect(8, 10, 4, 2); g.fillRect(12, 5, 2, 3);
      g.fillStyle(lv.grassColor, 1); g.fillRect(0, 0, S, 3);
      g.fillStyle(lv.grassHighlightColor, 1);
      g.fillRect(1, 0, 3, 1); g.fillRect(6, 0, 4, 1); g.fillRect(12, 0, 2, 1);
      g.fillStyle(lv.grassColor, 1);
      g.fillRect(0, 3, 1, 2); g.fillRect(5, 3, 1, 1); g.fillRect(10, 3, 1, 2); g.fillRect(14, 3, 1, 1);
    });

    makeTile('ground_fill', (g) => {
      g.fillStyle(lv.groundColor, 1); g.fillRect(0, 0, S, S);
      g.fillStyle(lv.groundDetailColor, 1);
      g.fillRect(1, 2, 2, 2); g.fillRect(6, 7, 3, 2); g.fillRect(11, 1, 2, 3);
      g.fillRect(3, 11, 4, 2); g.fillRect(13, 10, 2, 2);
      const fleck = Phaser.Display.Color.IntegerToColor(lv.stoneColor).darken(20).color;
      g.fillStyle(fleck, 1); g.fillRect(4, 5, 2, 1); g.fillRect(10, 12, 2, 1);
    });

    makeTile('platform', (g) => {
      const base = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(30).color;
      const light = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(50).color;
      const top = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(60).color;
      const bot = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(10).color;
      g.fillStyle(base, 1); g.fillRect(0, 0, S, 6);
      g.fillStyle(light, 1); g.fillRect(1, 1, S - 2, 1); g.fillRect(2, 3, 4, 1); g.fillRect(9, 3, 4, 1);
      g.fillStyle(top, 1); g.fillRect(0, 0, S, 1);
      g.fillStyle(bot, 1); g.fillRect(0, 5, S, 1);
      g.fillStyle(lv.stoneColor, 1); g.fillRect(1, 2, 1, 1); g.fillRect(14, 2, 1, 1);
    });

    makeTile('stone', (g) => {
      g.fillStyle(lv.stoneColor, 1); g.fillRect(0, 0, S, S);
      const dark = Phaser.Display.Color.IntegerToColor(lv.stoneColor).darken(15).color;
      const light = Phaser.Display.Color.IntegerToColor(lv.stoneColor).lighten(15).color;
      const darker = Phaser.Display.Color.IntegerToColor(lv.stoneColor).darken(30).color;
      g.fillStyle(dark, 1); g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S); g.fillRect(2, 4, 5, 3); g.fillRect(9, 8, 4, 4);
      g.fillStyle(light, 1); g.fillRect(1, 1, 3, 2); g.fillRect(8, 2, 3, 2); g.fillRect(3, 10, 4, 2);
      g.fillStyle(darker, 1); g.fillRect(0, 7, S, 1); g.fillRect(7, 0, 1, 7); g.fillRect(5, 8, 1, S - 8);
    });

    // Combine into one 64×16 tileset texture
    const combined = this.add.renderTexture(0, 0, S * 4, S);
    combined.setVisible(false);
    combined.draw(pfx + 'ground_top', 0, 0);
    combined.draw(pfx + 'ground_fill', S, 0);
    combined.draw(pfx + 'platform', S * 2, 0);
    combined.draw(pfx + 'stone', S * 3, 0);
    combined.saveTexture(tsKey);
    combined.destroy();
  }

  // ─── Tilemap ─────────────────────────────────────────────────────────────────

  private buildTilemap(): void {
    this.map = this.make.tilemap({
      data: this.tileData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    const tileset = this.map.addTilesetImage('editor_tileset', undefined, TILE_SIZE, TILE_SIZE, 0, 0)!;
    this.groundLayer = this.map.createLayer(0, tileset, 0, 0)!;
    this.groundLayer.setDepth(0);

    this.drawGrid();
  }

  // ─── Entity Markers ──────────────────────────────────────────────────────────

  private rebuildEntityMarkers(): void {
    this.entityMarkers.clear(true, true);

    const cfg = this.editableConfig;
    const groundY = (cfg.mapHeightTiles - 2) * TILE_SIZE;
    const markerY = groundY - 6;
    const mapH = cfg.mapHeightTiles * TILE_SIZE;

    const addCircle = (x: number, color: number, radius: number) => {
      const c = this.add.arc(x, markerY, radius, 0, 360, false, color, 0.9);
      c.setDepth(10);
      this.entityMarkers.add(c);
    };

    for (const x of cfg.orcPositions) addCircle(x, 0xff3333, 4);
    for (const x of cfg.checkpointPositions) addCircle(x, 0xffdd00, 5);
    for (const x of cfg.foodPositions) addCircle(x, 0x44ff44, 3);
    for (const x of cfg.essencePositions) addCircle(x, 0x4488ff, 3);

    // Boss: orange X
    {
      const g = this.add.graphics().setDepth(10);
      g.lineStyle(2, 0xff6600, 1);
      g.lineBetween(cfg.bossX - 8, markerY - 8, cfg.bossX + 8, markerY + 8);
      g.lineBetween(cfg.bossX + 8, markerY - 8, cfg.bossX - 8, markerY + 8);
      this.entityMarkers.add(g);
    }

    // Player spawn: white triangle (arrow up)
    {
      const g = this.add.graphics().setDepth(10);
      g.fillStyle(0xffffff, 0.9);
      g.fillTriangle(
        cfg.playerSpawnX, markerY - 10,
        cfg.playerSpawnX - 5, markerY,
        cfg.playerSpawnX + 5, markerY,
      );
      this.entityMarkers.add(g);
    }

    // Boss arena wall: purple vertical line
    {
      const wallX = cfg.bossArenaWallCol * TILE_SIZE;
      const g = this.add.graphics().setDepth(10);
      g.lineStyle(1, 0xaa44ff, 0.7);
      g.lineBetween(wallX, 0, wallX, mapH);
      this.entityMarkers.add(g);
    }
  }

  // ─── Grid Drawing ────────────────────────────────────────────────────────────

  private drawGrid(): void {
    this.gridGraphics.clear();
    if (!this.showGrid || !this.editableConfig) return;

    const cam = this.cameras.main;
    const zoom = cam.zoom;
    const viewW = GAME_WIDTH / zoom;
    const viewH = GAME_HEIGHT / zoom;
    const W = this.editableConfig.mapWidthTiles;
    const H = this.editableConfig.mapHeightTiles;

    const c0 = Math.max(0, Math.floor(cam.scrollX / TILE_SIZE));
    const c1 = Math.min(W, Math.ceil((cam.scrollX + viewW) / TILE_SIZE) + 1);
    const r0 = Math.max(0, Math.floor(cam.scrollY / TILE_SIZE));
    const r1 = Math.min(H, Math.ceil((cam.scrollY + viewH) / TILE_SIZE) + 1);

    this.gridGraphics.lineStyle(1, 0xffffff, 0.12);

    for (let col = c0; col <= c1; col++) {
      const sx = (col * TILE_SIZE - cam.scrollX) * zoom;
      this.gridGraphics.lineBetween(sx, 0, sx, GAME_HEIGHT);
    }
    for (let row = r0; row <= r1; row++) {
      const sy = (row * TILE_SIZE - cam.scrollY) * zoom;
      this.gridGraphics.lineBetween(0, sy, GAME_WIDTH, sy);
    }

    // Map boundary highlight
    this.gridGraphics.lineStyle(1, 0x6688aa, 0.5);
    const right = (W * TILE_SIZE - cam.scrollX) * zoom;
    const bottom = (H * TILE_SIZE - cam.scrollY) * zoom;
    if (right > 0 && right < GAME_WIDTH) this.gridGraphics.lineBetween(right, 0, right, GAME_HEIGHT);
    if (bottom > 0 && bottom < GAME_HEIGHT) this.gridGraphics.lineBetween(0, bottom, GAME_WIDTH, bottom);
  }

  // ─── Input Handling ──────────────────────────────────────────────────────────

  private getTileAtPointer(ptr: Phaser.Input.Pointer): { col: number; row: number } {
    const cam = this.cameras.main;
    const worldX = cam.scrollX + ptr.x / cam.zoom;
    const worldY = cam.scrollY + ptr.y / cam.zoom;
    return { col: Math.floor(worldX / TILE_SIZE), row: Math.floor(worldY / TILE_SIZE) };
  }

  private handlePointerAction(ptr: Phaser.Input.Pointer): void {
    const { col, row } = this.getTileAtPointer(ptr);
    const cfg = this.editableConfig;
    const W = cfg.mapWidthTiles;
    const H = cfg.mapHeightTiles;

    if (ptr.rightButtonDown()) {
      // Right-click: erase tile, then try removing nearest entity
      if (col >= 0 && col < W && row >= 0 && row < H) {
        this.tileData[row][col] = T.EMPTY;
        this.groundLayer.putTileAt(-1, col, row);
      }
      const worldX = Math.round(this.cameras.main.scrollX + ptr.x / this.cameras.main.zoom);
      this.removeNearestEntity(worldX);
      return;
    }

    if (ENTITY_TOOLS.includes(this.currentTool)) {
      if (col >= 0 && col < W) {
        this.placeEntity(col * TILE_SIZE + TILE_SIZE / 2, this.currentTool);
      }
      return;
    }

    if (col < 0 || col >= W || row < 0 || row >= H) return;

    const groundRow = H - 2;
    const fillRow = H - 1;

    switch (this.currentTool) {
      case 'platform':
        // Don't place platforms on ground rows
        if (row < groundRow) {
          this.tileData[row][col] = T.PLATFORM;
          this.groundLayer.putTileAt(T.PLATFORM, col, row);
        }
        break;
      case 'wall':
        this.tileData[row][col] = T.STONE;
        this.groundLayer.putTileAt(T.STONE, col, row);
        break;
      case 'gap':
        // Only applies to ground rows
        if (row === groundRow || row === fillRow) {
          this.tileData[groundRow][col] = T.EMPTY;
          this.tileData[fillRow][col] = T.EMPTY;
          this.groundLayer.putTileAt(-1, col, groundRow);
          this.groundLayer.putTileAt(-1, col, fillRow);
        }
        break;
      case 'erase':
        this.tileData[row][col] = T.EMPTY;
        this.groundLayer.putTileAt(-1, col, row);
        break;
    }
  }

  private placeEntity(pixelX: number, tool: EditorTool): void {
    const cfg = this.editableConfig;
    switch (tool) {
      case 'orc': cfg.orcPositions.push(pixelX); break;
      case 'boss': cfg.bossX = pixelX; break;
      case 'checkpoint': cfg.checkpointPositions.push(pixelX); break;
      case 'food': cfg.foodPositions.push(pixelX); break;
      case 'essence': cfg.essencePositions.push(pixelX); break;
      case 'player_spawn': cfg.playerSpawnX = pixelX; break;
      case 'boss_arena_wall': cfg.bossArenaWallCol = Math.floor(pixelX / TILE_SIZE); break;
    }
    this.rebuildEntityMarkers();
  }

  private removeNearestEntity(worldX: number): void {
    const cfg = this.editableConfig;
    const THRESHOLD = TILE_SIZE * 2;

    const tryRemove = (arr: number[]): boolean => {
      const idx = arr.findIndex(x => Math.abs(x - worldX) < THRESHOLD);
      if (idx !== -1) { arr.splice(idx, 1); return true; }
      return false;
    };

    let changed = false;
    changed = changed || tryRemove(cfg.orcPositions);
    changed = changed || tryRemove(cfg.checkpointPositions);
    changed = changed || tryRemove(cfg.foodPositions);
    changed = changed || tryRemove(cfg.essencePositions);
    if (changed) this.rebuildEntityMarkers();
  }

  private updateCursorHighlight(ptr: Phaser.Input.Pointer): void {
    const { col, row } = this.getTileAtPointer(ptr);
    const cfg = this.editableConfig;
    if (!cfg) return;
    const cam = this.cameras.main;
    const zoom = cam.zoom;

    if (col >= 0 && col < cfg.mapWidthTiles && row >= 0 && row < cfg.mapHeightTiles) {
      const sx = (col * TILE_SIZE - cam.scrollX) * zoom;
      const sy = (row * TILE_SIZE - cam.scrollY) * zoom;
      const size = TILE_SIZE * zoom;
      this.cursorHighlight
        .setPosition(sx + size / 2, sy + size / 2)
        .setSize(size, size)
        .setVisible(true);
    } else {
      this.cursorHighlight.setVisible(false);
    }
  }

  private updateCursorInfo(ptr: Phaser.Input.Pointer): void {
    if (!this.cursorInfoEl) return;
    const { col, row } = this.getTileAtPointer(ptr);
    const worldX = Math.round(this.cameras.main.scrollX + ptr.x / this.cameras.main.zoom);
    const worldY = Math.round(this.cameras.main.scrollY + ptr.y / this.cameras.main.zoom);
    this.cursorInfoEl.textContent = `Tile: ${col},${row}   Px: ${worldX},${worldY}`;
  }

  // ─── Update Loop ─────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    const cam = this.cameras.main;
    const panSpeed = 200 / cam.zoom * (delta / 1000);

    const left = this.cursorKeys.left?.isDown || this.wasdKeys.A.isDown;
    const right = this.cursorKeys.right?.isDown || this.wasdKeys.D.isDown;
    const up = this.cursorKeys.up?.isDown || this.wasdKeys.W.isDown;
    const down = this.cursorKeys.down?.isDown || this.wasdKeys.S.isDown;

    if (left) cam.scrollX -= panSpeed;
    if (right) cam.scrollX += panSpeed;
    if (up) cam.scrollY -= panSpeed;
    if (down) cam.scrollY += panSpeed;

    if (
      cam.scrollX !== this.lastCamScrollX ||
      cam.scrollY !== this.lastCamScrollY ||
      cam.zoom !== this.lastCamZoom
    ) {
      this.drawGrid();
      this.updateCursorHighlight(this.input.activePointer);
      this.lastCamScrollX = cam.scrollX;
      this.lastCamScrollY = cam.scrollY;
      this.lastCamZoom = cam.zoom;
      if (this.zoomInfoEl) this.zoomInfoEl.textContent = `Zoom: ${cam.zoom.toFixed(2)}x`;
    }
  }

  // ─── DOM Panel ───────────────────────────────────────────────────────────────

  private createDomPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'level-editor-panel';
    panel.style.cssText = `
      position: fixed; right: 0; top: 0; width: 196px; height: 100vh;
      background: #0d1018; color: #ccc; font-family: monospace; font-size: 11px;
      padding: 8px; overflow-y: auto; z-index: 1000;
      border-left: 1px solid #2a3040; box-sizing: border-box;
      user-select: none;
    `;

    const levelOptions = LEVELS.map((l, i) =>
      `<option value="${i}" ${i === this.levelIndex ? 'selected' : ''}>${i + 1}. ${l.name}</option>`
    ).join('');

    const mapToolList: EditorTool[] = ['platform', 'wall', 'gap', 'erase'];
    const entityToolList: EditorTool[] = ['orc', 'checkpoint', 'food', 'essence', 'boss', 'player_spawn', 'boss_arena_wall'];

    const toolBtn = (t: EditorTool) =>
      `<button data-tool="${t}" style="padding:4px 2px;font-size:10px;cursor:pointer;
        background:#1a1d28;color:#ccc;border:1px solid #2a3040;border-radius:2px;
        text-transform:capitalize">${t.replace('_', ' ')}</button>`;

    panel.innerHTML = `
      <div style="font-size:13px;font-weight:bold;color:#cc5555;margin-bottom:8px">⚔ Level Editor</div>

      <div style="margin-bottom:8px">
        <div style="color:#666;margin-bottom:2px">Level</div>
        <select id="ed-level-select" style="width:100%;background:#1a1d28;color:#ccc;
          border:1px solid #2a3040;padding:3px;font-family:monospace;font-size:10px">
          ${levelOptions}
        </select>
      </div>

      <div style="color:#666;font-size:10px;margin-bottom:2px">Map Tools</div>
      <div id="ed-map-tools" style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:8px">
        ${mapToolList.map(toolBtn).join('')}
      </div>

      <div style="color:#666;font-size:10px;margin-bottom:2px">Entity Tools</div>
      <div id="ed-entity-tools" style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:8px">
        ${entityToolList.map(toolBtn).join('')}
      </div>

      <div style="border-top:1px solid #2a3040;padding-top:6px;margin-bottom:6px">
        <div id="ed-cursor-info" style="color:#888;font-size:10px;margin-bottom:3px">Tile: -,-  Px: -,-</div>
        <div id="ed-zoom-info" style="color:#888;font-size:10px;margin-bottom:3px">Zoom: 0.50x</div>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;color:#888;font-size:10px">
          <input type="checkbox" id="ed-grid-toggle" checked> Grid
        </label>
      </div>

      <div style="border-top:1px solid #2a3040;padding-top:6px;margin-bottom:6px">
        <button id="ed-export-btn" style="width:100%;padding:6px;background:#9b2020;color:#fff;
          border:none;cursor:pointer;font-family:monospace;font-size:11px;border-radius:2px;margin-bottom:4px">
          Copy Level Code
        </button>
        <div id="ed-export-status" style="color:#888;font-size:10px;min-height:14px"></div>
      </div>

      <div style="border-top:1px solid #2a3040;padding-top:6px;color:#555;font-size:9px;line-height:1.7">
        WASD / ← → ↑ ↓ pan<br>
        Scroll: zoom<br>
        LClick: place / drag paint<br>
        RClick: erase tile + entity
      </div>
    `;

    document.body.appendChild(panel);
    this.uiPanel = panel;

    // Element refs
    this.cursorInfoEl = panel.querySelector('#ed-cursor-info') as HTMLDivElement;
    this.zoomInfoEl = panel.querySelector('#ed-zoom-info') as HTMLDivElement;

    // Level selector
    const levelSelect = panel.querySelector('#ed-level-select') as HTMLSelectElement;
    levelSelect.addEventListener('change', () => {
      this.loadLevel(parseInt(levelSelect.value, 10));
    });

    // Tool buttons
    panel.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(btn => {
      const tool = btn.getAttribute('data-tool') as EditorTool;
      this.toolButtons.set(tool, btn);
      btn.addEventListener('click', () => this.setTool(tool));
    });
    this.setTool('platform'); // highlight default

    // Grid toggle
    const gridToggle = panel.querySelector('#ed-grid-toggle') as HTMLInputElement;
    gridToggle.addEventListener('change', () => {
      this.showGrid = gridToggle.checked;
      this.drawGrid();
    });

    // Export
    const exportBtn = panel.querySelector('#ed-export-btn') as HTMLButtonElement;
    const exportStatus = panel.querySelector('#ed-export-status') as HTMLDivElement;
    exportBtn.addEventListener('click', () => {
      const code = this.exportLevelCode();
      navigator.clipboard.writeText(code).then(() => {
        exportStatus.textContent = '✓ Copied!';
        exportStatus.style.color = '#44cc44';
        setTimeout(() => { exportStatus.textContent = ''; }, 3000);
      }).catch(() => {
        exportStatus.textContent = 'Failed — see console';
        exportStatus.style.color = '#ff6644';
        console.log('[LevelEditor] Level code:\n', code);
      });
    });
  }

  private setTool(tool: EditorTool): void {
    this.currentTool = tool;
    this.toolButtons.forEach((btn, t) => {
      btn.style.background = t === tool ? '#8b1c1c' : '#1a1d28';
      btn.style.color = t === tool ? '#fff' : '#ccc';
      btn.style.borderColor = t === tool ? '#cc3333' : '#2a3040';
    });
  }

  // ─── Export ──────────────────────────────────────────────────────────────────

  private exportLevelCode(): string {
    const cfg = this.editableConfig;
    const platforms = this.derivePlatforms();
    const walls = this.deriveWalls();
    const gaps = this.deriveGaps();

    const fmtArr = (arr: number[]) =>
      '[' + arr.slice().sort((a, b) => a - b).join(', ') + ']';

    const fmtObjArr = (arr: object[]) =>
      '[\n' + arr.map(o => '      ' + JSON.stringify(o)).join(',\n') + ',\n    ]';

    const hex = (n: number) => `0x${n.toString(16).padStart(6, '0')}`;

    return `  // Level ${this.levelIndex + 1}: ${cfg.name}
  {
    name: '${cfg.name}',
    mapWidthTiles: ${cfg.mapWidthTiles},
    mapHeightTiles: ${cfg.mapHeightTiles},
    platforms: ${fmtObjArr(platforms)},
    walls: ${fmtObjArr(walls)},
    gaps: ${fmtObjArr(gaps)},
    orcPositions: ${fmtArr(cfg.orcPositions)},
    bossX: ${cfg.bossX},
    bossArenaWallCol: ${cfg.bossArenaWallCol},
    checkpointPositions: ${fmtArr(cfg.checkpointPositions)},
    foodPositions: ${fmtArr(cfg.foodPositions)},
    essencePositions: ${fmtArr(cfg.essencePositions)},
    playerSpawnX: ${cfg.playerSpawnX},
    parallaxLayers: ${JSON.stringify(cfg.parallaxLayers, null, 6).replace(/\n/g, '\n    ')},
    tintColor: ${hex(cfg.tintColor)},
    tintAlpha: ${cfg.tintAlpha},
    darkTintColor: ${hex(cfg.darkTintColor)},
    darkTintAlpha: ${cfg.darkTintAlpha},
    groundColor: ${hex(cfg.groundColor)},
    groundDetailColor: ${hex(cfg.groundDetailColor)},
    grassColor: ${hex(cfg.grassColor)},
    grassHighlightColor: ${hex(cfg.grassHighlightColor)},
    stoneColor: ${hex(cfg.stoneColor)},
  }`;
  }

  private derivePlatforms(): { x: number; y: number; width: number }[] {
    const H = this.tileData.length;
    const W = this.tileData[0].length;
    const groundRow = H - 2;
    const result: { x: number; y: number; width: number }[] = [];

    for (let row = 0; row < groundRow; row++) {
      let col = 0;
      while (col < W) {
        if (this.tileData[row][col] === T.PLATFORM) {
          const start = col;
          while (col < W && this.tileData[row][col] === T.PLATFORM) col++;
          result.push({ x: start, y: row, width: col - start });
        } else {
          col++;
        }
      }
    }
    return result;
  }

  private deriveWalls(): { x: number; yTop: number; yBot: number }[] {
    const H = this.tileData.length;
    const W = this.tileData[0].length;
    const groundRow = H - 2;
    const result: { x: number; yTop: number; yBot: number }[] = [];

    for (let col = 0; col < W; col++) {
      let row = 0;
      while (row < groundRow) {
        if (this.tileData[row][col] === T.STONE) {
          const start = row;
          while (row < groundRow && this.tileData[row][col] === T.STONE) row++;
          result.push({ x: col, yTop: start, yBot: row - 1 });
        } else {
          row++;
        }
      }
    }
    return result;
  }

  private deriveGaps(): { start: number; end: number }[] {
    const H = this.tileData.length;
    const W = this.tileData[0].length;
    const groundRow = H - 2;
    const result: { start: number; end: number }[] = [];

    let col = 0;
    while (col < W) {
      if (this.tileData[groundRow][col] !== T.GROUND_TOP) {
        const start = col;
        while (col < W && this.tileData[groundRow][col] !== T.GROUND_TOP) col++;
        result.push({ start, end: col - 1 });
      } else {
        col++;
      }
    }
    return result;
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  shutdown(): void {
    if (this.uiPanel) {
      this.uiPanel.remove();
      this.uiPanel = null;
    }
    if (this._onWindowMouseUp) {
      window.removeEventListener('mouseup', this._onWindowMouseUp);
      this._onWindowMouseUp = null;
    }
  }
}
