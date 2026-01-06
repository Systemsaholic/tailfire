import type { StaticImageData } from "next/image";
import phoenixLogo from "@/assets/phoenix-logo.svg";

export type Consultant = {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  bioUrl?: string;
  avatar: string | StaticImageData;
  specialties?: string[];
};

export const defaultConsultantId = "agency";

export const consultants: Record<string, Consultant> = {
  agency: {
    id: "agency",
    name: "Agency Desk",
    email: "info@phoenixvoyages.ca",
    phone: "18553835771",
    bioUrl: "/about",
    avatar: phoenixLogo as StaticImageData,
  },
  suzanne: {
    id: "suzanne",
    name: "Suzanne Advisor",
    title: "Luxury Travel Consultant",
    email: "suzanne@phoenixvoyages.ca",
    phone: "18553835771",
    bioUrl: "/about",
    avatar: phoenixLogo as StaticImageData,
    specialties: ["Luxury Cruises", "Family Travel", "Custom Escapes"],
  },
};
