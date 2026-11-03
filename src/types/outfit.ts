import type { Category, Occasion, Product, Season } from './product';

export type OutfitSlot = Extract<Category, 'outer' | 'top' | 'bottom' | 'shoes'>;

export interface OutfitRequest {
  baseProductId: Product['id'];
  totalBudget: number;
  occasion: Occasion;
  season?: Season;
}

export interface OutfitItem {
  slot: OutfitSlot;
  productId: Product['id'];
  locked: boolean;
}

export interface Outfit {
  id: string;
  items: OutfitItem[];
  totalPrice: number;
  reasons: string[];
  score: number;
}

export type OutfitResult =
  | { status: 'success'; outfits: Outfit[] }
  | { status: 'empty'; reason: 'budget' | 'season' | 'missing-category'; minimumBudget?: number; missingSlots?: OutfitSlot[] }
  | { status: 'invalid'; reason: 'missing-product' | 'unsupported-category' | 'invalid-budget' };

export type OutfitReplacement =
  | { status: 'success'; outfit: Outfit }
  | { status: 'unavailable' };

export interface OutfitDraft {
  budget: string;
  occasion: Occasion;
  season: Season | '';
}

export interface OutfitSession {
  version: 1;
  baseProductId: string;
  draft: OutfitDraft;
  submitted: OutfitRequest | null;
  result: OutfitResult | null;
}
