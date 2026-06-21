import { Shot } from "@/types/shot.type";
import {
  Participant,
  InitialServerConfig,
  DoublesPlayerKey,
} from "@/types/match.type";
import {
  flipDoublesRotationForNextGame,
  buildDoublesRotation,
  buildDoublesRotationForTeamMatch,
} from "@/services/match/serverCalculationService";

export interface ShotCommentary {
  // New enhanced fields
  zone: "short" | "mid" | "deep" | null;
  sector: "backhand" | "crossover" | "forehand" | null;
  line: "down the line" | "diagonal" | "cross court" | "middle line" | null;
  originZone: "close-to-table" | "mid-distance" | "far-distance" | null;
  // Legacy fields (for backward compatibility)
  direction: "down the line" | "across the table" | null;
  depth: "short ball" | "deep ball" | null;
  placement: "edge ball" | null;
  originDistance: "away from the table" | "close to the table" | "over the table" | null;
  netProximity: "close to the net" | null;
  centerPlacement: "down the middle" | null;
}

/* ---------------------------------------------------------
   Helper: Direction logic
   - "Down the line" = shot stays on the same side (left or right)
   - "Across the table" = shot crosses from one side to the other
   - Center line (net) is at X = 50
--------------------------------------------------------- */

function getShotDirection(originX: number, landingX: number): "down the line" | "across the table" {
  // Determine which side of the table each coordinate is on
  // Use <= 50 for left to handle exactly 50 as center (neutral)
  const originSide = originX <= 50 ? "left" : "right";
  const landingSide = landingX <= 50 ? "left" : "right";

  // If both are on the same side, it's down the line
  if (originSide === landingSide) {
    return "down the line";
  }

  // Otherwise, it's across the table
  return "across the table";
}

/* ---------------------------------------------------------
   Enhanced Analysis Functions
--------------------------------------------------------- */

/**
 * Calculate where the trajectory from origin to landing intersects the table boundary
 * Used when origin is off-table to determine effective origin sector/zone
 *
 * @param originX - Origin X coordinate (may be off-table: -50 to 150)
 * @param originY - Origin Y coordinate (may be off-table: -50 to 150)
 * @param landingX - Landing X coordinate (on-table: 0 to 100)
 * @param landingY - Landing Y coordinate (on-table: 0 to 100)
 * @returns Intersection point {x, y} on table boundary, or null if origin is on-table
 */
function calculateTableIntersection(
  originX: number,
  originY: number,
  landingX: number,
  landingY: number
): { x: number; y: number } | null {
  // Check if origin is already on table
  if (originX >= 0 && originX <= 100 && originY >= 0 && originY <= 100) {
    return null; // Origin is on-table, no intersection needed
  }

  // Line parametric equation: P(t) = origin + t * (landing - origin), t ∈ [0, 1]
  const dx = landingX - originX;
  const dy = landingY - originY;

  let minT = Infinity;
  let intersectionX = originX;
  let intersectionY = originY;

  // Check intersection with left edge (X = 0)
  if (originX < 0) {
    const t = (0 - originX) / dx;
    if (t >= 0 && t <= 1) {
      const y = originY + t * dy;
      if (y >= 0 && y <= 100 && t < minT) {
        minT = t;
        intersectionX = 0;
        intersectionY = y;
      }
    }
  }

  // Check intersection with right edge (X = 100)
  if (originX > 100) {
    const t = (100 - originX) / dx;
    if (t >= 0 && t <= 1) {
      const y = originY + t * dy;
      if (y >= 0 && y <= 100 && t < minT) {
        minT = t;
        intersectionX = 100;
        intersectionY = y;
      }
    }
  }

  // Check intersection with top edge (Y = 0)
  if (originY < 0) {
    const t = (0 - originY) / dy;
    if (t >= 0 && t <= 1) {
      const x = originX + t * dx;
      if (x >= 0 && x <= 100 && t < minT) {
        minT = t;
        intersectionX = x;
        intersectionY = 0;
      }
    }
  }

  // Check intersection with bottom edge (Y = 100)
  if (originY > 100) {
    const t = (100 - originY) / dy;
    if (t >= 0 && t <= 1) {
      const x = originX + t * dx;
      if (x >= 0 && x <= 100 && t < minT) {
        minT = t;
        intersectionX = x;
        intersectionY = 100;
      }
    }
  }

  // If no valid intersection found (shouldn't happen if landing is on-table), return origin
  if (minT === Infinity) {
    return { x: originX, y: originY };
  }

  return { x: intersectionX, y: intersectionY };
}

/**
 * Determine zone based on landing X coordinate (horizontal)
 * Zones: Deep (closest to player) | Mid | Short (closest to net)
 * Left side: Deep (0-16.67) | Mid (16.67-33.33) | Short (33.33-50)
 * Right side: Short (50-66.67) | Mid (66.67-83.33) | Deep (83.33-100)
 */
