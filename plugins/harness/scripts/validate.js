#!/usr/bin/env node
// scripts/validate.js — Schema validation for harness-spec change artifacts
//
// Layer 1 of our hybrid compliance strategy:
//   - Layer 1 (this script): fast, deterministic, mechanical checks
//   - Layer 2 (spec-reviewer agent): slow, soft, content quality review
//
// Usage:
//   node validate.js <change-dir>
//   node validate.js <change-dir> --json
//   node validate.js harness/changes/add-user-auth       # canonical (v0.12+)
//   node validate.js changes/add-user-auth               # legacy (pre-v0.12)
//   node validate.js harness/changes/add-user-auth --json > report.json
//
// Exit codes:
//   0 — valid (0 errors; warnings allowed)
//   1 — invalid (1+ errors)
//   2 — usage error (bad args, change dir not found)
//
// Checks performed:
//   proposal.md
//     - file exists
//     - required sections: Classification, Why, What Changes, Impact, Alignment
//     - Classification value is one of Frontend/Backend/Full-stack/Infra/Cross-cutting
//     - conditional: Frontend|Full-stack → "User experience" section required
//     - conditional: Backend|Full-stack  → "API & data" section required
//     - warn on missing Specialist input / Research & references sections
//
//   specs.md
//     - file exists
//     - ≥1 "### Requirement:" section
//     - every Requirement has ≥1 "#### Scenario:"
//     - every Scenario has Given / When / Then
//     - warn on vague placeholder phrases ("valid data", "some input", etc.)
//     - warn on missing SHALL/MUST normative language
//
//   design.md (optional)
//     - if present: Context / Decisions sections required
//     - warn on missing Goals / Risks
//
//   tasks.md
//     - file exists
//     - ≥1 checkbox task "- [ ]" or "- [x]"
//     - warn on missing "## N." numbered groups
//
//   feature_tests.json (optional, may not exist before /harness:apply Phase 1)
//     - valid JSON
//     - "tasks" is array
//     - each task has: id, description, spec_scenarios, verification_commands,
//       verification_level, passes
//     - verification_level ∈ {L1,L2,L3,L4,L5}
//     - evaluation_rubric is array of {criterion, ...} (warn if missing)
//
//   cross-file references
//     - warn when feature_tests.json references spec_scenarios not found in specs.md

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// ---------- arg parsing ----------
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const positional = args.filter(a => !a.startsWith('--'));
const changeDir = positional[0];

if (!changeDir) {
  console.error('Usage: node validate.js <change-dir> [--json]');
  console.error('Example: node validate.js harness/changes/add-user-auth');
  process.exit(2);
}

if (!fs.existsSync(changeDir)) {
  console.error(`[validate] Change directory not found: ${changeDir}`);
  process.exit(2);
}

// ---------- state ----------
const errors = [];
const warnings = [];

function addError(file, rule, message) {
  errors.push({ file, rule, severity: 'error', message });
}
function addWarning(file, rule, message) {
  warnings.push({ file, rule, severity: 'warning', message });
}

