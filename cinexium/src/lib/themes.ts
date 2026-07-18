export type ThemeId =
  | 'default'
  | 'red'
  | 'neon-purple'
  | 'rose'
  | 'silver'
  | 'teal'
  | 'cherry-blossom'
  | 'emerald'
  | 'sapphire'
  | 'amber';

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  primary500: string;
  primary600: string;
  premiumOnly: boolean;
};

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  { id: 'default', name: 'Default', primary500: '#e50914', primary600: '#b20710', premiumOnly: false },
  { id: 'neon-purple', name: 'Neon Purple', primary500: '#a855f7', primary600: '#d946ef', premiumOnly: true },
  { id: 'red', name: 'Classic Red', primary500: '#e50914', primary600: '#b20710', premiumOnly: true },
  { id: 'rose', name: 'Rose', primary500: '#ec4899', primary600: '#db2777', premiumOnly: true },
  { id: 'silver', name: 'Silver', primary500: '#9ca3af', primary600: '#6b7280', premiumOnly: true },
  { id: 'teal', name: 'Teal', primary500: '#14b8a6', primary600: '#0f766e', premiumOnly: true },
  { id: 'cherry-blossom', name: 'Cherry Blossom', primary500: '#f472b6', primary600: '#ec4899', premiumOnly: true },
  { id: 'emerald', name: 'Emerald', primary500: '#10b981', primary600: '#059669', premiumOnly: true },
  { id: 'sapphire', name: 'Sapphire', primary500: '#3b82f6', primary600: '#2563eb', premiumOnly: true },
  { id: 'amber', name: 'Amber', primary500: '#f59e0b', primary600: '#d97706', premiumOnly: true },
];

export const VALID_THEME_IDS = THEME_DEFINITIONS.map((theme) => theme.id);

export function getThemeDefinition(themeId: string | null | undefined) {
  return THEME_DEFINITIONS.find((theme) => theme.id === themeId) ?? THEME_DEFINITIONS[0];
}
