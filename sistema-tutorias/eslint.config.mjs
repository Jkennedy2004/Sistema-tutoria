import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Añade este nuevo objeto para deshabilitar las reglas
  {
    rules: {
      // Desactiva el error de `any`
      "@typescript-eslint/no-explicit-any": "off",

      // Desactiva las advertencias de variables no usadas
      "@typescript-eslint/no-unused-vars": "off",

      // Desactiva la advertencia de dependencias de `useEffect`
      "react-hooks/exhaustive-deps": "off",

      // Desactiva la advertencia de la etiqueta `<img>`
      "@next/next/no-img-element": "off"
    },
  },
];

export default eslintConfig;