import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta sofisticada para Studio de Beleza
        background: "#FAFAFA", // Branco levemente perolado
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#D8A7A7", // Rosa antigo elegante
          light: "#E8C5C5",
          dark: "#B88686",
        },
        text: {
          main: "#4A4A4A", // Cinza chumbo suave (melhor que preto puro)
          light: "#8CA3A3",
        },
        accent: "#E2C4A7", // Tom nude/dourado para detalhes
      },
    },
  },
  plugins: [],
};
export default config;
