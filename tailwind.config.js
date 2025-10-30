/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["InstrumentSans_400Regular", "sans-serif"],
        medium: ["InstrumentSans_500Medium", "sans-serif"],
        semibold: ["InstrumentSans_600SemiBold", "sans-serif"],
        bold: ["InstrumentSans_700Bold", "sans-serif"],
        italic: ["InstrumentSans_400Regular_Italic", "sans-serif"],
        "medium-italic": ["InstrumentSans_500Medium_Italic", "sans-serif"],
        "semibold-italic": ["InstrumentSans_600SemiBold_Italic", "sans-serif"],
        "bold-italic": ["InstrumentSans_700Bold_Italic", "sans-serif"],
        mono: ["SpaceGrotesk_400Regular", "sans-serif"],
        "mono-medium": ["SpaceGrotesk_500Medium", "sans-serif"],
        "mono-semibold": ["SpaceGrotesk_600SemiBold", "sans-serif"],
        "mono-bold": ["SpaceGrotesk_700Bold", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
