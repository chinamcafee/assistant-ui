import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  packageMap,
  readManifest,
  releaseAllowlist,
  repoRoot,
  toCompanyPackageName,
} from "./package-map.mjs";

const sourceRoot = path.join(repoRoot, "apps/registry/dist");
const outputRoot = path.join(repoRoot, "company/registry");
const companyRegistryUrl =
  "https://raw.githubusercontent.com/chinamcafee/assistant-ui/main/company/registry";
const allowedSourceNames = new Set(
  releaseAllowlist.packages.map((packageDir) => readManifest(packageDir).name),
);
const internalPackagePattern =
  /@assistant-ui\/[a-z0-9-]+|assistant-stream|assistant-cloud|safe-content-frame|heat-graph|tw-glass|tw-shimmer/g;

function hasUnsupportedPackage(content) {
  for (const match of content.matchAll(internalPackagePattern)) {
    if (!allowedSourceNames.has(match[0])) return true;
  }
  return false;
}

function rewritePackages(content) {
  return content.replace(internalPackagePattern, (name) => {
    const mapped = toCompanyPackageName(name);
    if (!mapped) throw new Error(`Registry package is not mapped: ${name}`);
    return mapped;
  });
}

function rewriteRegistryContent(content) {
  return rewritePackages(content)
    .replaceAll("https://r.assistant-ui.com", companyRegistryUrl)
    .replaceAll(
      "https://github.com/assistant-ui/assistant-ui",
      packageMap.repository,
    )
    .replaceAll("https://www.assistant-ui.com", packageMap.repository)
    .replaceAll("https://assistant-ui.com", packageMap.repository);
}

function registryDependencyPaths(payload) {
  return (payload.registryDependencies ?? [])
    .filter(
      (dependency) =>
        typeof dependency === "string" &&
        dependency.startsWith("https://r.assistant-ui.com/"),
    )
    .map((dependency) =>
      dependency.slice("https://r.assistant-ui.com/".length),
    );
}

const candidates = new Map();
for (const file of fs.readdirSync(sourceRoot, { recursive: true })) {
  if (typeof file !== "string" || !file.endsWith(".json")) continue;
  const sourcePath = path.join(sourceRoot, file);
  if (!fs.statSync(sourcePath).isFile()) continue;
  const content = fs.readFileSync(sourcePath, "utf8");
  if (hasUnsupportedPackage(content)) continue;
  const payload = JSON.parse(content);
  candidates.set(file, {
    payload,
    dependencies: registryDependencyPaths(payload),
  });
}

let changed = true;
while (changed) {
  changed = false;
  for (const [file, candidate] of candidates) {
    if (file.endsWith("registry.json")) continue;
    if (
      candidate.dependencies.some((dependency) => !candidates.has(dependency))
    ) {
      candidates.delete(file);
      changed = true;
    }
  }
}

fs.rmSync(outputRoot, { recursive: true, force: true });
for (const [file, { payload }] of candidates) {
  if (file.endsWith("registry.json")) continue;
  const target = path.join(outputRoot, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const rewritten = rewriteRegistryContent(JSON.stringify(payload, null, 2));
  fs.writeFileSync(target, `${rewritten}\n`);
}

for (const variant of [
  { style: "base-nova", source: "base" },
  { style: "new-york", source: "." },
]) {
  const sourceDir = path.join(outputRoot, variant.source);
  const targetDir = path.join(outputRoot, "styles", variant.style);
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".json")) {
      fs.copyFileSync(
        path.join(sourceDir, entry.name),
        path.join(targetDir, entry.name),
      );
    }
  }
}

for (const base of [".", "base"]) {
  const sourceIndex = JSON.parse(
    fs.readFileSync(path.join(sourceRoot, base, "registry.json"), "utf8"),
  );
  const directory = path.join(outputRoot, base);
  const available = new Set(
    fs
      .readdirSync(directory)
      .filter((file) => file.endsWith(".json") && file !== "registry.json")
      .map((file) => file.slice(0, -5)),
  );
  const index = {
    ...sourceIndex,
    name: "wenchuantech-assistant-ui",
    homepage: packageMap.repository,
    items: sourceIndex.items.filter((item) => available.has(item.name)),
  };
  fs.writeFileSync(
    path.join(directory, "registry.json"),
    `${rewriteRegistryContent(JSON.stringify(index, null, 2))}\n`,
  );
}

execFileSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "oxfmt", "--write", outputRoot],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

console.log(
  `Built ${candidates.size - 2} company registry files in ${outputRoot}`,
);
