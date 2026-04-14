#!/usr/bin/env node
// scripts/merge-specs.js — Merge a change's specs.md into harness/specs/ baseline
//
// Used by /harness:archive when the user chooses to sync baseline at archive time.
// This is the Level 1 baseline mechanism — simple capability-aware merge, no delta
// syntax. Each Requirement is identified by its name (### Requirement: <name>);
// existing Requirements are replaced, new ones are appended.
//
// Usage:
//   node merge-specs.js <change-specs.md> --baseline-dir <dir> [--dry-run] [--json]
//   node merge-specs.js harness/changes/add-rate-limiting/specs.md --baseline-dir harness/specs
//   node merge-specs.js harness/changes/add-rate-limiting/specs.md --baseline-dir harness/specs --dry-run
//
// Exit codes:
//   0 — merge completed (or dry-run showed what would happen)
//   1 — merge conflict or error requiring user attention
//   2 — usage error (bad args, missing files)
//
// What this script does:
//   1. Parse the change's specs.md into Requirements, grouped by capability
//      - Form A: top-level "**Capability**: <name>" → all Requirements belong to it
//      - Form B: "## Capability: <name>" section headers → Requirements under each
//   2. For each capability:
//      a. Open harness/specs/<capability>.md (create if missing)
//      b. Parse its existing Requirements
//      c. Merge:
//         - Requirement with same name in baseline → REPLACE
//         - Requirement not in baseline            → APPEND
//         - Requirement only in baseline           → KEEP AS-IS (no removal in Level 1)
//      d. Write the merged file
//   3. Report per-capability counts: added, replaced, untouched
//
// Limitations (Level 1):
//   - No REMOVED semantics. If a change needs to drop a Requirement from baseline,
//     the user edits the baseline file manually after the merge.
//   - Requirement "name" is whatever follows "### Requirement:" on the same line,
//     trimmed. Two Requirements with the same name in different places collide.
//   - No frontmatter / ordering guarantees beyond "new appends to end".

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// ---------- arg parsing ----------
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const dryRun = args.includes('--dry-run');
const positional = args.filter(a => !a.startsWith('--'));
const changeSpecsPath = positional[0];
const baselineDirIdx = args.indexOf('--baseline-dir');
const baselineDir = baselineDirIdx >= 0 ? args[baselineDirIdx + 1] : null;

if (!changeSpecsPath || !baselineDir) {
  console.error('Usage: node merge-specs.js <change-specs.md> --baseline-dir <dir> [--dry-run] [--json]');
  console.error('Example: node merge-specs.js harness/changes/add-rate-limiting/specs.md --baseline-dir harness/specs');
  process.exit(2);
}

if (!fs.existsSync(changeSpecsPath)) {
  console.error(`[merge-specs] Change specs file not found: ${changeSpecsPath}`);
  process.exit(2);
}

// baselineDir may not exist yet (fresh project, first-ever archive sync).
// Create it on demand unless dry-run.
if (!fs.existsSync(baselineDir)) {
  if (dryRun) {
    // Pretend-create for dry-run output purposes
  } else {
    fs.mkdirSync(baselineDir, { recursive: true });
  }
}

// ---------- parsing ----------

/**
 * Parse a specs.md into { capability → [Requirement, ...] }
 *
 * Form A: "**Capability**: <name>" near top → all Requirements go under that capability
 * Form B: "## Capability: <name>" section headers → Requirements grouped under each header
 *
 * A Requirement is everything from "### Requirement: <name>" up to (but not including)
 * the next "### Requirement:" OR "## " heading OR EOF.
 */
function parseSpecs(content, sourcePath) {
  const result = {}; // { capability: { name → rawText } }

  const singleCapMatch = content.match(/^\*\*Capability\*\*:\s*([^\n]+)$/m);
  const multiCapRegex = /^## Capability:\s*([^\n]+)$/gm;
  const multiMatches = [...content.matchAll(multiCapRegex)];

  if (!singleCapMatch && multiMatches.length === 0) {
    throw new Error(`${sourcePath} has no Capability metadata. Cannot merge. Add "**Capability**: <name>" or "## Capability: <name>" headers.`);
  }
  if (singleCapMatch && multiMatches.length > 0) {
    throw new Error(`${sourcePath} mixes single-capability ("**Capability**:") and multi-capability ("## Capability:") forms. Use one or the other, not both.`);
  }

  if (singleCapMatch) {
    const cap = singleCapMatch[1].replace(/[*_`]/g, '').trim();
    result[cap] = parseRequirementsFromBlock(content);
  } else {
    // Multi-capability form — split content on "## Capability:" headers
    for (let i = 0; i < multiMatches.length; i++) {
      const match = multiMatches[i];
      const cap = match[1].replace(/[*_`]/g, '').trim();
      const startIdx = match.index + match[0].length;
      const endIdx = i + 1 < multiMatches.length ? multiMatches[i + 1].index : content.length;
      const block = content.slice(startIdx, endIdx);
      result[cap] = parseRequirementsFromBlock(block);
    }
  }

  return result;
}

/**
 * Parse Requirements out of a block of markdown.
 * Returns { requirementName → fullBlockText }
 */
