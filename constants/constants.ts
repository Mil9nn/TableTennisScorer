export const shotCategories = {
  drive: [
    { value: "forehand_drive", label: "Forehand Drive" },
    { value: "backhand_drive", label: "Backhand Drive" },
  ],
  topspin: [
    { value: "forehand_topspin", label: "Forehand Topspin" },
    { value: "backhand_topspin", label: "Backhand Topspin" },
  ],
  loop: [
    { value: "forehand_loop", label: "Forehand Loop" },
    { value: "backhand_loop", label: "Backhand Loop" },
  ],
  smash: [
    { value: "forehand_smash", label: "Forehand Smash" },
    { value: "backhand_smash", label: "Backhand Smash" },
  ],
  push: [
    { value: "forehand_push", label: "Forehand Push" },
    { value: "backhand_push", label: "Backhand Push" },
  ],
  chop: [
    { value: "forehand_chop", label: "Forehand Chop" },
    { value: "backhand_chop", label: "Backhand Chop" },
  ],
  flick: [
    { value: "forehand_flick", label: "Forehand Flick" },
    { value: "backhand_flick", label: "Backhand Flick" },
  ],
  block: [
    { value: "forehand_block", label: "Forehand Block" },
    { value: "backhand_block", label: "Backhand Block" },
  ],
  drop: [
    { value: "forehand_drop", label: "Forehand Drop" },
    { value: "backhand_drop", label: "Backhand Drop" },
  ],
  net: [{ value: "net_point", label: "Net Point" }],
  serve: [{ value: "serve_point", label: "Serve Point" }],
};

export const SHOT_TYPE_COLORS: Record<string, string> = {
  forehand_drive: "#E6194B",
  backhand_drive: "#F58231",
  forehand_topspin: "#FFC20E",
  backhand_topspin: "#BFEF45",
  forehand_loop: "#3CB44B",
  backhand_loop: "#42D4F4",
  forehand_smash: "#4363D8",
  backhand_smash: "#911EB4",
  forehand_push: "#F032E6",
  backhand_push: "#FABED4",
  forehand_chop: "#469990",
  backhand_chop: "#9A6324",
  forehand_flick: "#800000",
  backhand_flick: "#808000",
  forehand_block: "#000075",
  backhand_block: "#A9A9A9",
  forehand_drop: "#82CAFF",
  backhand_drop: "#AAFFC3",
  net_point: "#9C27B0",   // purple - clearly different from serve_point
  serve_point: "#4ECDC4", // teal - original color
};

