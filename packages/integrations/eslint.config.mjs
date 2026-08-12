import { baseConfig } from "@tecni/config/eslint/base";

export default [
  // scripts/ son utilidades CLI de un solo uso (Node, no parte de la
  // librería que se importa) — no llevan el mismo lint que el código
  // de app/librería.
  { ignores: ["scripts/**"] },
  ...baseConfig,
];