function parseRequirementsFromBlock(block) {
  const reqs = {};
  const reqHeaderRegex = /^### Requirement:\s*([^\n]+)$/gm;
  const matches = [...block.matchAll(reqHeaderRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const name = match[1].replace(/[*_`]/g, '').trim();
    const startIdx = match.index;
    // End at next "### Requirement:" or next "## " top-level section or EOF
    let endIdx = block.length;
    if (i + 1 < matches.length) {
      endIdx = matches[i + 1].index;
    } else {
      // Look for next "## " heading after this one
      const tailSearch = block.slice(startIdx + match[0].length);
      const nextTopSection = tailSearch.search(/^## /m);
      if (nextTopSection >= 0) {
        endIdx = startIdx + match[0].length + nextTopSection;
      }
    }
    reqs[name] = block.slice(startIdx, endIdx).trimEnd();
  }

  return reqs;
}

/**
 * Read a baseline file for a capability. Returns empty object if file doesn't exist.
 */
function readBaseline(capability) {
  const filePath = path.join(baselineDir, `${capability}.md`);
  if (!fs.existsSync(filePath)) {
    return { exists: false, filePath, header: `# ${capability}\n\n`, requirements: {} };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  // Extract any leading content before the first "### Requirement:" as "header"
  const firstReq = content.search(/^### Requirement:/m);
  const header = firstReq >= 0 ? content.slice(0, firstReq) : content;
  const requirements = parseRequirementsFromBlock(content);
  return { exists: true, filePath, header, requirements };
}

/**
 * Merge change Requirements into baseline Requirements.
 * Returns { merged: {name → text}, added: [...], replaced: [...], untouched: [...] }
 */
function mergeRequirements(baselineReqs, changeReqs) {
  const merged = { ...baselineReqs };
  const added = [];
  const replaced = [];
  const untouched = Object.keys(baselineReqs).filter(name => !(name in changeReqs));

  for (const [name, text] of Object.entries(changeReqs)) {
    if (name in baselineReqs) {
      replaced.push(name);
    } else {
      added.push(name);
    }
    merged[name] = text;
  }

  return { merged, added, replaced, untouched };
}

/**
 * Serialize a merged { name → text } back into a markdown file.
 * Preserves baseline header, orders Requirements as: baseline order first (with
 * replacements in place), then newly added ones at the end.
 */
function serialize(header, baselineReqs, merged, added) {
  let out = header;
  if (!out.endsWith('\n\n')) {
    out = out.replace(/\n*$/, '\n\n');
  }

  // Baseline order: iterate original baseline keys, emit merged version (which
  // may be a replacement or the same original text)
  for (const name of Object.keys(baselineReqs)) {
    out += merged[name] + '\n\n';
  }

  // Then newly added ones in the order they appear in change
  for (const name of added) {
    out += merged[name] + '\n\n';
  }

  return out.trimEnd() + '\n';
}

// ---------- main ----------

const changeContent = fs.readFileSync(changeSpecsPath, 'utf8');
let parsedChange;
try {
  parsedChange = parseSpecs(changeContent, changeSpecsPath);
} catch (e) {
  console.error(`[merge-specs] ${e.message}`);
  process.exit(2);
}

const perCapabilityReport = {};
const touchedFiles = [];

for (const [capability, changeReqs] of Object.entries(parsedChange)) {
  const baseline = readBaseline(capability);
  const result = mergeRequirements(baseline.requirements, changeReqs);

  perCapabilityReport[capability] = {
    file: baseline.filePath,
    baseline_existed: baseline.exists,
    added: result.added,
    replaced: result.replaced,
    untouched: result.untouched.length
  };

  if (!dryRun) {
    const output = serialize(baseline.header, baseline.requirements, result.merged, result.added);
    fs.writeFileSync(baseline.filePath, output);
    touchedFiles.push(baseline.filePath);
  }
}

// ---------- output ----------

const report = {
  dry_run: dryRun,
  change_specs: changeSpecsPath,
  baseline_dir: baselineDir,
  capabilities: perCapabilityReport,
  files_written: dryRun ? [] : touchedFiles
};

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(dryRun ? 'DRY RUN — no files written\n' : 'Merged:\n');
  for (const [cap, r] of Object.entries(perCapabilityReport)) {
    const action = r.baseline_existed ? 'updating' : 'creating';
    console.log(`  ${cap} (${action} ${r.file}):`);
    if (r.added.length > 0) {
      console.log(`    + added ${r.added.length}: ${r.added.join(', ')}`);
    }
    if (r.replaced.length > 0) {
      console.log(`    ~ replaced ${r.replaced.length}: ${r.replaced.join(', ')}`);
    }
    if (r.untouched > 0) {
      console.log(`    = ${r.untouched} existing baseline Requirement(s) kept as-is`);
    }
    if (r.added.length === 0 && r.replaced.length === 0) {
      console.log(`    (no changes — change specs contained no Requirements for this capability)`);
    }
  }
  if (!dryRun && touchedFiles.length > 0) {
    console.log(`\nFiles written:\n${touchedFiles.map(f => '  ' + f).join('\n')}`);
  }
}

process.exit(0);
