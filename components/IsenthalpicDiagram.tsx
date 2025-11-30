import React, { useMemo, useRef, useState, useEffect } from 'react';
import { calculateSatVaporPressure, calculateIsothermalVaporPressure, GAMMA } from '../utils/thermo';

interface IsenthalpicDiagramProps {
  Ts: number;
  Ta: number;
  ea: number;
  onSurfaceChange?: (newTs: number) => void;
  onAirChange?: (newTa: number, newEa: number) => void;
}

const IsenthalpicDiagram: React.FC<IsenthalpicDiagramProps> = ({ 
  Ts, 
  Ta, 
  ea, 
  onSurfaceChange, 
  onAirChange 
}) => {
  // SVG Dimensions and Scales
  const width = 600;
  const height = 400;
  const padding = { top: 20, right: 30, bottom: 50, left: 60 };

  // Domain
  const minT = 0, maxT = 40;
  const minE = 0, maxE = 8; // kPa

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<'surface' | 'air' | null>(null);

  // Scale functions
  const scaleX = (t: number) => padding.left + (t - minT) / (maxT - minT) * (width - padding.left - padding.right);
  const scaleY = (e: number) => height - padding.bottom - (e - minE) / (maxE - minE) * (height - padding.top - padding.bottom);

  // Inverse Scale functions (for interaction)
  const invertX = (x: number) => {
    const plotWidth = width - padding.left - padding.right;
    const t = minT + ((x - padding.left) / plotWidth) * (maxT - minT);
    return Math.max(minT, Math.min(maxT, t));
  };

  const invertY = (y: number) => {
    const plotHeight = height - padding.top - padding.bottom;
    const e = minE + ((height - padding.bottom - y) / plotHeight) * (maxE - minE);
    return Math.max(minE, Math.min(maxE, e));
  };

  // Generate Saturation Curve Path
  const saturationCurvePath = useMemo(() => {
    let d = `M ${scaleX(minT)} ${scaleY(calculateSatVaporPressure(minT))}`;
    for (let t = minT; t <= maxT; t += 0.5) {
      d += ` L ${scaleX(t)} ${scaleY(calculateSatVaporPressure(t))}`;
    }
    return d;
  }, []);

  // Calculate Points
  const es_star = calculateSatVaporPressure(Ts);
  const ea_star = calculateSatVaporPressure(Ta);
  
  const { eI, regime } = calculateIsothermalVaporPressure(Ts, Ta);

  // Isenthalpic Lines logic
  const getIsenthalpLine = (startT: number, startE: number) => {
    const t1 = startT - 15;
    const t2 = startT + 15;
    const e1 = startE - GAMMA * (t1 - startT);
    const e2 = startE - GAMMA * (t2 - startT);
    return {
      x1: scaleX(t1),
      y1: scaleY(e1),
      x2: scaleX(t2),
      y2: scaleY(e2)
    };
  };

  const surfaceIsenthalp = getIsenthalpLine(Ts, es_star);
  const airIsenthalp = getIsenthalpLine(Ta, ea);

  // Interaction Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !svgRef.current) return;
      e.preventDefault();

      const rect = svgRef.current.getBoundingClientRect();
      // Calculate relative coordinates within the SVG
      // We scale the mouse position in case the SVG is resized via CSS
      const scaleFactorX = width / rect.width;
      const scaleFactorY = height / rect.height;
      
      const mouseX = (e.clientX - rect.left) * scaleFactorX;
      const mouseY = (e.clientY - rect.top) * scaleFactorY;

      const newT = invertX(mouseX);

      if (dragging === 'surface') {
        if (onSurfaceChange) onSurfaceChange(newT);
      } else if (dragging === 'air') {
        const newE = invertY(mouseY);
        // Optional: Clamp e to saturation curve if we want to enforce undersaturation
        // const maxE = calculateSatVaporPressure(newT);
        // if (onAirChange) onAirChange(newT, Math.min(newE, maxE));
        if (onAirChange) onAirChange(newT, newE);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onSurfaceChange, onAirChange]);

  return (
    <div className="w-full overflow-hidden bg-white rounded-lg shadow-sm border border-slate-200 select-none">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Thermodynamic State Diagram</h3>
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${regime === 'limited' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
          Regime: {regime === 'limited' ? 'Energy Limited' : 'Energy Saturated'}
        </span>
      </div>
      
      <div className="relative">
        <svg 
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-auto max-h-[500px] cursor-crosshair touch-none"
        >
            {/* Grid Lines */}
            <g stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4">
                {[1,2,3,4,5,6,7].map(val => (
                    <line key={`y-${val}`} x1={padding.left} y1={scaleY(val)} x2={width-padding.right} y2={scaleY(val)} />
                ))}
                {[10,20,30].map(val => (
                    <line key={`x-${val}`} x1={scaleX(val)} y1={padding.top} x2={scaleX(val)} y2={height-padding.bottom} />
                ))}
            </g>

            {/* Axes */}
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="black" strokeWidth="2" />
            <line x1={padding.left} y1={height - padding.bottom} x2={padding.left} y2={padding.top} stroke="black" strokeWidth="2" />
            
            {/* Labels */}
            <text x={width / 2} y={height - 10} textAnchor="middle" className="text-sm font-medium fill-slate-600">Temperature T (°C)</text>
            <text x={20} y={height / 2} textAnchor="middle" transform={`rotate(-90, 20, ${height/2})`} className="text-sm font-medium fill-slate-600">Vapor Pressure e (kPa)</text>

            {/* Saturation Curve */}
            <path d={saturationCurvePath} fill="none" stroke="#3b82f6" strokeWidth="3" />
            <text x={scaleX(35)} y={scaleY(calculateSatVaporPressure(35)) - 10} fill="#3b82f6" className="text-xs font-bold">Saturation Curve</text>

            {/* Surface Isenthalp Line */}
            <line 
            x1={surfaceIsenthalp.x1} y1={surfaceIsenthalp.y1} 
            x2={surfaceIsenthalp.x2} y2={surfaceIsenthalp.y2} 
            stroke="#ef4444" strokeWidth="2" 
            />
            
            {/* Air Isenthalp Line */}
            <line 
            x1={airIsenthalp.x1} y1={airIsenthalp.y1} 
            x2={airIsenthalp.x2} y2={airIsenthalp.y2} 
            stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" 
            />

            {/* Vertical Line at Ta (Isothermal Reference) */}
            <line 
                x1={scaleX(Ta)} y1={padding.top} 
                x2={scaleX(Ta)} y2={height-padding.bottom} 
                stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" 
            />

            {/* --- INTERACTIVE POINTS --- */}

            {/* Isothermal Point (eI) - Not Draggable, just calculated */}
            <circle cx={scaleX(Ta)} cy={scaleY(eI)} r="6" fill="white" stroke="#10b981" strokeWidth="2" />
            <text x={scaleX(Ta) + 10} y={scaleY(eI)} className="text-xs font-bold fill-emerald-600 pointer-events-none">
            eI
            </text>

            {/* Surface State (Draggable) */}
            <g 
                className="cursor-pointer hover:opacity-80"
                onMouseDown={() => setDragging('surface')}
            >
                {/* Larger transparent circle for easier clicking */}
                <circle cx={scaleX(Ts)} cy={scaleY(es_star)} r="15" fill="transparent" /> 
                <circle cx={scaleX(Ts)} cy={scaleY(es_star)} r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                <text x={scaleX(Ts)} y={scaleY(es_star) - 15} textAnchor="middle" className="text-xs font-bold fill-red-600 pointer-events-none">
                    (Ts, e*s)
                </text>
            </g>

            {/* Air State (Draggable) */}
            <g 
                className="cursor-pointer hover:opacity-80"
                onMouseDown={() => setDragging('air')}
            >
                {/* Larger transparent circle for easier clicking */}
                <circle cx={scaleX(Ta)} cy={scaleY(ea)} r="15" fill="transparent" />
                <circle cx={scaleX(Ta)} cy={scaleY(ea)} r="6" fill="#64748b" stroke="white" strokeWidth="2" />
                <text x={scaleX(Ta) + 10} y={scaleY(ea) + 15} className="text-xs font-bold fill-slate-600 pointer-events-none">
                    (Ta, ea)
                </text>
            </g>

            {/* Visualizing the "Cap" if saturated */}
            {regime === 'saturated' && (
                <line 
                x1={scaleX(Ta)} y1={scaleY(ea_star)} 
                x2={scaleX(Ta-5)} y2={scaleY(ea_star + GAMMA*5)} 
                stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"
            />
            )}
        </svg>

        {/* Dragging Hint Overlay */}
        <div className={`absolute top-2 right-2 px-3 py-1 bg-black/75 text-white text-xs rounded-full pointer-events-none transition-opacity duration-300 ${dragging ? 'opacity-100' : 'opacity-0'}`}>
            {dragging === 'surface' ? `Adjusting Surface Temp: ${Ts.toFixed(1)}°C` : dragging === 'air' ? `Adjusting Air State: ${Ta.toFixed(1)}°C, ${ea.toFixed(2)}kPa` : ''}
        </div>
      </div>

      <div className="p-4 text-sm text-slate-600 bg-slate-50 border-t border-slate-100">
          <p>
            <span className="font-semibold text-indigo-600">Interactive:</span> Drag the <span className="text-red-500 font-bold">Red Dot</span> to change Surface Temperature or the <span className="text-slate-500 font-bold">Gray Dot</span> to change Air State (Temp & Vapor Pressure).
          </p>
      </div>
    </div>
  );
};

export default IsenthalpicDiagram;