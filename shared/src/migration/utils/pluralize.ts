/**
 * Collection name pluralization utilities
 */

/**
 * Special case pluralization rules
 * Maps singular forms to their plural forms
 */
const SPECIAL_CASES: Record<string, string> = {
  // Common irregular plurals
  person: "people",
  Person: "People",
  child: "children",
  Child: "Children",
  man: "men",
  Man: "Men",
  woman: "women",
  Woman: "Women",
  tooth: "teeth",
  Tooth: "Teeth",
  foot: "feet",
  Foot: "Feet",
  mouse: "mice",
  Mouse: "Mice",
  goose: "geese",
  Goose: "Geese",

  // Words ending in -y
  category: "categories",
  Category: "Categories",
  company: "companies",
  Company: "Companies",
  city: "cities",
  City: "Cities",
  country: "countries",
  Country: "Countries",
  story: "stories",
  Story: "Stories",
  party: "parties",
  Party: "Parties",
  family: "families",
  Family: "Families",
  activity: "activities",
  Activity: "Activities",
  priority: "priorities",
  Priority: "Priorities",

  // Words ending in -f or -fe
  life: "lives",
  Life: "Lives",
  wife: "wives",
  Wife: "Wives",
  knife: "knives",
  Knife: "Knives",
  leaf: "leaves",
  Leaf: "Leaves",
  shelf: "shelves",
  Shelf: "Shelves",
  half: "halves",
  Half: "Halves",

  // Words ending in -is
  analysis: "analyses",
  Analysis: "Analyses",
  basis: "bases",
  Basis: "Bases",
  crisis: "crises",
  Crisis: "Crises",
  thesis: "theses",
  Thesis: "Theses",

  // Words ending in -us
  cactus: "cacti",
  Cactus: "Cacti",
  focus: "foci",
  Focus: "Foci",
  fungus: "fungi",
  Fungus: "Fungi",
  nucleus: "nuclei",
  Nucleus: "Nuclei",
  radius: "radii",
  Radius: "Radii",

  // Words ending in -on
  phenomenon: "phenomena",
  Phenomenon: "Phenomena",
  criterion: "criteria",
  Criterion: "Criteria",

  // Words ending in -um
  datum: "data",
  Datum: "Data",
  medium: "media",
  Medium: "Media",
  curriculum: "curricula",
  Curriculum: "Curricula",

  // Unchanged plurals
  sheep: "sheep",
  Sheep: "Sheep",
  deer: "deer",
  Deer: "Deer",
  fish: "fish",
  Fish: "Fish",
  species: "species",
  Species: "Species",
  series: "series",
  Series: "Series",
};

/**
 * Pluralizes a singular noun to its plural form
 * Handles special cases and common English pluralization rules
 *
 * @param singular - The singular form of the noun
 * @returns The plural form of the noun
 */
export function pluralize(singular: string): string {
  // Check special cases first (before checking if already plural)
  if (SPECIAL_CASES[singular]) {
    return SPECIAL_CASES[singular];
  }

  // Check if it's already plural (ends with 's' and is longer than 3 chars)
  if (singular.length > 3 && singular.endsWith("s") && !singular.endsWith("ss")) {
    // Could already be plural, return as-is
    return singular;
  }

  // Preserve case for the transformation
  const isCapitalized = /^[A-Z]/.test(singular);
  const lowerSingular = singular.toLowerCase();

  let plural: string;

  // Rule 1: Words ending in -s, -ss, -sh, -ch, -x, -z -> add -es
  if (/(?:s|ss|sh|ch|x|z)$/.test(lowerSingular)) {
    plural = singular + "es";
  }
  // Rule 2: Words ending in consonant + y -> change y to ies
  else if (/[^aeiou]y$/.test(lowerSingular)) {
    plural = singular.slice(0, -1) + "ies";
  }
  // Rule 3: Words ending in consonant + o -> add -es
  else if (/[^aeiou]o$/.test(lowerSingular)) {
    plural = singular + "es";
  }
  // Rule 4: Words ending in -f or -fe -> change to -ves
  else if (/fe?$/.test(lowerSingular)) {
    if (lowerSingular.endsWith("fe")) {
      plural = singular.slice(0, -2) + "ves";
    } else {
      plural = singular.slice(0, -1) + "ves";
    }
  }
  // Rule 5: Default -> add -s
  else {
    plural = singular + "s";
  }

  return plural;
}

/**
 * Converts a singular entity name to a collection name
 * This is an alias for pluralize for better semantic clarity
 *
 * @param entityName - The singular entity name (e.g., "User", "Project")
 * @returns The collection name (e.g., "Users", "Projects")
 */
export function toCollectionName(entityName: string): string {
  return pluralize(entityName);
}

/**
 * Attempts to singularize a plural noun (reverse of pluralize)
 * Note: This is a best-effort implementation and may not handle all edge cases
 *
 * @param plural - The plural form of the noun
 * @returns The singular form of the noun
 */
export function singularize(plural: string): string {
  // Check reverse special cases
  for (const [singular, pluralForm] of Object.entries(SPECIAL_CASES)) {
    if (pluralForm === plural) {
      return singular;
    }
  }

  const lower = plural.toLowerCase();

  // Rule 1: Words ending in -ies -> change to -y
  if (lower.endsWith("ies") && plural.length > 3) {
    return plural.slice(0, -3) + "y";
  }

  // Rule 2: Words ending in -ves -> change to -f or -fe
  if (lower.endsWith("ves")) {
    // Try -fe first (more common)
    return plural.slice(0, -3) + "fe";
  }

  // Rule 3: Words ending in -ses, -shes, -ches, -xes, -zes -> remove -es
  if (/(?:ses|shes|ches|xes|zes)$/.test(lower)) {
    return plural.slice(0, -2);
  }

  // Rule 4: Words ending in -s -> remove -s
  if (lower.endsWith("s") && plural.length > 1) {
    return plural.slice(0, -1);
  }

  // Default: return as-is
  return plural;
}