function readFile(relPath) {
  const p = path.join(changeDir, relPath);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function hasSection(content, name) {
  // Matches "## Name" or "## Name: ..." at line start
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^##\\s+${escaped}(\\b|:|$)`, 'm').test(content);
}

// ---------- validators ----------

function validateProposal() {
  const content = readFile('proposal.md');
  if (content === null) {
    addError('proposal.md', 'file-exists', 'proposal.md is missing');
    return;
  }

  // Required sections
  const required = ['Classification', 'Why', 'What Changes', 'Impact', 'Alignment'];
  for (const section of required) {
    if (!hasSection(content, section)) {
      addError('proposal.md', 'required-section', `Missing "## ${section}" section`);
    }
  }

  // Classification value check
  const classMatch = content.match(/^## Classification\s*\n+([^\n#]+)/m);
  if (classMatch) {
    const raw = classMatch[1].replace(/[*_`]/g, '').trim().toLowerCase();
    const validKeywords = ['frontend', 'backend', 'full-stack', 'fullstack', 'infra', 'devops', 'cross-cutting'];
    const matched = validKeywords.filter(v => raw.includes(v));

    if (matched.length === 0) {
      addError('proposal.md', 'classification-value',
        `Classification value "${classMatch[1].trim()}" not recognized. Must contain one of: Frontend / Backend / Full-stack / Infra / Cross-cutting`);
    } else {
      // Conditional section requirements based on classification
      const isFrontendish = matched.includes('frontend') || matched.includes('full-stack') || matched.includes('fullstack');
      const isBackendish  = matched.includes('backend')  || matched.includes('full-stack') || matched.includes('fullstack');

      if (isFrontendish && !hasSection(content, 'User experience')) {
        addError('proposal.md', 'frontend-ux-section',
          'Frontend/Full-stack classification requires "## User experience" section (describe flow, error/empty/loading states, accessibility, responsive)');
      }
      if (isBackendish && !hasSection(content, 'API') && !hasSection(content, 'API & data') && !hasSection(content, 'API and data')) {
        addError('proposal.md', 'backend-api-section',
          'Backend/Full-stack classification requires "## API & data" section (contract, data model, auth/authz, performance, observability)');
      }
    }
  }

  // Recommended sections (warnings only)
  if (!hasSection(content, 'Specialist input')) {
    addWarning('proposal.md', 'specialist-input',
      'Missing "## Specialist input" section — Phase 1.5 Step C specialist agents should be summarized here');
  }
  if (!hasSection(content, 'Research') && !hasSection(content, 'Research & references')) {
    addWarning('proposal.md', 'research-section',
      'Missing "## Research & references" section — external sources found in Phase 0c should be cited here');
  }
  if (!hasSection(content, 'Open questions')) {
    addWarning('proposal.md', 'open-questions',
      'Missing "## Open questions" section — even "None" is a valid answer; this section documents decisions deferred to design/specs');
  }
}

function validateSpecs() {
  const content = readFile('specs.md');
  if (content === null) {
    addError('specs.md', 'file-exists', 'specs.md is missing');
    return;
  }

  const requirementHeaders = content.match(/^### Requirement:/gm) || [];
  if (requirementHeaders.length === 0) {
    addError('specs.md', 'has-requirement',
      'No "### Requirement:" sections found. specs.md must have at least one Requirement.');
    return;
  }

  // Split by requirement, skip the prelude
  const requirementBlocks = content.split(/^### Requirement:/m).slice(1);

  requirementBlocks.forEach((block, idx) => {
    const reqNum = idx + 1;
    const reqName = (block.split('\n')[0] || '').trim().replace(/[*_`]/g, '') || '(unnamed)';

    const scenarios = block.match(/^#### Scenario:/gm) || [];
    if (scenarios.length === 0) {
      addError('specs.md', 'requirement-has-scenario',
        `Requirement ${reqNum} "${reqName}" has no "#### Scenario:" subsection. Every Requirement must have at least one Scenario.`);
      return;
    }

    // Check each scenario has Given/When/Then
    const scenarioBlocks = block.split(/^#### Scenario:/m).slice(1);
    scenarioBlocks.forEach((sb, sidx) => {
      const sName = (sb.split('\n')[0] || '').trim().replace(/[*_`]/g, '') || '(unnamed)';
      const hasGiven = /\*\*Given\*\*/.test(sb);
      const hasWhen  = /\*\*When\*\*/.test(sb);
      const hasThen  = /\*\*Then\*\*/.test(sb);

      const missing = [];
      if (!hasGiven) missing.push('Given');
      if (!hasWhen)  missing.push('When');
      if (!hasThen)  missing.push('Then');

      if (missing.length > 0) {
        addError('specs.md', 'scenario-gwt',
          `Requirement ${reqNum} "${reqName}" Scenario ${sidx + 1} "${sName}": missing ${missing.join(' / ')} line(s). Scenarios must use **Given** / **When** / **Then** format.`);
      }

      // Vague placeholder detection (warning only)
      const placeholders = ['valid data', 'valid input', 'some input', 'some data', 'test data', 'appropriate data'];
      for (const ph of placeholders) {
        if (sb.toLowerCase().includes(ph)) {
          addWarning('specs.md', 'specific-values',
            `Requirement ${reqNum} Scenario "${sName}" contains vague phrase "${ph}" — use concrete values like 'test@example.com', 201, {"user_id": 42}`);
          break;
        }
      }
    });
  });

  // Normative language warning
  if (!/\b(SHALL|MUST|SHOULD NOT|MUST NOT)\b/.test(content)) {
    addWarning('specs.md', 'normative-language',
      'No SHALL/MUST/SHOULD normative language found. Specs should use RFC 2119 style normative keywords for requirements.');
  }
}

function validateDesign() {
  const content = readFile('design.md');
  if (content === null) return; // optional file, not an error

  const required = ['Context', 'Decisions'];
  for (const section of required) {
    if (!hasSection(content, section)) {
      addError('design.md', 'required-section',
        `Missing "## ${section}" section`);
    }
  }

  const recommended = ['Goals', 'Risks'];
  for (const section of recommended) {
    if (!hasSection(content, section)) {
      addWarning('design.md', 'recommended-section',
        `Missing recommended "## ${section}" section`);
    }
  }
}

function validateTasks() {
  const content = readFile('tasks.md');
  if (content === null) {
    addError('tasks.md', 'file-exists', 'tasks.md is missing');
    return;
  }

  const checkboxes = content.match(/^- \[[ xX]\]/gm) || [];
  if (checkboxes.length === 0) {
    addError('tasks.md', 'has-tasks',
      'No checkbox tasks found. Tasks must use "- [ ] Task description" format.');
  }

  const groups = content.match(/^## \d+\./gm) || [];
  if (groups.length === 0) {
    addWarning('tasks.md', 'has-groups',
      'No numbered groups found (e.g. "## 1. Setup"). Organize tasks into groups for clarity.');
  }
}

function validateFeatureTests() {
  const content = readFile('feature_tests.json');
  if (content === null) return; // optional — may not exist until /harness:apply Phase 1

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    addError('feature_tests.json', 'valid-json', `JSON parse error: ${e.message}`);
    return;
  }

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    addError('feature_tests.json', 'tasks-array',
      'Missing or non-array "tasks" field. Must be: { "tasks": [...] }');
    return;
  }

  const validLevels = ['L1', 'L2', 'L3', 'L4', 'L5'];
  const requiredFields = ['id', 'description', 'spec_scenarios', 'verification_commands', 'verification_level', 'passes'];

  parsed.tasks.forEach((task, i) => {
    const ref = `tasks[${i}]`;

    for (const field of requiredFields) {
      if (!(field in task)) {
        addError('feature_tests.json', 'task-required-field',
          `${ref} (${task.id || '?'}): missing required field "${field}"`);
      }
    }

    if (task.verification_level && !validLevels.includes(task.verification_level)) {
      addError('feature_tests.json', 'verification-level',
        `${ref} (${task.id || '?'}): verification_level "${task.verification_level}" not in ${validLevels.join(' / ')}`);
    }

    if (Array.isArray(task.spec_scenarios) && task.spec_scenarios.length === 0) {
      addWarning('feature_tests.json', 'spec-scenarios-empty',
        `${ref} (${task.id || '?'}): spec_scenarios is empty — task has no traceability back to specs`);
    }

    if (Array.isArray(task.verification_commands) && task.verification_commands.length === 0) {
      addError('feature_tests.json', 'verification-commands-empty',
        `${ref} (${task.id || '?'}): verification_commands is empty — evaluator has nothing to run`);
    }

    // Rubric check (Layer 1 compliance for v0.9.0 rubric-driven evaluation)
    if ('evaluation_rubric' in task) {
      if (!Array.isArray(task.evaluation_rubric)) {
        addError('feature_tests.json', 'rubric-is-array',
          `${ref} (${task.id || '?'}): evaluation_rubric must be an array`);
      } else if (task.evaluation_rubric.length === 0) {
        addWarning('feature_tests.json', 'rubric-empty',
          `${ref} (${task.id || '?'}): evaluation_rubric is empty — evaluator will fall back to generic 0-5 scale`);
      } else {
        task.evaluation_rubric.forEach((crit, j) => {
          if (typeof crit !== 'object' || !crit.criterion) {
            addError('feature_tests.json', 'rubric-criterion-shape',
              `${ref}.evaluation_rubric[${j}]: must be object with "criterion" field`);
          }
        });
      }
    } else {
      addWarning('feature_tests.json', 'has-rubric',
        `${ref} (${task.id || '?'}): no evaluation_rubric field — initializer should generate one (see agents/initializer.md)`);
    }
  });
}

function validateCrossRefs() {
  const specs = readFile('specs.md');
  const ft = readFile('feature_tests.json');
  if (!specs || !ft) return;

  // Extract scenario names from specs.md
  const scenarioNames = (specs.match(/^#### Scenario:\s*(.+)$/gm) || [])
    .map(line => line.replace(/^#### Scenario:\s*/, '').trim().replace(/[*_`]/g, ''));

  if (scenarioNames.length === 0) return;

  let parsed;
  try {
    parsed = JSON.parse(ft);
  } catch (e) {
    return; // JSON already caught by validateFeatureTests
  }

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) return;

  for (const task of parsed.tasks) {
    if (!Array.isArray(task.spec_scenarios)) continue;

    for (const refScenario of task.spec_scenarios) {
      // Fuzzy match: scenario name appears in task's spec_scenarios string, or vice versa
      const refLower = refScenario.toLowerCase();
      const found = scenarioNames.some(name => {
        const nameLower = name.toLowerCase();
        return refLower.includes(nameLower) || nameLower.includes(refLower);
      });

      if (!found) {
        const truncated = refScenario.length > 60 ? refScenario.slice(0, 60) + '…' : refScenario;
        addWarning('feature_tests.json', 'scenario-cross-ref',
          `Task "${task.id || '?'}" references spec_scenario "${truncated}" which has no matching Scenario name in specs.md`);
      }
    }
  }
}

// ---------- run all ----------
validateProposal();
validateSpecs();
validateDesign();
validateTasks();
validateFeatureTests();
validateCrossRefs();

const result = {
  valid: errors.length === 0,
  change_dir: changeDir,
  summary: `${errors.length} error${errors.length !== 1 ? 's' : ''}, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`,
  errors,
  warnings
};

// ---------- output ----------
if (jsonOutput) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else {
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✓ ${changeDir}: all checks passed`);
  } else {
    console.log(`\n${changeDir}: ${result.summary}\n`);
    if (errors.length > 0) {
      console.log('ERRORS (must fix):');
      for (const e of errors) {
        console.log(`  ✘ [${e.file}] ${e.rule}`);
        console.log(`     ${e.message}`);
      }
    }
    if (warnings.length > 0) {
      if (errors.length > 0) console.log('');
      console.log('WARNINGS (should fix):');
      for (const w of warnings) {
        console.log(`  ⚠ [${w.file}] ${w.rule}`);
        console.log(`     ${w.message}`);
      }
    }
  }
}

process.exit(result.valid ? 0 : 1);
