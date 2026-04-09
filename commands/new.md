Create a new change directory with just the proposal template. Use this for step-by-step artifact creation.

**Input**: $ARGUMENTS — change name (kebab-case).

**Steps**

1. Create `changes/$ARGUMENTS/` directory.

2. Create `changes/$ARGUMENTS/proposal.md` with template:
   ```markdown
   # Proposal: $ARGUMENTS

   ## Why
   [Problem or opportunity — 1-2 sentences]

   ## What Changes
   - [Change 1]
   - [Change 2]

   ## Impact
   [Affected code, APIs, dependencies]
   ```

3. Git commit.

4. Tell the user: "Change created. Use /harness:continue to build the next artifact (specs, design, tasks), or edit proposal.md first."
