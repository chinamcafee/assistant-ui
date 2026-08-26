import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, "../..");
export const packageMap = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "company/package-map.json"), "utf8"),
);
export const releaseAllowlist = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "company/release-allowlist.json"),
    "utf8",
  ),
);

export function toCompanyPackageName(name) {
  if (name.startsWith(`${packageMap.scope}/`)) return name;
  const explicit = packageMap.unscoped[name];
  if (explicit) return explicit;
  if (name.startsWith(packageMap.scopedRule.from)) {
    return `${packageMap.scopedRule.to}${name.slice(packageMap.scopedRule.from.length)}`;
  }
  if (packageMap.companyOwned.includes(name)) return name;
  return undefined;
}

export function readManifest(packageDir) {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, packageDir, "package.json"), "utf8"),
  );
}

export function sourcePackageEntries() {
  const packagesDir = path.join(repoRoot, "packages");
  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `packages/${entry.name}`)
    .filter((packageDir) =>
      fs.existsSync(path.join(repoRoot, packageDir, "package.json")),
    )
    .map((packageDir) => ({ packageDir, manifest: readManifest(packageDir) }));
}

export function packageMappingEntries() {
  return sourcePackageEntries()
    .map(({ packageDir, manifest }) => ({
      packageDir,
      sourceName: manifest.name,
      companyName:
        toCompanyPackageName(manifest.name) ??
        (packageMap.companyOwned.includes(manifest.name)
          ? manifest.name
          : undefined),
    }))
    .filter((entry) => entry.companyName);
}
