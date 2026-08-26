import fs from "node:fs";
import path from "node:path";
import {
  packageMap,
  readManifest,
  releaseAllowlist,
  repoRoot,
  toCompanyPackageName,
} from "./package-map.mjs";

const failures = [];
const packageMapPath = path.join(repoRoot, "company/package-map.json");
const packageMapSchemaPath = path.resolve(
  path.dirname(packageMapPath),
  packageMap.$schema,
);
if (!fs.existsSync(packageMapSchemaPath)) {
  failures.push(`Package map schema does not exist: ${packageMap.$schema}`);
}
const selected = new Set(releaseAllowlist.packages);
const selectedWithOptional = new Set([
  ...releaseAllowlist.packages,
  ...releaseAllowlist.optionalPackages,
]);
const allInternalNames = new Map();

for (const entry of fs.readdirSync(path.join(repoRoot, "packages"), {
  withFileTypes: true,
})) {
  if (!entry.isDirectory()) continue;
  const packageDir = `packages/${entry.name}`;
  const manifestPath = path.join(repoRoot, packageDir, "package.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = readManifest(packageDir);
  if (!manifest.private) allInternalNames.set(manifest.name, packageDir);
}

for (const [name] of allInternalNames) {
  if (!toCompanyPackageName(name)) {
    failures.push(`Public package is not mapped: ${name}`);
  }
}

for (const packageDir of selected) {
  const manifest = readManifest(packageDir);
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const dependency of Object.keys(manifest[section] ?? {})) {
      const dependencyDir = allInternalNames.get(dependency);
      if (dependencyDir && !selected.has(dependencyDir)) {
        failures.push(
          `${packageDir} has ${section} edge to non-allowlisted ${dependency} (${dependencyDir})`,
        );
      }
    }
  }
}

for (const packageDir of releaseAllowlist.optionalPackages) {
  const manifest = readManifest(packageDir);
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const dependency of Object.keys(manifest[section] ?? {})) {
      const dependencyDir = allInternalNames.get(dependency);
      if (dependencyDir && !selectedWithOptional.has(dependencyDir)) {
        failures.push(
          `${packageDir} has ${section} edge to non-allowlisted ${dependency} (${dependencyDir})`,
        );
      }
    }
  }
}

const expectedDirectNames = new Map([
  ["packages/cli", "@wenchuantech/assistant-ui"],
  ["packages/create-assistant-ui", "@wenchuantech/create-assistant-ui"],
  ["packages/agent-launcher", "@wenchuantech/assistant-ui-agent-launcher"],
  ["packages/assistant-protocol", "@wenchuantech/assistant-protocol"],
  ["packages/assistant-runtime", "@wenchuantech/assistant-runtime"],
  ["packages/assistant-runtime-agui", "@wenchuantech/assistant-runtime-agui"],
]);
for (const [packageDir, expectedName] of expectedDirectNames) {
  const manifest = readManifest(packageDir);
  if (
    manifest.name !== expectedName ||
    manifest.version !== packageMap.version
  ) {
    failures.push(
      `${packageDir} must be ${expectedName}@${packageMap.version}, found ${manifest.name}@${manifest.version}`,
    );
  }
}

const cliRegistry = fs.readFileSync(
  path.join(repoRoot, "packages/cli/src/lib/utils/registry.ts"),
  "utf8",
);
if (cliRegistry.includes("https://r.assistant-ui.com")) {
  failures.push("Company CLI still uses the upstream registry URL");
}
if (
  !cliRegistry.includes(
    "https://raw.githubusercontent.com/chinamcafee/assistant-ui/main/company/registry",
  ) ||
  !cliRegistry.includes("WENCHUAN_ASSISTANT_UI_REGISTRY_URL")
) {
  failures.push("Company CLI registry source or override is missing");
}

const createCommand = fs.readFileSync(
  path.join(repoRoot, "packages/cli/src/commands/create.ts"),
  "utf8",
);
const projectNamesBody = createCommand.match(
  /const COMPANY_PROJECT_NAMES = new Set\(\[([\s\S]*?)\]\);/,
)?.[1];
if (!projectNamesBody) {
  failures.push("Company CLI project allowlist is missing");
} else {
  const cliProjectNames = [...projectNamesBody.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .sort();
  const configuredProjectNames = [
    ...releaseAllowlist.templates,
    ...releaseAllowlist.examples,
  ].sort();
  if (
    JSON.stringify(cliProjectNames) !== JSON.stringify(configuredProjectNames)
  ) {
    failures.push(
      "Company CLI project allowlist differs from release-allowlist.json",
    );
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Company fork verification passed.");
