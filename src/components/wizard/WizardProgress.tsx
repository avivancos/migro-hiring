// WizardProgress - Barra de progreso del wizard

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  className?: string;
}

export function WizardProgress({
  currentStep,
  totalSteps,
  completionPercentage,
  className,
}: WizardProgressProps) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {/* Información de progreso */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Paso {currentStep} de {totalSteps}
        </span>
        <span className="font-semibold text-gray-900">
          {completionPercentage}% completado
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Indicadores de pasos */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div
              key={step}
              className={`flex-1 h-2 mx-1 rounded-full transition-all ${
                isCompleted
                  ? 'bg-green-500'
                  : isCurrent
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
              title={`Paso ${step}`}
            />
          );
        })}
      </div>
    </div>
  );
}

