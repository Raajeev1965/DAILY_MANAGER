import type { Config } from "tailwindcss";
const v = (n: string) => `var(--${n})`;
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { paper: v("paper"), card: v("card"), ink: v("ink"), mute: v("mute"), line: v("line"),
        brand: v("brand"), alarm: v("alarm"), out: v("out"), inc: v("in") },
    },
  },
} satisfies Config;