export function getZone(landingX: number, receivingSide?: "side1" | "side2"): "short" | "mid" | "deep" | null {
  // Determine which side of the table the ball landed on
  const isLeftSide = landingX <= 50;
  
  if (isLeftSide) {
    // Left side zones: Deep | Mid | Short (towards net)
    if (landingX < THRESHOLDS.ZONE_DEEP_LEFT) {
      return "deep";
    } else if (landingX < THRESHOLDS.ZONE_MID_LEFT) {
      return "mid";
    } else if (landingX < THRESHOLDS.ZONE_SHORT_LEFT) {
      return "short";
    } else {
      // Exactly at center line (x=50), consider it short (closest to net)
      return "short";
    }
  } else {
    // Right side zones: Short | Mid | Deep (away from net)
    if (landingX < THRESHOLDS.ZONE_SHORT_RIGHT) {
      return "short";
    } else if (landingX < THRESHOLDS.ZONE_MID_RIGHT) {
      return "mid";
    } else {
      return "deep";
    }
  }
}

/**
 * Determine sector based on landing Y coordinate (vertical)
 * Sectors: Backhand (top) | Crossover (middle) | Forehand (bottom)
 * Left side player: Backhand (y=0-33.33) | Crossover (y=33.33-66.67) | Forehand (y=66.67-100)
 * Right side player: Forehand (y=0-33.33) | Crossover (y=33.33-66.67) | Backhand (y=66.67-100)
 * 
 * @param landingY - Y coordinate where ball lands (0-100)
 * @param receivingSide - Which side the receiving player is on ("side1" or "side2")
 * @param isLeftHanded - Whether receiving player is left-handed (default: false)
 */
export function getSector(
  landingY: number,
  receivingSide?: "side1" | "side2",
  isLeftHanded: boolean = false
): "backhand" | "crossover" | "forehand" | null {
  // Determine sector based on Y coordinate
  let sector: "backhand" | "crossover" | "forehand";
  
  if (landingY < THRESHOLDS.SECTOR_BACKHAND) {
    sector = "backhand";
  } else if (landingY < THRESHOLDS.SECTOR_CROSSOVER) {
    sector = "crossover";
  } else {
    sector = "forehand";
  }
  
  // For right side player (side2), flip backhand/forehand
  // Right side: Forehand (top) | Crossover (middle) | Backhand (bottom)
  if (receivingSide === "side2") {
    if (sector === "backhand") {
      sector = "forehand";
    } else if (sector === "forehand") {
      sector = "backhand";
    }
  }
  
  // For left-handed players, reverse backhand/forehand
  if (isLeftHanded) {
    if (sector === "backhand") {
      sector = "forehand";
    } else if (sector === "forehand") {
      sector = "backhand";
    }
  }
  
  return sector;
}

/**
 * Determine line of play based on sector transitions from hitter to receiver
 *
 * Classification Rules (from receiver's perspective):
 * - Down the line: FH→BH, CrossOver→CrossOver, BH→FH (straight shots)
 * - Diagonal: (FH→FH OR BH→BH) AND both zones are deep (deep cross-court)
 * - Cross court: (FH→FH OR BH→BH) AND at least one zone is NOT deep
 * - Middle line: FH→CrossOver, BH→CrossOver (shots toward middle)
 *
 * Note: Sectors are automatically mirrored based on side (side1 vs side2)
 * Note: For off-table origins, intersection point is used for origin sector/zone
 *
 * @param originY - Y coordinate of origin (or intersection point if off-table)
 * @param landingY - Y coordinate where ball landed (0-100)
 * @param originSide - Which side the hitter is on ("side1" or "side2")
 * @param receivingSide - Which side the receiver is on ("side1" or "side2")
 * @param originZone - Zone at origin/intersection point ("short" | "mid" | "deep")
 * @param landingZone - Zone where ball landed ("short" | "mid" | "deep")
 * @param isLeftHanded - Whether players are left-handed (default: false)
 * @returns Line classification or null if coordinates are invalid
 */
function getLine(
  originY: number,
  landingY: number,
  originSide: "side1" | "side2",
  receivingSide: "side1" | "side2",
  originZone: "short" | "mid" | "deep" | null,
  landingZone: "short" | "mid" | "deep" | null,
  isLeftHanded: boolean = false
): "down the line" | "diagonal" | "cross court" | "middle line" | null {
  // Get origin sector (hitter's perspective)
  const originSector = getSector(originY, originSide, isLeftHanded);

  // Get landing sector (receiver's perspective)
  const landingSector = getSector(landingY, receivingSide, isLeftHanded);

  // Return null if either sector is invalid
  if (!originSector || !landingSector) {
    return null;
  }

  // Down the line: FH→BH, CrossOver→CrossOver, BH→FH
  if (
    (originSector === "forehand" && landingSector === "backhand") ||
    (originSector === "crossover" && landingSector === "crossover") ||
    (originSector === "backhand" && landingSector === "forehand")
  ) {
    return "down the line";
  }

  // Diagonal or Cross court: FH→FH, BH→BH (depends on zones)
  if (
    (originSector === "forehand" && landingSector === "forehand") ||
    (originSector === "backhand" && landingSector === "backhand")
  ) {
    // Check if both zones are "deep" for diagonal classification
    if (originZone === "deep" && landingZone === "deep") {
      return "diagonal";
    }
    // Otherwise it's regular cross court
    return "cross court";
  }

  // Middle line: FH→CrossOver, BH→CrossOver, or CrossOver→FH/BH
  return "middle line";
}

