import { useEffect, useState } from 'react';

type PipelineStep = {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  accent: string; // tailwind text/border color token
};

const SEARCH_STEPS: PipelineStep[] = [
  {
    id: 'query',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    label: 'User Query',
    description: 'Parsing natural language input',
    accent: 'blue',
  },
  {
    id: 'embed',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
        <path d="M10 17h4" />
      </svg>
    ),
    label: 'Embedding Service',
    description: 'Converting text → 384-dim vector',
    accent: 'violet',
  },
  {
    id: 'vector',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
    label: 'Vector Search',
    description: 'MongoDB Atlas cosine similarity',
    accent: 'emerald',
  },
  {
    id: 'results',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
    label: 'Ranked Results',
    description: 'Top documents by relevance score',
    accent: 'indigo',
  },
];

const ASK_STEPS: PipelineStep[] = [
  SEARCH_STEPS[0], // query
  SEARCH_STEPS[1], // embed
  SEARCH_STEPS[2], // vector search
  {
    id: 'rag',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
      </svg>
    ),
    label: 'LLM (Groq + Llama 3)',
    description: 'RAG: context + question → answer',
    accent: 'amber',
  },
  {
    id: 'answer',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: 'AI Answer',
    description: 'Synthesized response with sources',
    accent: 'rose',
  },
];

/** Animated dot traveling along the connector line. */
function TravelDot({ active }: { active: boolean }) {
  return (
    <div className="relative mx-1 hidden h-px w-8 overflow-hidden sm:block md:w-12 lg:w-16">
      <div className={`absolute inset-0 transition-colors duration-300 ${active ? 'bg-white/15' : 'bg-white/[0.06]'}`} />
      {active && (
        <div className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/80 animate-travelDot" />
      )}
    </div>
  );
}

/** Single pipeline step node. */
function StepNode({
  step,
  state,
  index,
}: {
  step: PipelineStep;
  state: 'waiting' | 'active' | 'done';
  index: number;
}) {
  const border =
    state === 'active'
      ? 'border-white/20'
      : state === 'done'
        ? 'border-emerald-500/30'
        : 'border-white/[0.06]';

  return (
    <div
      className={`flex flex-col items-center text-center transition-all duration-400 ${state === 'waiting' ? 'opacity-35' : 'opacity-100'}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Icon */}
      <div
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg border bg-white/[0.04] text-slate-300 transition-all duration-400 ${border}`}
      >
        {step.icon}

        {/* Done checkmark */}
        {state === 'done' && (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white animate-scaleIn">
            ✓
          </span>
        )}
      </div>

      {/* Label */}
      <span className={`mt-1.5 text-[10px] font-medium leading-tight transition-colors duration-300 ${state === 'active' ? 'text-white' : state === 'done' ? 'text-emerald-400/80' : 'text-slate-600'}`}>
        {step.label}
      </span>

      {/* Description — only visible when active */}
      <span
        className={`mt-0.5 max-w-[100px] text-[9px] leading-tight transition-all duration-400 ${state === 'active' ? 'text-slate-500 opacity-100' : 'opacity-0'}`}
      >
        {step.description}
      </span>
    </div>
  );
}

type Props = {
  /** 'search' for semantic search flow, 'ask' for RAG flow */
  mode: 'search' | 'ask';
  /** Whether the pipeline is currently running */
  isActive: boolean;
  /** Set to true once results / answer have arrived */
  isDone: boolean;
};

export default function SearchPipelineAnimation({ mode, isActive, isDone }: Props) {
  const steps = mode === 'ask' ? ASK_STEPS : SEARCH_STEPS;
  const [activeStep, setActiveStep] = useState(-1);

  // Animate through steps when isActive becomes true
  useEffect(() => {
    if (!isActive) {
      // Reset when not active
      if (isDone) {
        setActiveStep(steps.length); // all done
      } else {
        setActiveStep(-1);
      }
      return;
    }

    setActiveStep(0);
    const intervalMs = mode === 'ask' ? 700 : 500;
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isActive, isDone, steps.length, mode]);

  // Jump to done state when isDone becomes true
  useEffect(() => {
    if (isDone) {
      setActiveStep(steps.length);
    }
  }, [isDone, steps.length]);

  // Don't render when nothing is happening
  if (activeStep < 0 && !isDone) return null;

  const getStepState = (index: number): 'waiting' | 'active' | 'done' => {
    if (isDone || index < activeStep) return 'done';
    if (index === activeStep) return 'active';
    return 'waiting';
  };

  return (
    <div className="mx-auto mt-4 mb-2 w-full max-w-3xl animate-fadeIn">
      {/* Title bar */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-indigo-400 animate-pulse'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {isDone
            ? mode === 'ask'
              ? 'RAG Pipeline — Complete'
              : 'Search Pipeline — Complete'
            : mode === 'ask'
              ? 'RAG Pipeline — Processing'
              : 'Search Pipeline — Processing'}
        </span>
      </div>

      {/* Pipeline steps */}
      <div className="flex items-center justify-center">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <StepNode step={step} state={getStepState(i)} index={i} />
            {i < steps.length - 1 && (
              <TravelDot active={getStepState(i) === 'done' && getStepState(i + 1) !== 'waiting'} />
            )}
          </div>
        ))}
      </div>

      {/* Status bar when done */}
      {isDone && (
        <div className="mt-3 flex items-center justify-center gap-2 animate-fadeIn">
          <span className="text-[10px] font-medium text-emerald-400/70">Complete</span>
          <span className="text-slate-700">·</span>
          <span className="text-[10px] text-slate-600">
            {mode === 'search'
              ? 'Query → embedding → cosine similarity → top-k'
              : 'Query → embedding → vector search → context → LLM'}
          </span>
        </div>
      )}
    </div>
  );
}
