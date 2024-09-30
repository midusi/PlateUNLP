import antfu from "@antfu/eslint-config"

export default antfu({
  type: "app",
  stylistic: {
    indent: 2,
    quotes: "double",
  },
  formatters: true,
}, {
  rules: {
    "no-console": "off",
  },
})
