export type Consultant = {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  bio?: string;
  imageUrl?: string;
  specialties?: string[];
};

export const defaultConsultantId = "agency";

export const consultants: Consultant[] = [
  {
    id: "agency",
    name: "Agency Desk",
    email: "info@phoenixvoyages.ca",
    phone: "18553835771",
    bio: "Your dedicated travel partner.",
    imageUrl: "/consultants/default.jpg",
  },
  {
    id: "suzanne",
    name: "Suzanne Advisor",
    title: "Luxury Travel Consultant",
    email: "suzanne@phoenixvoyages.ca",
    phone: "18553835771",
    bio: "Specializing in luxury cruises and family adventures.",
    imageUrl: "/consultants/default.jpg",
    specialties: ["Luxury Cruises", "Family Travel", "Custom Escapes"],
  },
];
