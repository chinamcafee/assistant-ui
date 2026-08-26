import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./package-map.mjs";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const officialRepository = args.find((arg) => arg !== "--check");

if (!officialRepository) {
  console.error(
    "Usage: node scripts/company/gate-upstream-workflows.mjs [--check] owner/repository",
  );
  process.exit(1);
}

const workflowsDir = path.join(repoRoot, ".github/workflows");
const workflowFiles = fs
  .readdirSync(workflowsDir)
  .filter(
    (file) =>
      /\.ya?ml$/.test(file) &&
      file !== "company-ci.yml" &&
      file !== "company-ci.yaml",
  )
  .sort();
const failures = [];

function gateJob(lines, start, end, file) {
  const jobLines = lines.slice(start, end);
  const repositoryCheck = "github.repository ==";
  if (jobLines.some((line) => line.includes(repositoryCheck))) return;

  const ifOffset = jobLines.findIndex((line) => /^    if:\s*/.test(line));
  if (ifOffset === -1) {
    if (checkOnly) {
      failures.push(`${file}:${start + 1} is not gated`);
      return;
    }
    lines.splice(
      start + 1,
      0,
      `    if: github.repository == '${officialRepository}'`,
    );
    return 1;
  }

  if (checkOnly) {
    failures.push(`${file}:${start + 1} is not gated`);
    return;
  }

  const ifIndex = start + ifOffset;
  const match = lines[ifIndex].match(/^    if:\s*(.*)$/);
  const expression = match?.[1]?.trim() ?? "";
  if (expression === ">-" || expression === "|" || expression === ">") {
    lines.splice(
      ifIndex + 1,
      0,
      `      github.repository == '${officialRepository}' &&`,
    );
    return 1;
  }

  const wrapped =
    expression.match(/^\$\{\{\s*(.*?)\s*\}\}$/)?.[1] ?? expression;
  lines[ifIndex] =
    `    if: \${{ github.repository == '${officialRepository}' && (${wrapped}) }}`;
  return 0;
}

for (const file of workflowFiles) {
  const workflowPath = path.join(workflowsDir, file);
  const original = fs.readFileSync(workflowPath, "utf8");
  const lines = original.split("\n");
  const jobsIndex = lines.findIndex((line) => line === "jobs:");
  if (jobsIndex === -1) continue;

  let index = jobsIndex + 1;
  while (index < lines.length) {
    if (!/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) {
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < lines.length && !/^  [A-Za-z0-9_-]+:\s*$/.test(lines[end])) {
      end += 1;
    }
    const inserted = gateJob(lines, index, end, file) ?? 0;
    index = end + inserted;
  }

  const updated = lines.join("\n");
  if (!checkOnly && updated !== original)
    fs.writeFileSync(workflowPath, updated);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  checkOnly
    ? `All upstream workflows are gated to ${officialRepository}.`
    : `Gated upstream workflows to ${officialRepository}.`,
);
