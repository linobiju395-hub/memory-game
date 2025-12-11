export interface CardData {
  id: string; // Unique ID for React keys
  pairId: number; // ID used to check for matches
  content: string; // Text or Image URL
  type: 'image' | 'text' | 'icon';
  isFlipped: boolean;
  isMatched: boolean;
  altText?: string; // For concept matching (e.g. "Paris" matches "France")
}

export interface GameState {
  cards: CardData[];
  flippedCards: CardData[];
  matchedCount: number;
  moves: number;
  timer: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isGenerating: boolean;
  difficulty: DifficultyLevel;
  mode: GameMode;
}

export type DifficultyLevel = 4 | 6 | 8; // Number of pairs

export enum GameMode {
  CLASSIC_IMAGE = 'CLASSIC_IMAGE',
  AI_THEME = 'AI_THEME',
}

export interface ThemePair {
  item1: string;
  item2: string;
}

export interface AIGenerationResponse {
  theme: string;
  pairs: ThemePair[];
}