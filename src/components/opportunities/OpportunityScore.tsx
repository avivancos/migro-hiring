// OpportunityScore - Visualización de score de oportunidad

interface OpportunityScoreProps {
  score: number;
  className?: string;
  showValue?: boolean;
}

export function OpportunityScore({
  score,
  className,
  showValue = true,
}: OpportunityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getScoreColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
          {score}
        </span>
      )}
    </div>
  );
}

