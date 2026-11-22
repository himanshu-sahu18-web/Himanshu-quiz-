export type ScreenId =
  | 'intro'
  | 'home'
  | 'category'
  | 'points'
  | 'mode'
  | 'ai-question'
  | 'saved-questions'
  | 'question-spinner'
  | 'scoreboard'
  | 'results';

export type CategoryId =
  | 'geography'
  | 'bollywood'
  | 'science'
  | 'general-knowledge'
  | 'sports-games';

export type PointLevel =
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 1000;

export type GameModeId =
  | 'ai-questions'
  | 'saved-questions'
  | 'question-spinner';

export type DifficultyTier =
  | 'Easy'
  | 'Moderate'
  | 'Difficult'
  | 'Expert';

export type ModalId = 'rules' | 'settings' | null;

export interface CategoryConfig {
  id: CategoryId;
  name: string;
  tagline: string;
  description: string;
  iconKey: 'globe' | 'film' | 'atom' | 'brain' | 'trophy';
  accentColor: string;
  secondaryColor: string;
  glowClass: string;
  borderHoverClass: string;
  iconBgClass: string;
  textAccentClass: string;
  ringClass: string;
}

export interface PointLevelConfig {
  value: PointLevel;
  tier: DifficultyTier;
  label: string;
}

export interface GameModeConfig {
  id: GameModeId;
  screenId: Extract<ScreenId, 'ai-question' | 'saved-questions' | 'question-spinner'>;
  name: string;
  subtitle: string;
  description: string;
  questionCountLabel: string;
  stageLabel: string;
  iconKey: 'bot' | 'bookmark' | 'disc';
  accentClass: string;
  borderClass: string;
  iconBgClass: string;
}

export interface AiGeneratedQuestion {
  category: string;
  points: PointLevel;
  difficulty: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  questionId: string;
}

export interface SavedQuestion {
  questionId: string;
  categoryId: CategoryId;
  category: string;
  points: PointLevel;
  difficulty: DifficultyTier;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
}

export interface AiQuestionHistoryItem {
  questionId: string;
  categoryId: CategoryId;
  category: string;
  points: PointLevel;
  difficulty: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  answeredAt: number;
}

export interface QuizAppState {
  currentScreen: ScreenId;
  previousScreen: ScreenId | null;
  selectedCategory: CategoryId | null;
  selectedPoints: PointLevel | null;
  selectedMode: GameModeId | null;
  activeSavedSlot: number;
  spinnerRotationDeg: number;
  selectedSpinnerSegment: number | null;
  aiQuestionHistory: AiQuestionHistoryItem[];
  soundEnabled: boolean;
  reducedMotion: boolean;
  activeModal: ModalId;
}

export type QuizAction =
  | { type: 'ENTER_APP' }
  | { type: 'REPLAY_INTRO' }
  | { type: 'NAVIGATE'; screen: ScreenId }
  | { type: 'SELECT_CATEGORY'; category: CategoryId; advance?: boolean }
  | { type: 'SELECT_POINTS'; points: PointLevel; advance?: boolean }
  | { type: 'SELECT_MODE'; mode: GameModeId; advance?: boolean }
  | { type: 'SET_SAVED_SLOT'; slot: number }
  | { type: 'SPIN_WHEEL'; deltaDeg: number; targetSegment: number }
  | { type: 'RECORD_AI_ANSWER'; entry: AiQuestionHistoryItem }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_REDUCED_MOTION' }
  | { type: 'OPEN_MODAL'; modal: Exclude<ModalId, null> }
  | { type: 'CLOSE_MODAL' }
  | { type: 'GO_BACK' }
  | { type: 'RESET_SETUP' };
