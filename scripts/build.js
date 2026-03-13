import { execSync } from "child_process";
import { createInterface } from "readline";

function run(command) {
  console.log(`\n▶ ${command}`);
  execSync(command, { stdio: "inherit" });
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function build() {
  console.log("🔨 Shotgun Fantasy Build Script\n");

  // Step 1 — Generate missing IDs
  console.log("📋 Step 1: Generating missing IDs...");
  run("node scripts/generate-ids.js");

  // Step 2 — Pack all compendiums
  console.log("\n📦 Step 2: Packing compendiums...");
  run('fvtt package pack feats --in "src/feats" --out "packs" -n feats');

  // Step 3 — Git commit and push
  console.log("\n📝 Step 3: Committing to GitHub...");
  const message = await prompt('Enter commit message (or press Enter to skip git): ');

  if (!message) {
    console.log("\n⏭️  Skipping git commit.");
  } else {
    run("git add -A");
    run(`git commit -m "${message}"`);
    run("git push");
    console.log("\n🚀 Pushed to GitHub!");
  }

  console.log("\n✨ Build complete!");
}

build().catch((err) => {
  console.error("\n❌ Build failed:", err.message);
  process.exit(1);
});