/**
 * Determine origin zone based on where shot was played from
 * Origin Zones: Close-to-Table, Mid-distance, Far-distance
 * These distances only apply when the player is hitting from OFF the table.
 * If the origin is ON the table, the player is already close-to-the-table by definition.
 */
function getOriginZone(originX: number, originY: number): "close-to-table" | "mid-distance" | "far-distance" | null {
  // Check if origin is on the table
  const isInsideTable = originX >= 0 && originX <= 100 && originY >= 0 && originY <= 100;
  
  if (isInsideTable) {
    // If on table, player is close-to-the-table by definition
    // Return null to indicate it's the default case (won't be mentioned in commentary)
    return null;
  }
  
  // If off table, calculate distance from table edge
  // Calculate the minimum distance from any table edge
  const distanceX = originX < 0 ? Math.abs(originX) : originX > 100 ? originX - 100 : 0;
  const distanceY = originY < 0 ? Math.abs(originY) : originY > 100 ? originY - 100 : 0;
  const distanceFromTable = Math.max(distanceX, distanceY);
  
  if (distanceFromTable < THRESHOLDS.ORIGIN_DISTANCE_CLOSE) {
    return "close-to-table";
  } else if (distanceFromTable < THRESHOLDS.ORIGIN_DISTANCE_MID) {
    return "mid-distance";
  } else {
    return "far-distance";
  }
}

/* ---------------------------------------------------------
   Main Analyzer
   Coordinate system:
   - Origin: -50 to 150 (player can hit from anywhere)
   - Landing: 0 to 100 (ball landed on table)
   - X: 0-50 = left side, 50-100 = right side
   - Y: 0 = near net (top), 100 = deep (back)
--------------------------------------------------------- */

// Threshold constants - single source of truth
const THRESHOLDS = {
  EDGE: 12,                    // Distance from table edge to be considered "edge ball"
  CENTER_LINE: 12,             // Distance from center line (X=50) to be considered "center"
  SHORT_BALL: 25,              // Y < 25 = short ball
  DEEP_BALL: 75,               // Y > 75 = deep ball
  CLOSE_TO_NET_Y: 50,          // Y < 50 = front half, considered "close to net" area
  ORIGIN_CLOSE_TO_TABLE: 26,   // Distance from table edge for "close to table" (70cm)
  // Zone thresholds (horizontal/X-based): Deep | Mid | Short on each side
  ZONE_DEEP_LEFT: 16.67,       // Left side: Deep zone (0-16.67)
  ZONE_MID_LEFT: 33.33,        // Left side: Mid zone (16.67-33.33)
  ZONE_SHORT_LEFT: 50,         // Left side: Short zone (33.33-50)
  ZONE_SHORT_RIGHT: 66.67,     // Right side: Short zone (50-66.67)
  ZONE_MID_RIGHT: 83.33,       // Right side: Mid zone (66.67-83.33)
  ZONE_DEEP_RIGHT: 100,        // Right side: Deep zone (83.33-100)
  // Sector thresholds (vertical/Y-based): Backhand | Crossover | Forehand
  SECTOR_BACKHAND: 33.33,      // Y < 33.33% = Backhand (for left side player)
  SECTOR_CROSSOVER: 66.67,     // Y 33.33-66.67% = Crossover
  SECTOR_FOREHAND: 66.67,      // Y > 66.67% = Forehand (for left side player)
  ORIGIN_CLOSE_Y: 33.33,       // originY < 33.33% = Close-to-Table
  ORIGIN_FAR_Y: 66.67,         // originY > 66.67% = Far-distance
  ORIGIN_DISTANCE_CLOSE: 26,   // Distance from table < 70cm (26 * 2.74 = 71.24cm)
  ORIGIN_DISTANCE_MID: 73,     // Distance from table 70cm-2m (73 * 2.74 = 200.02cm)
  LINE_ANGLE_THRESHOLD: 15,    // Angle threshold for middle line (degrees)
} as const;

