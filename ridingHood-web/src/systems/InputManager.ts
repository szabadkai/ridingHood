import Phaser from 'phaser';

/**
 * Unified input manager that reads keyboard + gamepad and exposes
 * simple action queries (justPressed / isDown) each frame.
 *
 * Keyboard layout:
 *   Move:      WASD  /  Arrow keys
 *   Jump:      Space  /  W  /  Up
 *   Attack:    J  /  X  /  Enter
 *   Dodge:     K  /  Z  /  Shift
 *   Transform: L  /  C
 *
 * Gamepad layout (Xbox naming):
 *   Move:      Left stick  /  D-pad
 *   Jump:      A  (button 0)
 *   Attack:    X  (button 2)
 *   Dodge:     B  (button 1)
 *   Transform: Y  (button 3)
 */

export class InputManager {
  private scene: Phaser.Scene;

  // Keyboard keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private kW!: Phaser.Input.Keyboard.Key;
  private kA!: Phaser.Input.Keyboard.Key;
  private kD!: Phaser.Input.Keyboard.Key;
  private kJ!: Phaser.Input.Keyboard.Key;
  private kK!: Phaser.Input.Keyboard.Key;
  private kL!: Phaser.Input.Keyboard.Key;
  private kX!: Phaser.Input.Keyboard.Key;
  private kZ!: Phaser.Input.Keyboard.Key;
  private kC!: Phaser.Input.Keyboard.Key;
  private kEnter!: Phaser.Input.Keyboard.Key;
  private kShift!: Phaser.Input.Keyboard.Key;

  // Gamepad edge-detection — track previous frame state
  private prevPadButtons: boolean[] = [];
  private padConnected: boolean = false;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

  // Dead-zone for analog sticks
  private static readonly DEADZONE = 0.3;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.kW = kb.addKey('W');
    this.kA = kb.addKey('A');
    this.kD = kb.addKey('D');
    this.kJ = kb.addKey('J');
    this.kK = kb.addKey('K');
    this.kL = kb.addKey('L');
    this.kX = kb.addKey('X');
    this.kZ = kb.addKey('Z');
    this.kC = kb.addKey('C');
    this.kEnter = kb.addKey('ENTER');
    this.kShift = kb.addKey('SHIFT');

    // Gamepad: connect on first input
    if (scene.input.gamepad) {
      scene.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad;
        this.padConnected = true;
        this.prevPadButtons = new Array(pad.buttons.length).fill(false);
      });
      // Check if already connected
      if (scene.input.gamepad.total > 0) {
        this.gamepad = scene.input.gamepad.pad1;
        if (this.gamepad) {
          this.padConnected = true;
          this.prevPadButtons = new Array(this.gamepad.buttons.length).fill(false);
        }
      }
    }
  }

  /** Call once at the END of each update to snapshot gamepad state for edge detection. */
  postUpdate(): void {
    if (!this.padConnected || !this.gamepad) return;
    for (let i = 0; i < this.gamepad.buttons.length; i++) {
      this.prevPadButtons[i] = this.gamepad.buttons[i].pressed;
    }
  }

  // ── Gamepad helpers ──

  private padButtonDown(index: number): boolean {
    if (!this.padConnected || !this.gamepad) return false;
    return this.gamepad.buttons[index]?.pressed ?? false;
  }

  private padButtonJustDown(index: number): boolean {
    if (!this.padConnected || !this.gamepad) return false;
    const now = this.gamepad.buttons[index]?.pressed ?? false;
    const prev = this.prevPadButtons[index] ?? false;
    return now && !prev;
  }

  private padButtonJustUp(index: number): boolean {
    if (!this.padConnected || !this.gamepad) return false;
    const now = this.gamepad.buttons[index]?.pressed ?? false;
    const prev = this.prevPadButtons[index] ?? false;
    return !now && prev;
  }

  private padAxisX(): number {
    if (!this.padConnected || !this.gamepad) return 0;
    const raw = this.gamepad.leftStick.x;
    return Math.abs(raw) > InputManager.DEADZONE ? raw : 0;
  }

  private padDpadX(): number {
    if (!this.padConnected || !this.gamepad) return 0;
    // D-pad: buttons 14 (left) and 15 (right)
    const left = this.gamepad.buttons[14]?.pressed ? -1 : 0;
    const right = this.gamepad.buttons[15]?.pressed ? 1 : 0;
    return left + right;
  }

  // ── Public action queries ──

  /** Horizontal movement axis: -1, 0, or +1 (with analog from gamepad) */
  getMoveX(): number {
    let x = 0;
    if (this.cursors.left?.isDown || this.kA.isDown) x -= 1;
    if (this.cursors.right?.isDown || this.kD.isDown) x += 1;

    // Gamepad overrides if non-zero
    const padStick = this.padAxisX();
    const padDpad = this.padDpadX();
    if (padStick !== 0) return Math.sign(padStick);
    if (padDpad !== 0) return padDpad;
    return x;
  }

  /** Jump just pressed (edge) */
  jumpJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
           Phaser.Input.Keyboard.JustDown(this.kW) ||
           Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
           this.padButtonJustDown(0); // A button
  }

  /** Jump just released (for variable jump height) */
  jumpJustReleased(): boolean {
    return Phaser.Input.Keyboard.JustUp(this.cursors.up!) ||
           Phaser.Input.Keyboard.JustUp(this.kW) ||
           Phaser.Input.Keyboard.JustUp(this.cursors.space!) ||
           this.padButtonJustUp(0);
  }

  /** Attack just pressed */
  attackJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.kJ) ||
           Phaser.Input.Keyboard.JustDown(this.kX) ||
           Phaser.Input.Keyboard.JustDown(this.kEnter) ||
           this.padButtonJustDown(2); // X button
  }

  /** Dodge/roll just pressed */
  dodgeJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.kK) ||
           Phaser.Input.Keyboard.JustDown(this.kZ) ||
           Phaser.Input.Keyboard.JustDown(this.kShift) ||
           this.padButtonJustDown(1); // B button
  }

  /** Transform button is currently held down */
  transformHeld(): boolean {
    return this.kL.isDown ||
           this.kC.isDown ||
           this.padButtonDown(3); // Y button
  }

  /** Transform button just pressed */
  transformJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.kL) ||
           Phaser.Input.Keyboard.JustDown(this.kC) ||
           this.padButtonJustDown(3); // Y button
  }

  /** Transform button just released */
  transformJustReleased(): boolean {
    return Phaser.Input.Keyboard.JustUp(this.kL) ||
           Phaser.Input.Keyboard.JustUp(this.kC) ||
           this.padButtonJustUp(3);
  }

  /** Whether a gamepad is connected (for showing correct button prompts) */
  hasGamepad(): boolean {
    return this.padConnected;
  }
}
