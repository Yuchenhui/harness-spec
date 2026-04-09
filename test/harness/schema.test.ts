/**
 * Harness-Driven Schema Tests
 *
 * Validates the harness-driven/schema.yaml:
 * - Parses correctly
 * - Contains all expected artifacts
 * - Dependency declarations are correct (review requires [specs], apply requires [init-tests])
 * - No circular dependencies in the artifact DAG
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Load schema once
// ---------------------------------------------------------------------------

interface Artifact {
  id: string;
  generates: string;
  description: string;
  template?: string;
  instruction?: string;
  requires?: string[];
}

interface SchemaFile {
  name: string;
  version: number;
  description: string;
  artifacts: Artifact[];
  apply?: {
    requires: string[];
    tracks: string;
    instruction: string;
  };
}

const schemaPath = path.resolve(__dirname, '../../schemas/harness-driven/schema.yaml');

describe('harness-driven schema', () => {
  let schema: SchemaFile;

  beforeAll(() => {
    const raw = fs.readFileSync(schemaPath, 'utf8');
    schema = parseYaml(raw) as SchemaFile;
  });

  // ---------- Basic parsing ----------

  describe('parsing', () => {
    it('should load and parse as valid YAML', () => {
      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    });

    it('should have a name field', () => {
      expect(schema.name).toBe('harness-driven');
    });

    it('should have a version field', () => {
      expect(schema.version).toBe(1);
    });

    it('should have a description', () => {
      expect(typeof schema.description).toBe('string');
      expect(schema.description.length).toBeGreaterThan(0);
    });
  });

  // ---------- Expected artifacts ----------

  describe('artifacts', () => {
    const expectedArtifacts = ['proposal', 'specs', 'design', 'review', 'tasks', 'init-tests'];

    it('should contain all expected artifact IDs', () => {
      const ids = schema.artifacts.map((a) => a.id);
      for (const expected of expectedArtifacts) {
        expect(ids).toContain(expected);
      }
    });

    it('should have at least 6 artifacts', () => {
      expect(schema.artifacts.length).toBeGreaterThanOrEqual(6);
    });

    it('each artifact should have an id, generates, and description', () => {
      for (const artifact of schema.artifacts) {
        expect(artifact.id).toBeDefined();
        expect(typeof artifact.id).toBe('string');
        expect(artifact.generates).toBeDefined();
        expect(artifact.description).toBeDefined();
      }
    });
  });

  // ---------- Dependency declarations ----------

  describe('dependency declarations', () => {
    it('proposal should have no requirements', () => {
      const proposal = schema.artifacts.find((a) => a.id === 'proposal');
      expect(proposal).toBeDefined();
      expect(proposal!.requires ?? []).toEqual([]);
    });

    it('specs should require [proposal]', () => {
      const specs = schema.artifacts.find((a) => a.id === 'specs');
      expect(specs).toBeDefined();
      expect(specs!.requires).toEqual(['proposal']);
    });

    it('design should require [proposal] (not specs)', () => {
      const design = schema.artifacts.find((a) => a.id === 'design');
      expect(design).toBeDefined();
      expect(design!.requires).toEqual(['proposal']);
    });

    it('review should require [specs] — design is optional', () => {
      const review = schema.artifacts.find((a) => a.id === 'review');
      expect(review).toBeDefined();
      expect(review!.requires).toEqual(['specs']);
      // Explicitly NOT [specs, design] — design is optional
      expect(review!.requires).not.toContain('design');
    });

    it('tasks should require [review]', () => {
      const tasks = schema.artifacts.find((a) => a.id === 'tasks');
      expect(tasks).toBeDefined();
      expect(tasks!.requires).toEqual(['review']);
    });

    it('init-tests should require [tasks, review]', () => {
      const initTests = schema.artifacts.find((a) => a.id === 'init-tests');
      expect(initTests).toBeDefined();
      expect(initTests!.requires).toContain('tasks');
      expect(initTests!.requires).toContain('review');
    });

    it('apply should require [init-tests]', () => {
      expect(schema.apply).toBeDefined();
      expect(schema.apply!.requires).toEqual(['init-tests']);
    });
  });

  // ---------- No circular dependencies ----------

  describe('DAG validation (no circular dependencies)', () => {
    it('should have no cycles in the artifact dependency graph', () => {
      const artifactMap = new Map<string, string[]>();
      for (const artifact of schema.artifacts) {
        artifactMap.set(artifact.id, artifact.requires ?? []);
      }

      // Add apply as a pseudo-node if present
      if (schema.apply) {
        artifactMap.set('apply', schema.apply.requires);
      }

      // Kahn's algorithm for topological sort — detects cycles
      const inDegree = new Map<string, number>();
      for (const id of artifactMap.keys()) {
        if (!inDegree.has(id)) inDegree.set(id, 0);
      }
      for (const [, deps] of artifactMap) {
        for (const dep of deps) {
          // Only count edges to known nodes
          if (artifactMap.has(dep)) {
            // dep is a prerequisite — the node that lists it has an incoming edge
          }
        }
      }

      // Build adjacency list (prerequisite → dependent)
      const adj = new Map<string, string[]>();
      for (const id of artifactMap.keys()) {
        adj.set(id, []);
      }
      for (const [id, deps] of artifactMap) {
        for (const dep of deps) {
          if (adj.has(dep)) {
            adj.get(dep)!.push(id);
          }
        }
      }

      // Compute in-degrees
      for (const id of artifactMap.keys()) {
        inDegree.set(id, 0);
      }
      for (const [, neighbors] of adj) {
        for (const n of neighbors) {
          inDegree.set(n, (inDegree.get(n) ?? 0) + 1);
        }
      }

      // BFS
      const queue: string[] = [];
      for (const [id, deg] of inDegree) {
        if (deg === 0) queue.push(id);
      }

      let processed = 0;
      while (queue.length > 0) {
        const node = queue.shift()!;
        processed++;
        for (const neighbor of adj.get(node) ?? []) {
          const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
          inDegree.set(neighbor, newDeg);
          if (newDeg === 0) queue.push(neighbor);
        }
      }

      expect(processed).toBe(artifactMap.size);
    });

    it('all dependency references should point to existing artifacts', () => {
      const ids = new Set(schema.artifacts.map((a) => a.id));
      for (const artifact of schema.artifacts) {
        for (const dep of artifact.requires ?? []) {
          expect(ids.has(dep)).toBe(true);
        }
      }
      if (schema.apply) {
        for (const dep of schema.apply.requires) {
          expect(ids.has(dep)).toBe(true);
        }
      }
    });
  });
});
