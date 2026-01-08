// Progress bar component for hiring flow

import { CheckIcon } from '@heroicons/react/24/outline';
import { HIRING_STEPS } from '@/config/constants';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Mobile: Simple progress */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Paso {currentStep} de {HIRING_STEPS.length}
            </span>
            <span className="text-xs text-gray-500">
              {HIRING_STEPS[currentStep - 1]?.name}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / HIRING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop: Full progress bar */}
        <div className="hidden md:flex items-center justify-between">
          {HIRING_STEPS.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isUpcoming = currentStep < step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                      {
                        'bg-secondary text-white': isCompleted,
                        'bg-primary text-white ring-4 ring-primary/20': isCurrent,
                        'bg-gray-200 text-gray-500': isUpcoming,
                      }
                    )}
                  >
                    {isCompleted ? <CheckIcon width={24} height={24} /> : step.id}
                  </div>

                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <p
                      className={cn('text-sm font-medium', {
                        'text-secondary': isCompleted,
                        'text-primary': isCurrent,
                        'text-gray-500': isUpcoming,
                      })}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  </div>
                </div>

                {/* Connector line */}
                {index < HIRING_STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-4 relative top-[-20px]">
                    <div
                      className={cn('h-full transition-all duration-300', {
                        'bg-secondary': currentStep > step.id,
                        'bg-gray-200': currentStep <= step.id,
                      })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

