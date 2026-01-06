import type { Config } from "tailwindcss";
import { phoenixPreset } from "@tailfire/ui-public/tailwind.preset";

const config: Config = {
  presets: [phoenixPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-public/src/**/*.{ts,tsx}",
  ],
};

export default config;
