import type { FC, ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ModalId, ScreenId } from '../types/quiz';
import { AmbientStage } from './AmbientStage';
import { BrandEmblem } from './BrandEmblem';
import { RulesModal } from './modals/RulesModal';
import { SettingsModal } from './modals/SettingsModal';

interface AppShellProps {
  currentScreen: ScreenId;
  soundEnabled: boolean;
  reducedMotion: boolean;
  activeModal: ModalId;
  onNavigate: (screen: ScreenId) => void;
  onBack: () => void;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
  onOpenModal: (modal: Exclude<ModalId, null>) => void;
  onCloseModal: () => void;
  onReplayIntro: () => void;
  onResetSetup: () => void;
  children: ReactNode;
}

export const AppShell: FC<AppShellProps> = ({
  currentScreen,
  soundEnabled,
  reducedMotion,
  activeModal,
  onNavigate,
  onBack,
  onToggleSound,
  onToggleReducedMotion,
  onOpenModal,
  onCloseModal,
  onReplayIntro,
  onResetSetup,
  children,
}) => {
  const showHeader = currentScreen !== 'intro';

  return (
    <div className="relative min-h-screen bg-[#020510] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-100">
      <AmbientStage
        reducedMotion={reducedMotion}
        intensity={currentScreen === 'intro' ? 'intro' : 'stage'}
        currentScreen={currentScreen}
      />

      {showHeader && (
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#040816]/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 lg:px-8">
            {/* Brand Zone */}
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 sm:gap-2.5 text-left whitespace-nowrap shrink-0 rounded-lg py-1 pr-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="HIMANSHU QUIZ Home"
            >
              <BrandEmblem size={28} className="shrink-0 sm:w-8 sm:h-8" />
              <span className="font-display text-xs sm:text-lg font-bold tracking-wide text-white">
                HIMANSHU QUIZ
              </span>
            </button>

            {/* Primary Navigation Links (Desktop & Tablet) */}
            <nav
              aria-label="Primary"
              className="hidden md:flex items-center gap-6 text-sm font-medium"
            >
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-t ${
                  currentScreen === 'home'
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('rules')}
                className="whitespace-nowrap shrink-0 py-1.5 border-b-2 border-transparent text-slate-400 hover:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-t"
              >
                Rules & Regulations
              </button>
              <button
                type="button"
                onClick={() => onNavigate('category')}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-t ${
                  currentScreen === 'category' ||
                  currentScreen === 'points' ||
                  currentScreen === 'mode'
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                Categories
              </button>
              <button
                type="button"
                onClick={() => onNavigate('scoreboard')}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-t ${
                  currentScreen === 'scoreboard'
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                Scoreboard
              </button>
            </nav>

            {/* Audio, Settings & Contextual Action Zone */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Mobile Rules quick trigger */}
              <button
                type="button"
                onClick={() => onOpenModal('rules')}
                aria-label="Rules & Regulations"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/75 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                aria-pressed={soundEnabled}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  soundEnabled
                    ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-slate-900/75 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpenModal('settings')}
                aria-label="Settings"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/75 text-slate-300 transition-colors hover:border-violet-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
              </button>

              {currentScreen === 'home' ? (
                <button
                  type="button"
                  onClick={() => onNavigate('category')}
                  className="hidden sm:inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white whitespace-nowrap shrink-0 shadow-[0_0_24px_-4px_rgba(37,99,235,0.65)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Start Quiz
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/85 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 whitespace-nowrap shrink-0 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Back</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="relative z-10 flex-1 flex flex-col">{children}</main>

      <AnimatePresence>
        {activeModal === 'rules' && <RulesModal onClose={onCloseModal} />}
        {activeModal === 'settings' && (
          <SettingsModal
            soundEnabled={soundEnabled}
            reducedMotion={reducedMotion}
            onToggleSound={onToggleSound}
            onToggleReducedMotion={onToggleReducedMotion}
            onReplayIntro={onReplayIntro}
            onResetSetup={onResetSetup}
            onClose={onCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
