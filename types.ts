

export enum AppView {
  DAILY = 'DAILY', // Daily energy check
  READING = 'READING', // New Reading workflow
  HISTORY = 'HISTORY', // Archive of readings
}

export interface TarotCard {
  id?: number | string;
  name: string;
  nameEn: string; // English name for image mapping
  isReversed: boolean;
  meaning?: string; // Short meaning for this context
  position?: string; // The position in the spread (e.g., "Past", "Obstacle")
}

export interface SpreadPosition {
  id: number;
  name: string;
  description: string;
  x: number; // X coordinate percentage (0-100)
  y: number; // Y coordinate percentage (0-100)
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type FeedbackType = 'accurate' | 'confused' | 'comforted' | null;

export interface TarotReadingSession {
  id: string;
  date: number;
  question: string;
  spreadId: string;
  spreadName: string;
  cards: TarotCard[]; // Array of cards drawn
  interpretation: string; // The main AI response
  chatHistory: ChatMessage[]; // Follow-up questions
  feedback: FeedbackType;
}

export type TarotReading = TarotReadingSession;

export interface DailyPractice {
  energyStatus: string;
  todaysAffirmation: string;
  actionStep: string;
}

export interface DailyRecord {
  date: number; // timestamp
  reading: {
    cards: TarotCard[];
    guidance: string;
  };
  practice?: DailyPractice;
}

export interface Wish {
    id: string;
    content: string;
    affirmations: {
        type: 'conscious' | 'subconscious' | 'future';
        text: string;
    }[];
    createdAt?: number;
}

export interface JournalEntry {
    id: string;
    date: number;
    content: string;
    aiAnalysis?: {
        emotionalState: string | string[];
        blocksIdentified?: string[];
        highSelfTraits?: string[];
        summary: string;
        tomorrowsAdvice: string;
    };
}