export function analyzeShotPlacement(shot: Shot, receivingSide?: "side1" | "side2"): ShotCommentary {
  const { originX, originY, landingX, landingY, side } = shot;

  if (
    originX == null ||
    originY == null ||
    landingX == null ||
    landingY == null
  ) {
    return {
      zone: null,
      sector: null,
      line: null,
      originZone: null,
      direction: null,
      depth: null,
      placement: null,
      originDistance: null,
      netProximity: null,
      centerPlacement: null,
    };
  }

  const commentary: ShotCommentary = {
    // New enhanced fields
    zone: null,
    sector: null,
    line: null,
    originZone: null,
    // Legacy fields
    direction: null,
    depth: null,
    placement: null,
    originDistance: null,
    netProximity: null,
    centerPlacement: null,
  };

  // ============================================================
  // STEP 1: Calculate basic metrics (used throughout)
  // ============================================================
  const distanceFromCenterLine = Math.abs(landingX - 50);
  const isNearLeftEdge = landingX < THRESHOLDS.EDGE;
  const isNearRightEdge = landingX > 100 - THRESHOLDS.EDGE;
  const isNearTopEdge = landingY < THRESHOLDS.EDGE;
  const isNearBottomEdge = landingY > 100 - THRESHOLDS.EDGE;
  const isNearCenter = distanceFromCenterLine < THRESHOLDS.CENTER_LINE;
  const isInFrontHalf = landingY < THRESHOLDS.CLOSE_TO_NET_Y;

  // ============================================================
  // STEP 2: Enhanced Analysis (New terminology)
  // ============================================================
  // Zone (landing position - horizontal/X-based)
  // Determine receiving side: if shot is from side1, receiving side is side2, and vice versa
  // The ball lands on the receiving player's side
  const shotReceivingSide = receivingSide || (side === "side1" ? "side2" : "side1");
  commentary.zone = getZone(landingX, shotReceivingSide);
  
  // Sector (landing position - vertical/Y-based, relative to receiving player, default right-handed)
  commentary.sector = getSector(landingY, shotReceivingSide, false);
  
  // Line (shot trajectory based on sectors and zones)
  // Determine origin side (where the hitter is)
  const originSide = side;

  // Calculate intersection point if origin is off-table
  const intersection = calculateTableIntersection(originX, originY, landingX, landingY);

  // Use intersection point for origin sector/zone if off-table, otherwise use actual origin
  const effectiveOriginX = intersection ? intersection.x : originX;
  const effectiveOriginY = intersection ? intersection.y : originY;

  // Calculate origin zone using intersection point (if off-table) or actual origin
  const originZone = getZone(effectiveOriginX, originSide);

  // Get line classification
  commentary.line = getLine(
    effectiveOriginY,
    landingY,
    originSide,
    shotReceivingSide,
    originZone,
    commentary.zone, // Landing zone already calculated above
    false
  );
  
  // Origin Zone (where shot was played from)
  commentary.originZone = getOriginZone(originX, originY);

  // ============================================================
  // STEP 3: Direction (legacy - independent check)
  // ============================================================
  commentary.direction = getShotDirection(originX, landingX);

  // ============================================================
  // STEP 4: Net Proximity vs Center Placement (MUTUALLY EXCLUSIVE)
  // Priority: "close to the net" > "down the middle"
  // ============================================================
  if (isNearCenter && isInFrontHalf) {
    // Ball near center AND in front half = "close to the net"
    commentary.netProximity = "close to the net";
  } else if (isNearCenter && !isInFrontHalf) {
    // Ball near center BUT in back half = "down the middle"
    commentary.centerPlacement = "down the middle";
  }

  // ============================================================
  // STEP 5: Edge Detection (independent, but excludes top edge if close to net)
  // ============================================================
  const isCloseToNet = commentary.netProximity !== null;
  const isEdgeBall = 
    isNearLeftEdge || 
    isNearRightEdge || 
    isNearBottomEdge || 
    (isNearTopEdge && !isCloseToNet);
  
  if (isEdgeBall) {
    commentary.placement = "edge ball";
  }

  // ============================================================
  // STEP 6: Depth (legacy - only if not conflicting with edge placement)
  // ============================================================
  const isSideEdgeOnly = (isNearLeftEdge || isNearRightEdge) && !isNearTopEdge && !isNearBottomEdge;
  
  // Only set depth if it's not an edge ball, or if it's only a side edge
  if (!isEdgeBall || isSideEdgeOnly) {
    if (landingY < THRESHOLDS.SHORT_BALL) {
      commentary.depth = "short ball";
    } else if (landingY > THRESHOLDS.DEEP_BALL) {
      commentary.depth = "deep ball";
    }
  }
  
  // Safety check: prevent impossible combinations
  if (isNearBottomEdge && commentary.depth === "short ball") {
    commentary.depth = null;
  }
  if (isNearTopEdge && commentary.depth === "deep ball") {
    commentary.depth = null;
  }

  // ============================================================
  // STEP 7: Origin Distance (legacy - independent check)
  // ============================================================
  const isInsideTable =
    originX >= 0 && originX <= 100 && originY >= 0 && originY <= 100;

  if (isInsideTable) {
    commentary.originDistance = "over the table";
  } else {
    const distanceX = originX < 0 ? Math.abs(originX) : originX > 100 ? originX - 100 : 0;
    const distanceY = originY < 0 ? Math.abs(originY) : originY > 100 ? originY - 100 : 0;
    const distanceFromTable = Math.max(distanceX, distanceY);

    if (distanceFromTable < THRESHOLDS.ORIGIN_CLOSE_TO_TABLE) {
      commentary.originDistance = "close to the table";
    } else {
      commentary.originDistance = "away from the table";
    }
  }

  return commentary;
}

