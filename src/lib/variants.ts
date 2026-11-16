import type { components } from '@/api/schema';

type Variant = components['schemas']['VariantOut'];
type OptionType = components['schemas']['OptionTypeOut'];

/**
 * The variant whose option values match every selected option, or null while
 * the shopper has not chosen one value per option type yet. A product with no
 * option types has a single variant.
 */
export function findVariant(
  variants: Variant[],
  selected: Record<string, string>,
  optionTypes: OptionType[],
): Variant | null {
  if (optionTypes.length === 0) return variants[0] ?? null;
  const chosen = optionTypes.map((type) => selected[type.id]);
  if (chosen.some((value) => !value)) return null;
  return variants.find((variant) => chosen.every((value) => variant.option_value_ids.includes(value))) ?? null;
}
