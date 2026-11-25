export interface TemplateThemeColors {
  readonly name: string;
  readonly badge: string;
  readonly stat: string;
  readonly descLabel: string;
  readonly descContent: string;
}

export const TEMPLATE_THEME_COLORS: Record<string, TemplateThemeColors> = {
  banten: {
    name: "#000000",
    badge: "#000000",
    stat: "#000000",
    descLabel: "#000000",
    descContent: "#000000",
  },
  daha: {
    name: "#f5e897",
    badge: "#f5e897",
    stat: "#000000",
    descLabel: "#f5e897",
    descContent: "#000000",
  },
  demak: {
    name: "#c59a4e",
    badge: "#c59a4e",
    stat: "#c59a4e",
    descLabel: "#c59a4e",
    descContent: "#000000",
  },
  keta: {
    name: "#c59a4e",
    badge: "#c59a4e",
    stat: "#c59a4e",
    descLabel: "#c59a4e",
    descContent: "#000000",
  },
  majapahit: {
    name: "#c59a4e",
    badge: "#c59a4e",
    stat: "#c59a4e",
    descLabel: "#c59a4e",
    descContent: "#000000",
  },
  pajajaran: {
    name: "#7799c3",
    badge: "#7799c3",
    stat: "#7799c3",
    descLabel: "#7799c3",
    descContent: "#000000",
  },
  sadeng: {
    name: "#7b4109",
    badge: "#7b4109",
    stat: "#7b4109",
    descLabel: "#7b4109",
    descContent: "#000000",
  },
  portugis: {
    name: "#c59a4e",
    badge: "#c59a4e",
    stat: "#c59a4e",
    descLabel: "#c59a4e",
    descContent: "#000000",
  },
} as const;

export const DEFAULT_TEMPLATE_THEME_COLORS: TemplateThemeColors = TEMPLATE_THEME_COLORS.majapahit;

