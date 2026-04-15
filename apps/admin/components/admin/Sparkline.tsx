type SparklineProps = {
  points: readonly number[];
  stroke: string;
  fill: string;
};

export function Sparkline({ points, stroke, fill }: SparklineProps) {
  const width = 152;
  const height = 52;
  const padding = 5;

  if (points.length === 0) {
    return null;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = points.length === 1 ? 0 : (width - padding * 2) / (points.length - 1);

  const coordinates = points.map((point, index) => {
    const x = padding + stepX * index;
    const y = height - padding - ((point - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const areaPath = `${linePath} L ${last.x} ${height - padding} L ${first.x} ${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-14 w-full max-w-[152px]"
      role="img"
      aria-label="Sparkline chart"
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
