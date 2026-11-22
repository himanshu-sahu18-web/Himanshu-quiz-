import type { FC } from 'react';
import {
  Atom,
  Bookmark,
  Bot,
  Brain,
  Clapperboard,
  Disc3,
  Globe2,
  Trophy,
} from 'lucide-react';
import type { CategoryConfig, GameModeConfig } from '../types/quiz';

interface CategoryIconProps {
  iconKey: CategoryConfig['iconKey'];
  className?: string;
}

export const CategoryIcon: FC<CategoryIconProps> = ({ iconKey, className = 'w-6 h-6' }) => {
  switch (iconKey) {
    case 'globe':
      return <Globe2 className={className} aria-hidden="true" />;
    case 'film':
      return <Clapperboard className={className} aria-hidden="true" />;
    case 'atom':
      return <Atom className={className} aria-hidden="true" />;
    case 'brain':
      return <Brain className={className} aria-hidden="true" />;
    case 'trophy':
      return <Trophy className={className} aria-hidden="true" />;
  }
};

interface ModeIconProps {
  iconKey: GameModeConfig['iconKey'];
  className?: string;
}

export const ModeIcon: FC<ModeIconProps> = ({ iconKey, className = 'w-6 h-6' }) => {
  switch (iconKey) {
    case 'bot':
      return <Bot className={className} aria-hidden="true" />;
    case 'bookmark':
      return <Bookmark className={className} aria-hidden="true" />;
    case 'disc':
      return <Disc3 className={className} aria-hidden="true" />;
  }
};
