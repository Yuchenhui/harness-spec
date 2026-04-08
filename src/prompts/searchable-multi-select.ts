/**
 * Searchable Multi-Select Stub
 *
 * Minimal stub for the searchable multi-select prompt removed during extraction.
 */

interface SearchableMultiSelectOptions {
  message: string;
  pageSize?: number;
  choices: Array<{
    name: string;
    value: string;
    configured?: boolean;
    detected?: boolean;
    preSelected?: boolean;
  }>;
  validate?: (selected: string[]) => boolean | string;
}

/**
 * A searchable multi-select prompt (stub returns pre-selected choices).
 */
export async function searchableMultiSelect(
  options: SearchableMultiSelectOptions
): Promise<string[]> {
  return options.choices
    .filter((c) => c.preSelected)
    .map((c) => c.value);
}