/* ---------------------------------------------------------
   Commentary Generation - Natural Sentence Flow
--------------------------------------------------------- */

export function generateShotCommentary(
  shot: Shot,
  playerName: string
): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);

  // Start with player and stroke
  let description = `${playerName} played a ${strokeName}`;

  // Build natural sentence flow:
  // 1. Origin position (where from) - only if relevant
  // 2. Direction (how the shot was played)
  // 3. Landing details (where to - depth, placement, net proximity)

  const phrases: string[] = [];

  // Add direction first (more natural flow)
  if (commentary.direction) {
    phrases.push(commentary.direction);
  }

  // Add origin position only if it's not "over the table" (default assumption)
  // This avoids redundant "from over the table" when it's obvious
  if (commentary.originDistance && commentary.originDistance !== "over the table") {
    phrases.push(`from ${commentary.originDistance}`);
  }

  // Build landing description
  const landingParts: string[] = [];
  
  if (commentary.depth) {
    landingParts.push(commentary.depth);
  }
  
  if (commentary.placement) {
    landingParts.push(commentary.placement);
  }
  
  if (commentary.centerPlacement) {
    landingParts.push(commentary.centerPlacement);
  }
  
  if (commentary.netProximity) {
    landingParts.push(commentary.netProximity);
  }

  if (landingParts.length > 0) {
    phrases.push(`landing ${landingParts.join(", ")}`);
  }

  // Combine phrases naturally with commas
  if (phrases.length > 0) {
    description += ", " + phrases.join(", ") + ".";
  } else {
    description += ".";
  }

  return description;
}

export function generateShortCommentary(shot: Shot): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);

  // Build natural sentence for short commentary
  // Format: [Shot type] played [origin distance], [line], into [zone] zone
  // Note: Sectors are omitted - they're for analytics, not commentary
  const parts: string[] = [];

  // Start with stroke
  parts.push(strokeName);

  // Add origin distance if not close-to-table (default assumption)
  if (commentary.originZone && commentary.originZone !== "close-to-table") {
    const originText = commentary.originZone.replace("-", " ");
    if (originText === "far distance") {
      parts.push("played far from the table");
    } else if (originText === "mid distance") {
      parts.push("played from mid distance");
    } else {
      parts.push(`played ${originText}`);
    }
  } else if (commentary.originDistance && commentary.originDistance !== "over the table") {
    parts.push(`played ${commentary.originDistance}`);
  }

  // Add line (trajectory)
  if (commentary.line) {
    parts.push(commentary.line);
  }

  // Add landing zone (sectors omitted - they're for analytics, not commentary)
  if (commentary.zone) {
    parts.push(`into ${commentary.zone} zone`);
  }

  // Join with commas and add period at the end
  return parts.join(", ") + ".";
}

/**
 * Helper function to get server information from shot
 */
function getServerInfo(shot: Shot, participants?: Participant[]): { name: string; id: string | null } | null {
  if (!shot.server) return null;
  
  const serverId = typeof shot.server === 'string' ? shot.server : shot.server._id?.toString() || null;
  if (!serverId) return null;
  
  // If participants provided, find the server
  if (participants && participants.length > 0) {
    const server = participants.find(p => {
      const pid = typeof p === 'string' ? p : p._id?.toString();
      return pid === serverId;
    });
    
    if (server) {
      const serverObj = typeof server === 'string' ? null : server;
      return {
        name: serverObj?.fullName || serverObj?.username || "Unknown",
        id: serverId
      };
    }
  }
  
  // Fallback: try to get from shot.server directly
  const serverObj = typeof shot.server === 'string' ? null : shot.server;
  if (serverObj) {
    return {
      name: serverObj.fullName || serverObj.username || "Unknown",
      id: serverId
    };
  }
  
  return null;
}

/**
 * Helper function to map rotation key to participant index
 * Rotation keys: "side1_main" -> 0, "side1_partner" -> 1, "side2_main" -> 2, "side2_partner" -> 3
 * Or: "team1_main" -> 0, "team1_partner" -> 1, "team2_main" -> 2, "team2_partner" -> 3
 */
function getParticipantIndexFromRotationKey(rotationKey: string): number {
  if (rotationKey.includes("main")) {
    if (rotationKey.startsWith("side1") || rotationKey.startsWith("team1")) {
      return 0;
    } else {
      return 2;
    }
  } else if (rotationKey.includes("partner")) {
    if (rotationKey.startsWith("side1") || rotationKey.startsWith("team1")) {
      return 1;
    } else {
      return 3;
    }
  }
  return -1;
}

function normalizeParticipantId(
  p: Participant | string | undefined | null
): string | null {
  if (p == null) return null;
  if (typeof p === "string") return p || null;
  return p._id?.toString() || null;
}

