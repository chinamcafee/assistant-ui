import fs from "node:fs";
import path from "node:path";
import {
  packageMap,
  packageMappingEntries,
  readManifest,
  releaseAllowlist,
  repoRoot,
  toCompanyPackageName,
} from "./package-map.mjs";

const includeOptional = process.argv.includes("--include-agui");
const selected = [
  ...releaseAllowlist.packages,
  ...(includeOptional ? releaseAllowlist.optionalPackages : []),
];
const outputRoot = path.join(repoRoot, ".company-release");
const mappings = packageMappingEntries();
const sourceNameByDir = new Map(
  mappings.map(({ packageDir, sourceName }) => [packageDir, sourceName]),
);
const allNames = new Map();

for (const { sourceName, companyName } of mappings) {
  allNames.set(sourceName, companyName);
}
for (const companyName of packageMap.companyOwned) {
  allNames.set(companyName, companyName);
}

function packageTokenPattern(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9@._/-])${escaped}(?=$|[^A-Za-z0-9-])`, "g");
}

const textMappings = [...allNames.entries()]
  .filter(([source, target]) => source !== target)
  .sort(([left], [right]) => right.length - left.length)
  .map(([source, target]) => [packageTokenPattern(source), target]);

function rewriteText(content) {
  let result = content.replaceAll(
    "@assistant-ui/",
    "@wenchuantech/assistant-ui-",
  );
  for (const [pattern, target] of textMappings) {
    result = result.replace(pattern, target);
  }
  return result
    .replaceAll(
      "https://github.com/assistant-ui/assistant-ui",
      packageMap.repository,
    )
    .replaceAll("https://www.assistant-ui.com", packageMap.repository);
}

function rewriteDependencySection(section) {
  if (!section) return undefined;
  const result = {};
  for (const [name, version] of Object.entries(section)) {
    const target = toCompanyPackageName(name) ?? name;
    const isCompanyInternal =
      target.startsWith(`${packageMap.scope}/assistant`) ||
      target === `${packageMap.scope}/safe-content-frame`;
    result[target] = isCompanyInternal ? `^${packageMap.version}` : version;
  }
  return result;
}

function rewriteManifest(packageDir, manifest) {
  const mappedSourceName = sourceNameByDir.get(packageDir) ?? manifest.name;
  const companyName =
    toCompanyPackageName(mappedSourceName) ??
    toCompanyPackageName(manifest.name) ??
    manifest.name;
  const result = {
    ...manifest,
    name: companyName,
    version: packageMap.version,
    description: `Wenchuan Tech maintained fork of ${mappedSourceName}`,
    author: "Beijing Wenchuan Network Technology Co., Ltd.",
    homepage: packageMap.repository,
    repository: {
      type: "git",
      url: `git+${packageMap.repository}.git`,
      directory: packageDir,
    },
    bugs: { url: `${packageMap.repository}/issues` },
    dependencies: rewriteDependencySection(manifest.dependencies),
    optionalDependencies: rewriteDependencySection(
      manifest.optionalDependencies,
    ),
    peerDependencies: rewriteDependencySection(manifest.peerDependencies),
    publishConfig: { access: "public", provenance: true },
  };
  delete result.devDependencies;
  delete result.optionalDevDependencies;
  for (const key of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    if (!result[key] || Object.keys(result[key]).length === 0)
      delete result[key];
  }
  return result;
}

function rewriteTree(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      rewriteTree(target);
      continue;
    }
    const buffer = fs.readFileSync(target);
    if (buffer.includes(0)) continue;
    const content = buffer.toString("utf8");
    const rewritten = rewriteText(content);
    if (rewritten !== content) fs.writeFileSync(target, rewritten);
  }
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
fs.copyFileSync(
  path.join(repoRoot, "LICENSE"),
  path.join(outputRoot, "LICENSE"),
);

for (const packageDir of selected) {
  const sourceDir = path.join(repoRoot, packageDir);
  const manifest = readManifest(packageDir);
  if (manifest.scripts?.build && !fs.existsSync(path.join(sourceDir, "dist"))) {
    throw new Error(`${packageDir} is not built; run pnpm company:build first`);
  }
  const stagedDir = path.join(outputRoot, path.basename(packageDir));
  fs.cpSync(sourceDir, stagedDir, {
    recursive: true,
    filter: (source) => !source.split(path.sep).includes("node_modules"),
  });
  fs.copyFileSync(
    path.join(repoRoot, "LICENSE"),
    path.join(stagedDir, "LICENSE"),
  );
  fs.writeFileSync(
    path.join(stagedDir, "package.json"),
    `${JSON.stringify(rewriteManifest(packageDir, manifest), null, 2)}\n`,
  );
  rewriteTree(stagedDir);
}

console.log(`Staged ${selected.length} company packages in ${outputRoot}`);
