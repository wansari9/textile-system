import {
  accents,
  fontSizes,
  uiFonts,
  type AccentId,
  type FontId,
  type FontSizeId,
} from '../design';
import { getSessionUser } from './session';

/**
 * Per-user UI preferences. Stored in this browser only (localStorage) and
 * applied by overriding the CSS custom properties generated from `design.ts`.
 */
export interface UiPreferences {
  accent: AccentId;
  fontSize: FontSizeId;
  font: FontId;
}

export const DEFAULT_PREFERENCES: UiPreferences = {
  accent: 'lime',
  fontSize: 'default',
  font: 'geist',
};

const STORAGE_PREFIX = 'amirtex.ui.prefs.v1.';
const FONT_LINK_PREFIX = 'amirtex-font-';

const isAccent = (value: unknown): value is AccentId =>
  typeof value === 'string' && value in accents;

const isFontSize = (value: unknown): value is FontSizeId =>
  typeof value === 'string' && value in fontSizes;

const isFont = (value: unknown): value is FontId =>
  typeof value === 'string' && value in uiFonts;

/** Drops unknown ids so an old or hand-edited cache can never break the UI. */
export const sanitizePreferences = (
  value: Partial<UiPreferences> | null | undefined
): UiPreferences => {
  const accent = value?.accent;
  const fontSize = value?.fontSize;
  const font = value?.font;
  return {
    accent: isAccent(accent) ? accent : DEFAULT_PREFERENCES.accent,
    fontSize: isFontSize(fontSize) ? fontSize : DEFAULT_PREFERENCES.fontSize,
    font: isFont(font) ? font : DEFAULT_PREFERENCES.font,
  };
};

const storageKey = (userId: number | string): string => `${STORAGE_PREFIX}${userId}`;

export const loadPreferences = (
  userId: number | string | null | undefined
): UiPreferences => {
  if (userId === null || userId === undefined) return { ...DEFAULT_PREFERENCES };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? sanitizePreferences(JSON.parse(raw)) : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

export const savePreferences = (
  userId: number | string | null | undefined,
  preferences: UiPreferences
): void => {
  if (userId === null || userId === undefined) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(sanitizePreferences(preferences)));
  } catch {
    // Private mode or a full quota: the theme still applies for this session.
  }
};

let activePreferences: UiPreferences = { ...DEFAULT_PREFERENCES };

/** Loads each font stylesheet once; the browser caches the actual font files. */
const ensureFontLink = (id: FontId, href: string | null): void => {
  if (!href || typeof document === 'undefined') return;
  const linkId = `${FONT_LINK_PREFIX}${id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

/** Loads every offered font so the Settings page can preview them. */
export const preloadFonts = (): void => {
  (Object.keys(uiFonts) as FontId[]).forEach((id) => ensureFontLink(id, uiFonts[id].href));
};

const setOrRemove = (name: string, value: string | null): void => {
  const style = document.documentElement.style;
  if (value === null) style.removeProperty(name);
  else style.setProperty(name, value);
};

/**
 * Applies preferences to the document. Default values remove the inline
 * overrides, so the generated theme from `design.ts` stays authoritative.
 */
export const applyPreferences = (preferences: UiPreferences): UiPreferences => {
  const safe = sanitizePreferences(preferences);
  activePreferences = safe;
  if (typeof document === 'undefined') return safe;

  const accent = accents[safe.accent];
  const isDefaultAccent = safe.accent === DEFAULT_PREFERENCES.accent;
  setOrRemove('--color-lime', isDefaultAccent ? null : accent.base);
  setOrRemove('--color-lime-soft', isDefaultAccent ? null : accent.soft);
  setOrRemove('--color-lime-deep', isDefaultAccent ? null : accent.deep);
  setOrRemove('--color-brand-light', isDefaultAccent ? null : accent.soft);

  const font = uiFonts[safe.font];
  const isDefaultFont = safe.font === DEFAULT_PREFERENCES.font;
  setOrRemove('--font-sans', isDefaultFont ? null : font.stack);
  setOrRemove('--font-family-sans', isDefaultFont ? null : font.stack);
  ensureFontLink(safe.font, font.href);

  const { scale } = fontSizes[safe.fontSize];
  if (scale === 100) document.documentElement.style.removeProperty('font-size');
  else document.documentElement.style.fontSize = `${scale}%`;

  return safe;
};

/** The preferences currently applied to this document. */
export const currentPreferences = (): UiPreferences => ({ ...activePreferences });

/** Accent colour for JavaScript consumers such as Recharts. */
export const getAccentHex = (): string => accents[activePreferences.accent].base;

/** Applies the signed-in user's cached preferences; defaults when signed out. */
export const applyStoredPreferences = (): UiPreferences => {
  const user = getSessionUser();
  return applyPreferences(loadPreferences(user?.id));
};

/** Restores defaults, saves them for the user and applies them immediately. */
export const resetPreferences = (
  userId: number | string | null | undefined
): UiPreferences => {
  const defaults = { ...DEFAULT_PREFERENCES };
  savePreferences(userId, defaults);
  return applyPreferences(defaults);
};
