/**
 * Armament Studios & Armentero Studios
 * Killer Clown AI Engine (Grid & Line-of-Sight Chasing System)
 * 
 * Features:
 * - Line of Sight (LOS) detection across Horizontal, Vertical, and Proximity axes.
 * - Autonomous Grid-by-Grid pathfinding with Traffic & Obstacle Awareness.
 * - Adaptive Level Speed Scaling (Exponential Tier Speed Increase every 5 levels).
 * - Safe Zone Resting & Dynamic Water Log Respawning.
 */

export interface GridPosition {
  x: number;
  y: number;
  rowY: number;
}

export interface ObstacleEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'truck' | 'racecar' | 'log' | 'lilypad';
  speed: number;
}

export interface ClownState {
  x: number;
  y: number;
  width: number;
  height: number;
  rowY: number;
  active: boolean;
  restTimer: number;
  stepCooldown: number;
  teleportTimer: number;
}

export class KillerClownAI {
  private ROW_Y_POSITIONS: number[];

  constructor(rowPositions?: number[]) {
    this.ROW_Y_POSITIONS = rowPositions || [
      22,  // Row 0: Goal docks
      75,  // Row 1: River Lane 1
      105, // Row 2: River Lane 2
      135, // Row 3: River Lane 3
      165, // Row 4: River Lane 4
      195, // Row 5: Middle Safe Walkway
      225, // Row 6: Road Lane 1
      255, // Row 7: Road Lane 2
      285, // Row 8: Road Lane 3
      315, // Row 9: Road Lane 4
      345  // Row 10: Bottom Starting Grass
    ];
  }

  /**
   * Checks whether the target (Player) is within Line of Sight (Horizontal, Vertical, or Proximity)
   */
  public checkLineOfSight(clown: ClownState, playerX: number, playerRowY: number): {
    inLOS: boolean;
    isHorizontal: boolean;
    isVertical: boolean;
    isAdjacent: boolean;
  } {
    const isHorizontal = clown.rowY === playerRowY;
    const isVertical = Math.abs(clown.x - playerX) < 28;
    const isAdjacent = Math.abs(clown.rowY - playerRowY) <= 1 && Math.abs(clown.x - playerX) <= 40;

    return {
      inLOS: isHorizontal || isVertical || isAdjacent,
      isHorizontal,
      isVertical,
      isAdjacent
    };
  }

  /**
   * Checks whether a candidate tile or road cell is safe from immediate vehicle traffic collisions
   */
  public isTrafficSafe(targetX: number, targetRowY: number, obstacles: ObstacleEntity[]): boolean {
    if (targetRowY < 6 || targetRowY > 9) return true; // Not a road lane

    const targetY = this.ROW_Y_POSITIONS[targetRowY];
    const dangerVehicle = obstacles.some(obs => 
      (obs.type === 'car' || obs.type === 'truck' || obs.type === 'racecar') &&
      Math.abs(obs.y - targetY) < 18 &&
      targetX + 20 > obs.x - 15 &&
      targetX < obs.x + obs.width + 15
    );

    return !dangerVehicle;
  }

  /**
   * Calculates the next grid step for the Clown toward the target position while respecting water logs and traffic safety
   */
  public computeNextGridStep(
    clown: ClownState,
    playerX: number,
    playerRowY: number,
    obstacles: ObstacleEntity[],
    canvasWidth: number = 480
  ): { targetRow: number; targetX: number } | null {
    if (!clown.active) return null;

    const candidates: { row: number; x: number }[] = [
      { row: clown.rowY - 1, x: clown.x }, // Up
      { row: clown.rowY + 1, x: clown.x }, // Down
      { row: clown.rowY, x: clown.x - 30 }, // Left
      { row: clown.rowY, x: clown.x + 30 }  // Right
    ];

    const validCandidates = candidates.filter(c => {
      if (c.row < 0 || c.row > 10) return false;
      if (c.x < 10 || c.x > canvasWidth - 30) return false;

      // River rows (1 to 4): Must land on a log
      if (c.row >= 1 && c.row <= 4) {
        const targetY = this.ROW_Y_POSITIONS[c.row];
        return obstacles.some(obs =>
          (obs.type === 'log' || obs.type === 'lilypad') &&
          c.x + clown.width > obs.x &&
          c.x < obs.x + obs.width &&
          Math.abs(obs.y + 2 - targetY) < 18
        );
      }

      // Road rows (6 to 9): Prefer cells free of immediate oncoming cars
      if (c.row >= 6 && c.row <= 9) {
        return this.isTrafficSafe(c.x, c.row, obstacles);
      }

      return true;
    });

    if (validCandidates.length === 0) return null;

    // Pick candidate closest to player position
    const targetPlayerY = this.ROW_Y_POSITIONS[playerRowY];
    let best = validCandidates[0];
    let bestDist = Infinity;

    for (const cand of validCandidates) {
      const candY = this.ROW_Y_POSITIONS[cand.row];
      const distSq = Math.pow(cand.x - playerX, 2) + Math.pow(candY - targetPlayerY, 2);
      if (distSq < bestDist) {
        bestDist = distSq;
        best = cand;
      }
    }

    return { targetRow: best.row, targetX: best.x };
  }
}
