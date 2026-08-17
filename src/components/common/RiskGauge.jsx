export default function RiskGauge({ score, size = 140 }) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const getColor = (val) => {
    if (val >= 80) return { stroke: '#DC2626', track: '#FEE2E2', label: 'Critical' };
    if (val >= 60) return { stroke: '#D97706', track: '#FEF3C7', label: 'Moderate' };
    if (val >= 40) return { stroke: '#2563EB', track: '#EFF6FF', label: 'Normal' };
    return { stroke: '#16A34A', track: '#F0FDF4', label: 'Low' };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        {/* Background Arc */}
        <path
          d={`M 10 ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none"
          stroke={color.track}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          d={`M 10 ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none"
          stroke={color.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - progress}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-in-out',
          }}
        />
        {/* Score Text */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          fill="currentColor"
          fontSize="26"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          className="text-text-primary"
        >
          {score}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fill={color.stroke}
          fontSize="10"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          letterSpacing="0.5"
        >
          {color.label}
        </text>
      </svg>
      <p className="text-xs text-text-muted mt-1">Station risk score</p>
    </div>
  );
}
