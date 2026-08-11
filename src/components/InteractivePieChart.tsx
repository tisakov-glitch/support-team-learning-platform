import React, { useState } from 'react';
import { motion } from 'motion/react';

interface PieChartData {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface InteractivePieChartProps {
  title: string;
  subtitle: string;
  data: PieChartData[];
  onSelectSlice?: (id: string | null) => void;
  selectedId?: string | null;
  emptyMessage?: string;
}

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({
  title,
  subtitle,
  data,
  onSelectSlice,
  selectedId,
  emptyMessage = 'Нет данных за выбранный период'
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Math helper for donut segment paths
  const describeDonutSegment = (
    x: number,
    y: number,
    radius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180.0;
    const endRad = ((endAngle - 90) * Math.PI) / 180.0;

    const x1_out = x + radius * Math.cos(startRad);
    const y1_out = y + radius * Math.sin(startRad);
    const x2_out = x + radius * Math.cos(endRad);
    const y2_out = y + radius * Math.sin(endRad);

    const x1_in = x + innerRadius * Math.cos(startRad);
    const y1_in = y + innerRadius * Math.sin(startRad);
    const x2_in = x + innerRadius * Math.cos(endRad);
    const y2_in = y + innerRadius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${x1_out} ${y1_out}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out}`,
      `L ${x2_in} ${y2_in}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1_in} ${y1_in}`,
      'Z'
    ].join(' ');
  };

  // Generate segments with angles
  let currentAngle = 0;
  const segments = data.map(item => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angleDelta = total > 0 ? (item.value / total) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleDelta;
    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle
    };
  });

  const centerCoordinates = { x: 120, y: 120 };
  const baseOuterRadius = 90;
  const baseInnerRadius = 55;

  const activeItem = data.find(item => item.id === (hoveredId || selectedId));
  const activePercentage = activeItem && total > 0 ? Math.round((activeItem.value / total) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 flex flex-col justify-between h-full">
      <div>
        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">{subtitle}</p>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <svg className="w-10 h-10 text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M8 12h8" />
          </svg>
          <span className="text-xs font-bold">{emptyMessage}</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 mt-6">
          {/* Chart SVG */}
          <div className="relative w-[240px] h-[240px] shrink-0">
            <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible select-none">
              {segments.map(seg => {
                const isHovered = hoveredId === seg.id;
                const isSelected = selectedId === seg.id;
                const isActive = isHovered || isSelected;

                // Expand radius on hover
                const outerRad = isActive ? baseOuterRadius + 6 : baseOuterRadius;
                const innerRad = isActive ? baseInnerRadius - 2 : baseInnerRadius;

                const pathD = describeDonutSegment(
                  centerCoordinates.x,
                  centerCoordinates.y,
                  outerRad,
                  innerRad,
                  seg.startAngle,
                  seg.endAngle
                );

                return (
                  <path
                    key={seg.id}
                    d={pathD}
                    fill={seg.color}
                    className="transition-all duration-300 cursor-pointer hover:brightness-105"
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 3 : 1.5}
                    onMouseEnter={() => setHoveredId(seg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                      if (onSelectSlice) {
                        onSelectSlice(selectedId === seg.id ? null : seg.id);
                      }
                    }}
                  />
                );
              })}

              {/* Central Text for Donut Chart */}
              <circle
                cx={centerCoordinates.x}
                cy={centerCoordinates.y}
                r={baseInnerRadius - 4}
                fill="#ffffff"
              />
              <text
                x={centerCoordinates.x}
                y={centerCoordinates.y - 6}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest"
              >
                {activeItem ? activeItem.label : 'Всего'}
              </text>
              <text
                x={centerCoordinates.x}
                y={centerCoordinates.y + 14}
                textAnchor="middle"
                className="text-lg font-black fill-slate-800 font-mono tracking-tight"
              >
                {activeItem ? `${activePercentage}%` : total}
              </text>
              {activeItem && (
                <text
                  x={centerCoordinates.x}
                  y={centerCoordinates.y + 26}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-indigo-650"
                >
                  {activeItem.value} шт.
                </text>
              )}
            </svg>
          </div>

          {/* Legend and stats */}
          <div className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {segments.map(seg => {
              const isSelected = selectedId === seg.id;
              const isHovered = hoveredId === seg.id;
              const isActive = isSelected || isHovered;

              return (
                <div
                  key={seg.id}
                  onClick={() => {
                    if (onSelectSlice) {
                      onSelectSlice(isSelected ? null : seg.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredId(seg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-3xs' 
                      : isActive
                      ? 'bg-slate-50 border-slate-200'
                      : 'border-transparent hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-300"
                      style={{ 
                        backgroundColor: seg.color,
                        transform: isActive ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />
                    <span className={`text-xs font-bold truncate ${
                      isSelected ? 'text-indigo-900 font-extrabold' : 'text-slate-700'
                    }`}>
                      {seg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span className="font-extrabold text-slate-800">{seg.value} шт.</span>
                    <span className="text-slate-400 font-medium">({Math.round(seg.percentage)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
