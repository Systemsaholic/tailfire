import type { Config } from "tailwindcss";
import { phoenixPreset } from "@tailfire/ui-public/tailwind.preset";

export default {
  presets: [phoenixPreset as Config],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-public/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
