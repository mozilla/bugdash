import js from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";

export default [
    js.configs.recommended,
    unicorn.configs["flat/recommended"],
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
            },
        },
        plugins: {
            unusedImports: unusedImports,
        },
        rules: {
            "arrow-body-style": "error",
            "arrow-parens": "error",
            "block-scoped-var": "error",
            "camelcase": "error",
            "class-methods-use-this": "error",
            "consistent-return": "error",
            "curly": ["error", "multi-line"],
            "eqeqeq": "error",
            "no-alert": "error",
            "no-confusing-arrow": "error",
            "no-console": "error",
            "no-duplicate-imports": "error",
            "no-else-return": "error",
            "no-implicit-globals": "error",
            "no-unused-vars": "off",
            "no-use-before-define": ["error", "nofunc"],
            "no-var": "error",
            "no-unused-vars": [
                "error",
                {
                    args: "after-used",
                    argsIgnorePattern: "^_",
                    vars: "all",
                    varsIgnorePattern: "^_",
                    caughtErrors: "none",
                },
            ],
            "unicorn/better-regex": "off",
            "unicorn/no-this-assignment": "off",
            "unicorn/number-literal-case": "off",
            "unicorn/numeric-separators-style": "off",
            "unicorn/prefer-node-protocol": "off",
            "unicorn/prefer-optional-catch-binding": "off",
            "unicorn/prefer-spread": "off",
            "unicorn/prevent-abbreviations": "off",
            "unusedImports/no-unused-imports": "error",
        },
    },
];