/**
 * Resolves the doubles serve order for this game as four participant ids:
 * [first server, first receiver, first server's partner, first receiver's partner]
 * (same convention as `buildDoublesRotation` / API `serverOrderPlayerIds`).
 */
function resolveDoublesServeRotationPlayerIds(
  serverConfig: InitialServerConfig | null | undefined,
  participants: Participant[],
  gameNumber?: number
): string[] | null {
  if (!serverConfig || participants.length !== 4) return null;

  let rotationIds: string[] | null = null;

  const idsFromOrder = (order: string[]) =>
    order.length === 4 ? order.map((id) => String(id)) : null;

  if (
    Array.isArray(serverConfig.serverOrderPlayerIds) &&
    serverConfig.serverOrderPlayerIds.length === 4
  ) {
    rotationIds = idsFromOrder(serverConfig.serverOrderPlayerIds);
  } else if (
    Array.isArray(serverConfig.serverOrder) &&
    serverConfig.serverOrder.length === 4
  ) {
    const mapped = serverConfig.serverOrder.map((key) => {
      const idx = getParticipantIndexFromRotationKey(String(key));
      if (idx < 0 || idx >= participants.length) return null;
      return normalizeParticipantId(participants[idx]);
    });
    if (mapped.every((x): x is string => Boolean(x))) {
      rotationIds = mapped;
    }
  } else if (
    serverConfig.firstServerPlayerId &&
    serverConfig.firstReceiverPlayerId
  ) {
    const sId = String(serverConfig.firstServerPlayerId);
    const rId = String(serverConfig.firstReceiverPlayerId);
    const sIdx = participants.findIndex(
      (p) => normalizeParticipantId(p) === sId
    );
    const rIdx = participants.findIndex(
      (p) => normalizeParticipantId(p) === rId
    );
    if (sIdx >= 0 && rIdx >= 0) {
      const sPartnerIdx = sIdx ^ 1;
      const rPartnerIdx = rIdx ^ 1;
      const a = normalizeParticipantId(participants[sIdx]);
      const b = normalizeParticipantId(participants[rIdx]);
      const c = normalizeParticipantId(participants[sPartnerIdx]);
      const d = normalizeParticipantId(participants[rPartnerIdx]);
      if (a && b && c && d) rotationIds = [a, b, c, d];
    }
  } else if (serverConfig.firstServer && serverConfig.firstReceiver) {
    const fs = String(serverConfig.firstServer);
    const fr = String(serverConfig.firstReceiver);
    const built = fs.startsWith("team")
      ? buildDoublesRotationForTeamMatch(fs, fr)
      : buildDoublesRotation(fs as DoublesPlayerKey, fr as DoublesPlayerKey);
    if (built?.length === 4) {
      const mapped = built.map((key) => {
        const idx = getParticipantIndexFromRotationKey(String(key));
        if (idx < 0) return null;
        return normalizeParticipantId(participants[idx]);
      });
      if (mapped.every((x): x is string => Boolean(x))) rotationIds = mapped;
    }
  }

  if (!rotationIds) return null;

  if (gameNumber && gameNumber > 0 && gameNumber % 2 === 0) {
    rotationIds = flipDoublesRotationForNextGame(
      rotationIds as unknown as DoublesPlayerKey[]
    ).map(String);
  }

  return rotationIds;
}

/**
 * Helper function to get receiver information from rotation
 * For doubles, receiver is the player after the server in the fixed rotation
 * [S, R, S′, R′] for that game (matches TT doubles receive order).
 * For singles, receiver is the other player.
 */
function getReceiverInfo(
  shot: Shot,
  participants?: Participant[],
  serverConfig?: InitialServerConfig | null,
  gameNumber?: number
): { name: string; id: string | null } | null {
  if (!shot.server || !participants || participants.length === 0) return null;

  const serverId =
    typeof shot.server === "string"
      ? shot.server
      : shot.server._id?.toString() || null;
  if (!serverId) return null;

  const isDoubles = participants.length === 4;

  // Singles: receiver is always the other player
  if (participants.length === 2) {
    const serverIndex = participants.findIndex((p) => {
      const pid = typeof p === "string" ? p : p._id?.toString();
      return pid === serverId;
    });

    if (serverIndex === -1) return null;

    const receiver = participants[serverIndex === 0 ? 1 : 0] || null;
    if (!receiver) return null;

    const receiverObj = typeof receiver === "string" ? null : receiver;
    const receiverName =
      receiverObj?.fullName || receiverObj?.username || "Unknown";

    return {
      name: receiverName,
      id: receiverObj?._id?.toString() || null,
    };
  }

  if (isDoubles) {
    const rotationIds = resolveDoublesServeRotationPlayerIds(
      serverConfig,
      participants,
      gameNumber
    );
    if (!rotationIds) return null;

    const sid = String(serverId);
    const rotIdx = rotationIds.findIndex((id) => String(id) === sid);
    if (rotIdx === -1) return null;

    const receiverId = String(rotationIds[(rotIdx + 1) % 4]);
    const receiver = participants.find(
      (p) => normalizeParticipantId(p) === receiverId
    );
    if (!receiver) return null;

    const receiverObj = typeof receiver === "string" ? null : receiver;
    return {
      name: receiverObj?.fullName || receiverObj?.username || "Unknown",
      id: receiverObj?._id?.toString() || receiverId,
    };
  }

  return null;
}

