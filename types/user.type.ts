export interface User {
  _id: string;
  username: string;
  fullName: string;
  email?: string;
  profileImage?: string;
  isProfileComplete?: boolean;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
  handedness?: "left" | "right" | "ambidextrous";
  location?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}