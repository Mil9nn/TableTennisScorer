export interface LineupPlayer {
  id: string;
  name: string;
  username?: string;
  profileImage?: string;
}

export interface TeamRoster {
  id: string;
  name: string;
  players: LineupPlayer[];
}

/** position label → selected playerId */
export type PositionSlots = Record<string, string | null>;

export interface TeamLineupState {
  team1Slots: PositionSlots;
  team2Slots: PositionSlots;
}
