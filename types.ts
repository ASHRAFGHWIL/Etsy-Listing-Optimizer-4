// FIX: Removed self-import of GroundingChunk.
export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Keyword {
  keyword: string;
  volume: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface PricingSuggestion {
  tier: 'Budget' | 'Standard' | 'Premium';
  price: number;
  currency: 'USD';
  reason: string;
}

export interface ChecklistItem {
  element: string;
  instruction: string;
}

export interface ListingData {
  title: string;
  description: string;
  keywords: Keyword[];
  category: string;
  materials: string[];
  attributes: Record<string, string>;
  colors: string[];
  storeSections: string[];
  pricingSuggestions: PricingSuggestion[];
  checklist: ChecklistItem[];
  sources?: GroundingChunk[];
}