/**
 * Helper function to get set score at the time of shot
 * This is called with the set score calculated at the game level
 */
function getSetScoreAtShot(
  setScore: { side1Sets: number; side2Sets: number }
): { side1Sets: number; side2Sets: number } {
  return setScore;
}

/**
 * Helper function to format zone name with proper capitalization
 */
function formatZoneName(zone: string | null): string {
  if (!zone) return "";
  const zoneMap: Record<string, string> = {
    "short": "Short Zone",
    "mid": "Mid Zone",
    "deep": "Deep Zone"
  };
  return zoneMap[zone] || zone;
}

/**
 * Helper function to format sector name with proper capitalization
 */
function formatSectorName(sector: string | null): string {
  if (!sector) return "";
  const sectorMap: Record<string, string> = {
    "forehand": "Forehand",
    "backhand": "Backhand",
    "crossover": "CrossOver"
  };
  return sectorMap[sector] || sector;
}

/**
 * Helper function to format distance descriptor
 */
function formatDistanceDescriptor(originZone: string | null): string {
  if (!originZone) return "";
  const distanceMap: Record<string, string> = {
    "close-to-table": "close-to-the-table",
    "mid-distance": "Mid-distance",
    "far-distance": "Far distance"
  };
  return distanceMap[originZone] || originZone;
}

/**
 * Generate full commentary with server info and game score
 * Format: "[Server] serving [Receiver]. [Winner] wins the point by [Sector] [Shot type] to [placement with zones/sectors/lines], and game score now is [X-Y] ([player1-player2])"
 */
