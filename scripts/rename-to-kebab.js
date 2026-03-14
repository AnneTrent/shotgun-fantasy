/**
 * rename-to-kebab.js
 *
 * ONE-TIME MIGRATION SCRIPT
 * Renames existing feat JSON files to match the Everyday Heroes naming convention:
 *   Fighter_Training.json → fighter-training-0bd14153389b326e.json
 *
 * Rules:
 *   - Convert name to lowercase kebab-case (spaces and underscores become hyphens)
 *   - Strip special characters (commas, apostrophes, etc.)
 *   - Append the file's _id with a hyphen separator
 *   - Skip files that already follow the convention (name ends with -XXXXXXXXXXXXXXXX)
 *   - Skip _folder.json files
 *
 * Usage:
 *   node scripts/rename-to-kebab.js
 */

import { readdirSync, readFileSync, renameSync } from "fs";
import { join, extname, basename, dirname } from "path";

const SCAN_DIRS = [
  "src/feats",
  "src/archetypes-classes",
  "src/backgrounds-professions",
  "src/plans-tricks",
  "src/equipment",
];

// Matches files already in kebab-ID format: anything-XXXXXXXXXXXXXXXX.json
const ALREADY_KEBAB = /^.+-[A-Za-z0-9]{16}\.json$/;

function toKebab(str) {
  return str
    .toLowerCase()
    .replace(/[_\s]+/g, "-")        // underscores and spaces → hyphens
    .replace(/[^a-z0-9-]/g, "")     // strip everything else (commas, apostrophes, etc.)
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

function processFile(filePath) {
  const fileName = basename(filePath);

  // Skip _folder.json
  if (fileName.toLowerCase() === "_folder.json") return;

  // Skip if already in kebab-ID format
  if (ALREADY_KEBAB.test(fileName)) {
    console.log(`⏭️  Already kebab: ${fileName}`);
    return;
  }

  const raw = readFileSync(filePath, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn(`⚠️  Skipping ${filePath} — invalid JSON`);
    return;
  }

  if (!data._id) {
    console.warn(`⚠️  Skipping ${fileName} — no _id assigned yet, run build.js first`);
    return;
  }

  const kebabName = toKebab(data.name);
  const newFileName = `${kebabName}-${data._id}.json`;
  const newFilePath = join(dirname(filePath), newFileName);

  if (filePath === newFilePath) {
    console.log(`⏭️  No change needed: ${fileName}`);
    return;
  }

  renameSync(filePath, newFilePath);
  console.log(`✅ Renamed: ${fileName} → ${newFileName}`);
}

function scanDir(dir) {
  let files;
  try {
    files = readdirSync(dir, { withFileTypes: true });
  } catch {
    console.warn(`⚠️  Could not read directory: ${dir} — skipping`);
    return;
  }

  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name === "eh-reference") {
        console.log(`⏭️  Skipping reference folder: ${fullPath}`);
        continue;
      }
      scanDir(fullPath);
    } else if (extname(file.name) === ".json") {
      processFile(fullPath);
    }
  }
}

console.log("✏️  Renaming files to kebab-case-ID convention...\n");
for (const dir of SCAN_DIRS) {
  scanDir(dir);
}
console.log("\n✨ Done! Run node scripts/build.js to repack.");