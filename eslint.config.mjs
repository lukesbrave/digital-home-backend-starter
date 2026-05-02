import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "next-env.d.ts",
      "cloudflare-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // eslint-plugin-react-hooks@7 added this rule. The existing client
      // components use `useEffect(() => { fetchX(); }, [fetchX])` patterns
      // intentionally; refactoring them is out of scope for the Next 16
      // migration. Downgrade to a warning so editors surface it without
      // breaking CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["src/types/database.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ["src/types/dom-augmentation.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
