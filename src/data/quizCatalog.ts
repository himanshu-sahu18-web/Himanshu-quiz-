import type {
  CategoryConfig,
  CategoryId,
  GameModeConfig,
  GameModeId,
  PointLevel,
  PointLevelConfig,
  ScreenId,
} from '../types/quiz';

export const QUIZ_CATEGORIES: readonly CategoryConfig[] = [
  {
    id: 'geography',
    name: 'Geography',
    tagline: 'Capitals, borders & landforms',
    description:
      'Traverse continents, oceans, mountain ranges, and sovereign capitals across the globe.',
    iconKey: 'globe',
    accentColor: '#22D3EE',
    secondaryColor: '#0EA5E9',
    glowClass: 'hover:shadow-[0_14px_38px_-10px_rgba(34,211,238,0.36)]',
    borderHoverClass: 'hover:border-cyan-400/60',
    iconBgClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/35',
    textAccentClass: 'text-cyan-300',
    ringClass: 'ring-cyan-400/60 border-cyan-400/80',
  },
  {
    id: 'bollywood',
    name: 'Bollywood',
    tagline: 'Cinema, music & iconic dialogues',
    description:
      'From golden-era classics and chart-topping soundtracks to modern blockbusters and filmmakers.',
    iconKey: 'film',
    accentColor: '#A78BFA',
    secondaryColor: '#8B5CF6',
    glowClass: 'hover:shadow-[0_14px_38px_-10px_rgba(167,139,250,0.38)]',
    borderHoverClass: 'hover:border-violet-400/60',
    iconBgClass: 'bg-violet-500/15 text-violet-300 border-violet-400/35',
    textAccentClass: 'text-violet-300',
    ringClass: 'ring-violet-400/60 border-violet-400/80',
  },
  {
    id: 'science',
    name: 'Science',
    tagline: 'Physics, biology & cosmos',
    description:
      'Explore atomic structure, planetary astronomy, human biology, and landmark discoveries.',
    iconKey: 'atom',
    accentColor: '#3B82F6',
    secondaryColor: '#2563EB',
    glowClass: 'hover:shadow-[0_14px_38px_-10px_rgba(59,130,246,0.4)]',
    borderHoverClass: 'hover:border-blue-400/60',
    iconBgClass: 'bg-blue-500/15 text-blue-300 border-blue-400/35',
    textAccentClass: 'text-blue-300',
    ringClass: 'ring-blue-400/60 border-blue-400/80',
  },
  {
    id: 'general-knowledge',
    name: 'General Knowledge',
    tagline: 'History, culture & world affairs',
    description:
      'Test breadth across world heritage, inventions, literature, civic milestones, and everyday facts.',
    iconKey: 'brain',
    accentColor: '#818CF8',
    secondaryColor: '#6366F1',
    glowClass: 'hover:shadow-[0_14px_38px_-10px_rgba(129,140,248,0.38)]',
    borderHoverClass: 'hover:border-indigo-400/60',
    iconBgClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/35',
    textAccentClass: 'text-indigo-300',
    ringClass: 'ring-indigo-400/60 border-indigo-400/80',
  },
  {
    id: 'sports-games',
    name: 'Sports & Games',
    tagline: 'Championships, rules & legends',
    description:
      'Cover cricket, football, Olympic records, chess masters, and competitive international arenas.',
    iconKey: 'trophy',
    accentColor: '#38BDF8',
    secondaryColor: '#0284C7',
    glowClass: 'hover:shadow-[0_14px_38px_-10px_rgba(56,189,248,0.38)]',
    borderHoverClass: 'hover:border-sky-400/60',
    iconBgClass: 'bg-sky-500/15 text-sky-300 border-sky-400/35',
    textAccentClass: 'text-sky-300',
    ringClass: 'ring-sky-400/60 border-sky-400/80',
  },
] as const;

export const POINT_LEVELS: readonly PointLevelConfig[] = [
  { value: 100, tier: 'Easy', label: '100 pts' },
  { value: 200, tier: 'Easy', label: '200 pts' },
  { value: 300, tier: 'Easy', label: '300 pts' },
  { value: 400, tier: 'Moderate', label: '400 pts' },
  { value: 500, tier: 'Moderate', label: '500 pts' },
  { value: 600, tier: 'Moderate', label: '600 pts' },
  { value: 700, tier: 'Difficult', label: '700 pts' },
  { value: 800, tier: 'Difficult', label: '800 pts' },
  { value: 900, tier: 'Expert', label: '900 pts' },
  { value: 1000, tier: 'Expert', label: '1000 pts' },
] as const;

export const GAME_MODES: readonly GameModeConfig[] = [
  {
    id: 'ai-questions',
    screenId: 'ai-question',
    name: 'AI QUESTIONS',
    subtitle: 'Holographic AI Engine',
    description:
      'Generate intelligent questions based on the selected category and point level.',
    questionCountLabel: 'Dynamic prompt stream',
    stageLabel: 'Upcoming AI stage',
    iconKey: 'bot',
    accentClass: 'text-cyan-300',
    borderClass: 'hover:border-cyan-400/65',
    iconBgClass: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300',
  },
  {
    id: 'saved-questions',
    screenId: 'saved-questions',
    name: 'SAVED QUESTIONS',
    subtitle: 'Curated 3-Card Archive',
    description:
      'Play three prepared questions from the selected category and point level.',
    questionCountLabel: '3 prepared questions',
    stageLabel: 'Upcoming deck stage',
    iconKey: 'bookmark',
    accentClass: 'text-violet-300',
    borderClass: 'hover:border-violet-400/65',
    iconBgClass: 'bg-violet-500/15 border-violet-400/35 text-violet-300',
  },
  {
    id: 'question-spinner',
    screenId: 'question-spinner',
    name: 'QUESTION SPINNER',
    subtitle: '6-Segment Illuminated Wheel',
    description: 'Spin the wheel to randomly select one of six questions.',
    questionCountLabel: '6 wheel segments',
    stageLabel: 'Upcoming wheel stage',
    iconKey: 'disc',
    accentClass: 'text-sky-300',
    borderClass: 'hover:border-sky-400/65',
    iconBgClass: 'bg-sky-500/15 border-sky-400/35 text-sky-300',
  },
] as const;

export const SCREEN_TITLES: Record<ScreenId, string> = {
  intro: 'Welcome',
  home: 'Main Home',
  category: 'Category Selection',
  points: 'Points Selection',
  mode: 'Game Mode Selection',
  'ai-question': 'AI Questions',
  'saved-questions': 'Saved Questions',
  'question-spinner': 'Question Spinner',
  scoreboard: 'Scoreboard',
  results: 'Game Results',
};

export function getCategoryById(id: CategoryId | null): CategoryConfig | null {
  if (!id) return null;
  return QUIZ_CATEGORIES.find((cat) => cat.id === id) ?? null;
}

export function getPointLevelByValue(value: PointLevel | null): PointLevelConfig | null {
  if (!value) return null;
  return POINT_LEVELS.find((lvl) => lvl.value === value) ?? null;
}

export function getGameModeById(id: GameModeId | null): GameModeConfig | null {
  if (!id) return null;
  return GAME_MODES.find((mode) => mode.id === id) ?? null;
}
