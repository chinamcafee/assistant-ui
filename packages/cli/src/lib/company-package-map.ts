export const COMPANY_REGISTRY_ALIAS = "@wenchuantech-assistant-ui";

const unscopedPackageMap: Readonly<Record<string, string>> = {
  "assistant-stream": "@wenchuantech/assistant-stream",
  "assistant-cloud": "@wenchuantech/assistant-cloud",
  "assistant-ui": "@wenchuantech/assistant-ui",
  "create-assistant-ui": "@wenchuantech/create-assistant-ui",
  "safe-content-frame": "@wenchuantech/safe-content-frame",
  "heat-graph": "@wenchuantech/assistant-ui-heat-graph",
  "tw-glass": "@wenchuantech/assistant-ui-tw-glass",
  "tw-shimmer": "@wenchuantech/assistant-ui-tw-shimmer",
};

export function toCompanyPackageName(name: string): string | undefined {
  if (name.startsWith("@wenchuantech/")) return name;
  if (name.startsWith("@assistant-ui/")) {
    return `@wenchuantech/assistant-ui-${name.slice("@assistant-ui/".length)}`;
  }
  return unscopedPackageMap[name];
}

function tokenPattern(name: string): RegExp {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?<![A-Za-z0-9@._/-])${escaped}(?=$|[^A-Za-z0-9._-])`,
    "g",
  );
}

export function rewriteCompanyPackageReferences(content: string): string {
  const scoped = content.replace(
    /(?<![A-Za-z0-9@._/-])@assistant-ui\/([a-z0-9-]+)(?=$|[^A-Za-z0-9._-])/g,
    "@wenchuantech/assistant-ui-$1",
  );
  return Object.entries(unscopedPackageMap)
    .sort(([left], [right]) => right.length - left.length)
    .reduce(
      (result, [source, target]) =>
        result.replace(tokenPattern(source), target),
      scoped,
    )
    .replaceAll(
      "https://github.com/assistant-ui/assistant-ui",
      "https://github.com/chinamcafee/assistant-ui",
    )
    .replaceAll(
      "https://www.assistant-ui.com",
      "https://github.com/chinamcafee/assistant-ui",
    );
}
