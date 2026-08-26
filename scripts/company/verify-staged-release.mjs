import fs from "node:fs";
import path from "node:path";
import { releaseAllowlist, repoRoot } from "./package-map.mjs";

const root = path.join(repoRoot, ".company-release");
const failures = [];
const forbidden =
  /@assistant-ui\/|["'](?:assistant-stream|assistant-cloud|safe-content-frame)["']/;

const stagedPackages = [
  ...releaseAllowlist.packages,
  ...releaseAllowlist.optionalPackages.filter((packageDir) =>
    fs.existsSync(path.join(root, path.basename(packageDir))),
  ),
];

for (const packageDir of stagedPackages) {
  const stagedDir = path.join(root, path.basename(packageDir));
  const manifestPath = path.join(stagedDir, "package.json");
  if (!fs.existsSync(manifestPath)) {
    failures.push(`Missing staged package: ${packageDir}`);
    continue;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest.name.startsWith("@wenchuantech/")) {
    failures.push(
      `${packageDir} staged as non-company package ${manifest.name}`,
    );
  }
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const dependency of Object.keys(manifest[section] ?? {})) {
      if (forbidden.test(JSON.stringify(dependency))) {
        failures.push(`${manifest.name} leaks ${dependency} in ${section}`);
      }
    }
  }
  for (const relative of ["dist", "src", "package.json"]) {
    const target = path.join(stagedDir, relative);
    if (!fs.existsSync(target)) continue;
    const files = fs.statSync(target).isDirectory()
      ? fs
          .readdirSync(target, { recursive: true })
          .filter((file) => typeof file === "string")
          .map((file) => path.join(target, file))
          .filter((file) => fs.statSync(file).isFile())
      : [target];
    for (const file of files) {
      const buffer = fs.readFileSync(file);
      if (buffer.includes(0)) continue;
      if (forbidden.test(buffer.toString("utf8"))) {
        failures.push(
          `${manifest.name} leaks an upstream package in ${relative}`,
        );
        break;
      }
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  "Staged company release contains no upstream runtime package identities.",
);
