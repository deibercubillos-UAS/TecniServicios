import { baseConfig } from "@tecni/config/eslint/base";

export default [
  ...baseConfig,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];