export function generateFullCommentary(
  shot: Shot,
  participants?: Participant[],
  games?: Array<{ gameNumber: number; side1Score?: number; side2Score?: number; winnerSide?: string | null; completed?: boolean }>,
  finalScore?: { side1Sets: number; side2Sets: number },
  side1Name?: string,
  side2Name?: string,
  currentGameScore?: { side1Score: number; side2Score: number },
  serverConfig?: InitialServerConfig | null,
  gameNumber?: number
): string {
  const commentary = analyzeShotPlacement(shot);
  const strokeName = formatStrokeName(shot.stroke);
  const hasDetailedTracking =
    shot.stroke != null &&
    shot.originX != null &&
    shot.originY != null &&
    shot.landingX != null &&
    shot.landingY != null;
  const isDoubles = Boolean(participants && participants.length === 4);
  
  // Get server and receiver info
  const serverInfo = getServerInfo(shot, participants);
  const receiverInfo = getReceiverInfo(shot, participants, serverConfig, gameNumber);
  
  // Get winner (player who hit the shot)
  let winnerName = "Unknown";
  if (!hasDetailedTracking && isDoubles) {
    const winnerSide = shot.side as string;
    if (winnerSide === "side1" || winnerSide === "team1") {
      winnerName = side1Name || "Side 1";
    } else if (winnerSide === "side2" || winnerSide === "team2") {
      winnerName = side2Name || "Side 2";
    }
  } else {
    const winnerId = typeof shot.player === "string" ? shot.player : shot.player._id?.toString() || null;
    if (participants && winnerId) {
      const winner = participants.find((p) => {
        const pid = typeof p === "string" ? p : p._id?.toString();
        return pid === winnerId;
      });
      const winnerObj = typeof winner === "string" ? null : winner;
      winnerName = winnerObj?.fullName || winnerObj?.username || "Unknown";
    } else {
      const playerObj = typeof shot.player === "string" ? null : shot.player;
      winnerName = playerObj?.fullName || playerObj?.username || "Unknown";
    }
  }
  
  // Build shot description in natural language
  // Format: [shot type lowercase] from [distance], played [line] into [zone]
  // Note: Sectors are omitted from commentary as they're primarily for analytics
  const shotParts: string[] = [];

  if (hasDetailedTracking) {
    const strokeLower = strokeName.toLowerCase();
    shotParts.push(strokeLower);

    const distanceDesc = formatDistanceDescriptor(commentary.originZone);
    if (distanceDesc) {
      shotParts.push(`from ${distanceDesc.toLowerCase()}`);
    }

    if (commentary.line) {
      shotParts.push(`played ${commentary.line}`);
    }

    const landingDetails: string[] = [];
    if (
      shot.landingX !== null &&
      shot.landingX !== undefined &&
      shot.landingY !== null &&
      shot.landingY !== undefined
    ) {
      const isExtremeLeft = shot.landingX < 12;
      const isExtremeRight = shot.landingX > 88;
      const isExtremeTop = shot.landingY < 12;
      const isExtremeBottom = shot.landingY > 88;

      if (isExtremeLeft && isExtremeTop) {
        landingDetails.push("into the extreme left corner of the table");
      } else if (isExtremeRight && isExtremeTop) {
        landingDetails.push("into the extreme right corner of the table");
      } else if (isExtremeLeft && isExtremeBottom) {
        landingDetails.push("into the extreme left corner (deep) of the table");
      } else if (isExtremeRight && isExtremeBottom) {
        landingDetails.push("into the extreme right corner (deep) of the table");
      } else if (isExtremeLeft) {
        landingDetails.push("into the extreme left side of the table");
      } else if (isExtremeRight) {
        landingDetails.push("into the extreme right side of the table");
      } else if (isExtremeTop) {
        landingDetails.push("close to the net");
      } else if (isExtremeBottom) {
        landingDetails.push("deep on the table");
      } else {
        const zoneName = formatZoneName(commentary.zone);
        if (zoneName) {
          landingDetails.push(`into the ${zoneName.toLowerCase()}`);
        }
      }
    } else {
      const zoneName = formatZoneName(commentary.zone);
      if (zoneName) {
        landingDetails.push(`into the ${zoneName.toLowerCase()}`);
      }
    }

    if (landingDetails.length > 0) {
      shotParts.push(landingDetails.join(", "));
    }
  } else {
    // Simple tracking mode - generate basic commentary
    // Use stroke name if available, otherwise provide generic description
    if (shot.stroke) {
      const strokeLower = strokeName.toLowerCase();
      if (strokeLower !== "unknown") {
        shotParts.push(strokeLower);
      }
    }
    
    // Add generic winning shot description for simple tracking
    if (shotParts.length === 0) {
      shotParts.push("winning shot");
    } else {
      shotParts.push("to win the point");
    }
  }
  
  // Join shot parts with commas where appropriate
  const shotDescription = shotParts.join(", ");
  
  // For doubles simple mode, use full side name; for detailed mode/singles, use first name
  const winnerDisplayName = (!hasDetailedTracking && isDoubles) ? winnerName : winnerName.split(" ")[0];
  
  // Get game score
  let gameScoreText = "";
  if (currentGameScore !== undefined) {
    // Always display score as side1-side2 order, regardless of who won the point
    const side1Score = currentGameScore.side1Score;
    const side2Score = currentGameScore.side2Score;
    const winnerSide = shot.side;
    // Use winnerName which already contains the correct side name for doubles simple mode
    // Use en dash (–) instead of hyphen (-) for score
    gameScoreText = ` The game score is now <strong>${side1Score}–${side2Score}</strong> in favor of <strong>${winnerName}</strong>.`;
  }
  
  // Build full commentary in the exact format requested
  // Format: "[Server] serves to [Receiver]. [Winner] wins the point with a [Shot description]. The game score is now [X–Y] in favor of [Winner]."
  let fullCommentary = "";
  
  // Server and receiver info - "serves to" instead of "serving"
  if (serverInfo && receiverInfo) {
    fullCommentary = `<strong>${serverInfo.name}</strong> serves to <strong>${receiverInfo.name}</strong>. `;
  } else if (serverInfo) {
    fullCommentary = `<strong>${serverInfo.name}</strong> serves. `;
  }
  
  if (shotDescription) {
    fullCommentary += `<strong>${winnerDisplayName}</strong> wins the point with a <strong>${shotDescription}</strong>.`;
  } else {
    fullCommentary += `<strong>${winnerDisplayName}</strong> wins the point.`;
  }
  
  // Game score
  if (gameScoreText) {
    fullCommentary += gameScoreText;
  }
  
  return fullCommentary;
}

export function getShotPlacementDetails(shot: Shot): {
  label: string;
  value: string;
}[] {
  const commentary = analyzeShotPlacement(shot);
  const details: { label: string; value: string }[] = [];

  // New enhanced fields
  if (commentary.zone)
    details.push({ label: "Zone", value: commentary.zone });

  if (commentary.sector)
    details.push({ label: "Sector", value: commentary.sector });

  if (commentary.line)
    details.push({ label: "Line", value: commentary.line });

  if (commentary.originZone)
    details.push({ label: "Origin Zone", value: commentary.originZone.replace("-", " ") });

  // Legacy fields (for backward compatibility)
  if (commentary.direction)
    details.push({ label: "Direction", value: commentary.direction });

  if (commentary.depth)
    details.push({ label: "Depth", value: commentary.depth });

  if (commentary.placement)
    details.push({ label: "Placement", value: commentary.placement });

  if (commentary.originDistance)
    details.push({ label: "Origin", value: commentary.originDistance });

  if (commentary.netProximity)
    details.push({ label: "Net Proximity", value: commentary.netProximity });

  if (commentary.centerPlacement)
    details.push({ label: "Center Placement", value: commentary.centerPlacement });

  return details;
}

export function formatStrokeName(stroke?: string | null): string {
  if (!stroke) return "Unknown";

  return stroke
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}