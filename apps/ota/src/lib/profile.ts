import { useStoredState } from "@/lib/mock-store";

export type Profile = {
  name: string;
  email: string;
  phone: string;
  travelers: number;
  notes: string;
};

const defaultProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  travelers: 2,
  notes: "",
};

export function useProfileState() {
  return useStoredState<Profile>("mock_profile", defaultProfile);
}
