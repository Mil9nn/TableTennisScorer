export type ProfileCompletionUser = {
  fullName?: string | null;
  profileImage?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  handedness?: string | null;
  location?: string | null;
  phoneNumber?: string | null;
  isProfileComplete?: boolean;
};

const COMPLETION_CHECKS: Array<(user: ProfileCompletionUser) => boolean> = [
  (u) => Boolean(u.fullName?.trim()),
  (u) => Boolean(u.profileImage?.trim()),
  (u) => Boolean(u.dateOfBirth),
  (u) => Boolean(u.gender),
  (u) => Boolean(u.handedness),
  (u) => Boolean(u.location?.trim()),
  (u) => Boolean(u.phoneNumber?.trim()),
];

export function getProfileCompletion(user: ProfileCompletionUser | null | undefined) {
  if (!user) {
    return { percent: 0, isComplete: false, filled: 0, total: COMPLETION_CHECKS.length };
  }

  const filled = COMPLETION_CHECKS.filter((check) => check(user)).length;
  const total = COMPLETION_CHECKS.length;
  const percent = Math.round((filled / total) * 100);
  const isComplete = user.isProfileComplete === true || percent >= 100;

  return {
    percent: isComplete ? 100 : percent,
    isComplete,
    filled,
    total,
  };
}
