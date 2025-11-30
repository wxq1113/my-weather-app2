import React, { useState, useEffect } from 'react';
import IsenthalpicDiagram from './components/IsenthalpicDiagram';
import EquationBlock from './components/EquationBlock';
import { calculateSatVaporPressure, calculateIsothermalVaporPressure, calculateLEI } from './utils/thermo';
import { BookOpen, Activity, Calculator, Info } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState<'theory' | 'model' | 'calculator'>('model');

  // State for the interactive model
  const [Ta, setTa] = useState(25);
  const [Ts, setTs] = useState(20);
  const [RH, setRH] = useState(60); // Relative Humidity %
  const [Qn, setQn] = useState(300); // Available Energy W/m2

  // Derived values for model
  const ea = (calculateSatVaporPressure(Ta) * RH) / 100;
  const es_star = calculateSatVaporPressure(Ts);
  const { eI, regime } = calculateIsothermalVaporPressure(Ts, Ta);
  const LE_I = calculateLEI(Qn, eI, ea, es_star, Ts, Ta);

  // Handlers for Interactive Diagram
  const handleSurfaceChange = (newTs: number) => {
      setTs(newTs);
  };

  const handleAirChange = (newTa: number, newEa: number) => {
      setTa(newTa);
      
      // Calculate new RH based on new Ea and new Ta
      const newEs = calculateSatVaporPressure(newTa);
      let newRH = (newEa / newEs) * 100;
      
      // Constrain for UI sanity, though supersaturation is possible in physics, 
      // standard sliders usually stick to 0-100.
      // We'll just update it, but clamp display to 100 if we want to keep it "clean",
      // or allow it. Let's clamp to 100 for the slider state to prevent errors.
      if (newRH > 100) newRH = 100; 
      if (newRH < 0) newRH = 0;
      
      setRH(newRH);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Isothermal Flux Framework</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Based on Wu, Liu, et al.</p>
            </div>
          </div>
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('model')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'model' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                Interactive Model
            </button>
            <button 
                onClick={() => setActiveTab('theory')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'theory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                Theoretical Basis
            </button>
            <button 
                onClick={() => setActiveTab('calculator')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'calculator' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                Calculator
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {activeTab === 'model' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-600 p-1 rounded mr-2"><Calculator size={18}/></span>
                    Input Variables
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Air Temperature ($T_a$): <span className="text-indigo-600 font-bold">{Ta.toFixed(1)}°C</span>
                    </label>
                    <input 
                        type="range" min="0" max="40" step="0.5" value={Ta} 
                        onChange={(e) => setTa(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Surface Temperature ($T_s$): <span className="text-indigo-600 font-bold">{Ts.toFixed(1)}°C</span>
                    </label>
                    <input 
                        type="range" min="0" max="40" step="0.5" value={Ts} 
                        onChange={(e) => setTs(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Try dragging the <span className="text-red-500 font-bold">Red Dot</span> in the diagram.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Relative Humidity (RH): <span className="text-indigo-600 font-bold">{RH.toFixed(0)}%</span>
                    </label>
                    <input 
                        type="range" min="10" max="100" step="1" value={RH} 
                        onChange={(e) => setRH(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Available Energy ($Q_n$): <span className="text-indigo-600 font-bold">{Qn} W/m²</span>
                    </label>
                    <input 
                        type="range" min="0" max="800" step="10" value={Qn} 
                        onChange={(e) => setQn(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Results Box */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Calculated Isothermal Flux</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase">Regime</p>
                        <p className={`font-bold ${regime === 'limited' ? 'text-blue-600' : 'text-amber-600'}`}>
                            {regime === 'limited' ? 'Energy Limited' : 'Energy Saturated'}
                        </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase">Isothermal Flux ($LE_I$)</p>
                        <p className="text-2xl font-bold text-slate-900">{LE_I.toFixed(1)} <span className="text-sm text-slate-500 font-normal">W/m²</span></p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Actual Vapor Pressure ($e_a$)</span>
                        <span>{ea.toFixed(3)} kPa</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Isothermal VP ($e_I$)</span>
                        <span>{eI.toFixed(3)} kPa</span>
                    </div>
                     <div className="flex justify-between text-sm text-slate-600">
                        <span>Driving Gradient ($G_I$)</span>
                        <span>{(eI - ea).toFixed(3)} kPa</span>
                    </div>
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div className="lg:col-span-2">
                 <IsenthalpicDiagram 
                    Ts={Ts} 
                    Ta={Ta} 
                    ea={ea} 
                    onSurfaceChange={handleSurfaceChange}
                    onAirChange={handleAirChange}
                 />
                 
                 <div className="mt-6 prose prose-slate max-w-none">
                     <h3 className="text-lg font-semibold text-slate-800">Physical Interpretation</h3>
                     <p>
                         The diagram above illustrates the <span className="font-bold">Isenthalpic Principle</span>. 
                         The red line represents the Surface Isenthalp, passing through the current surface state $(T_s, e^*_s)$. 
                         The dashed gray line represents the Air Isenthalp.
                     </p>
                     <p>
                         The <strong>Isothermal Latent Heat Flux ($LE_I$)</strong> is defined at the state where surface temperature 
                         equilibrates with air temperature ($T_s \rightarrow T_a$). We find this by projecting the surface state 
                         along the isenthalp to $T_a$.
                     </p>
                     <ul className="list-disc pl-5 space-y-2">
                         <li>
                             <strong>Energy Limited ($T_s \le T_a$):</strong> The surface warms towards equilibrium. The projected vapor pressure $e_I$ is physically valid.
                         </li>
                         <li>
                             <strong>Energy Saturated ($T_s {'>'} T_a$):</strong> The surface cools towards equilibrium. A simple projection would result in supersaturation ($e {'>'} e^*_a$). 
                             Thus, $e_I$ is capped at saturation ($e^*_a$).
                         </li>
                     </ul>
                 </div>
            </div>
          </div>
        )}

        {activeTab === 'theory' && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Theoretical Framework</h2>
            
            <section className="mb-10">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">1. Enthalpy Conservation</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                    The framework treats the surface and near-surface air as a coupled system characterized by total enthalpy 
                    $h = c_pT + L_vq$. Assuming $LE$ and $H$ stay constant along the vertical (constant flux layer), 
                    total enthalpy is conserved, leading to an inverse linear relationship between temperature and vapor pressure:
                </p>
                <EquationBlock title="Isenthalpic Slope">
                    de/dT = -\gamma
                </EquationBlock>
                <p className="text-slate-600 leading-relaxed">
                    This implies that the thermodynamic state moves along an "isenthalp" with slope $-\gamma$ (the psychrometric constant).
                </p>
            </section>

            <section className="mb-10">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">2. Defining Isothermal Flux ($LE_I$)</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                    We seek to quantify the latent heat flux at a theoretical state where the surface temperature equilibrates 
                    with the ambient air temperature ($T_s = T_a$). We define the driving force at this state as the 
                    <strong> Isothermal Vapor Pressure Gradient ($G_I$)</strong>:
                </p>
                <EquationBlock title="Driving Force">
                    G_I = e_I - e_a
                </EquationBlock>
                <p className="text-slate-600 leading-relaxed">
                    Here, $e_I$ is the isothermal surface vapor pressure. It is found by projecting the surface isenthalp 
                    (anchored at $T_s, e^*_s$) to the air temperature $T_a$.
                </p>
            </section>

            <section className="mb-10">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">3. Two Physical Regimes</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                    The derivation yields a piecewise function based on the relationship between $T_s$ and $T_a$, 
                    distinguishing between energy-limited and energy-saturated conditions.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2">Energy Limited ($T_s \le T_a$)</h4>
                        <p className="text-sm text-blue-700 mb-4">
                            Typically at night or overcast days. Surface warms toward equilibrium.
                        </p>
                        <div className="math-serif text-center text-blue-900 text-lg">
                            e_I = e^*_s - \gamma(T_a - T_s)
                        </div>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                        <h4 className="font-bold text-amber-800 mb-2">Energy Saturated ($T_s {'>'} T_a$)</h4>
                        <p className="text-sm text-amber-700 mb-4">
                            Strong solar radiation. Surface cools toward equilibrium. Capped at saturation.
                        </p>
                        <div className="math-serif text-center text-amber-900 text-lg">
                            e_I = e^*_a
                        </div>
                    </div>
                </div>
            </section>

            <section>
                 <h3 className="text-xl font-semibold text-slate-800 mb-4">4. Final Formulation</h3>
                 <p className="text-slate-600 mb-4">
                     Combining these regimes with the ratio against the wet-equilibrium reference flux ($LE_W$), we obtain the final expression:
                 </p>
                 <EquationBlock title="Eq. 9">
                     {`LE_I = \\begin{cases} 
                     Q_n & T_s \\le T_a \\\\
                     Q_n \\frac{e^*_a - e_a}{(e^*_s - e_a) - \\gamma(T_a - T_s)} & T_s > T_a 
                     \\end{cases}`}
                 </EquationBlock>
            </section>
          </div>
        )}

        {activeTab === 'calculator' && (
             <div className="max-w-2xl mx-auto">
                 <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                     <div className="bg-indigo-600 p-6 text-white">
                         <h2 className="text-2xl font-bold">Quick Calculator</h2>
                         <p className="opacity-90 mt-2">Estimate $LE_I$ for a single data point.</p>
                     </div>
                     <div className="p-8 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Available Energy ($Q_n$)</label>
                                 <input type="number" value={Qn} onChange={e => setQn(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Air Temp ($T_a$)</label>
                                 <input type="number" value={Ta} onChange={e => setTa(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Surface Temp ($T_s$)</label>
                                 <input type="number" value={Ts} onChange={e => setTs(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Humidity ($RH$)</label>
                                 <input type="number" value={RH} onChange={e => setRH(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                             </div>
                         </div>

                         <div className="bg-slate-100 p-6 rounded-lg mt-6">
                             <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Result</h4>
                             <div className="flex items-baseline space-x-2">
                                 <span className="text-4xl font-extrabold text-indigo-600">{LE_I.toFixed(2)}</span>
                                 <span className="text-slate-600 font-medium">W/m²</span>
                             </div>
                             <p className="text-sm text-slate-500 mt-2">
                                 Regime: {regime === 'limited' ? 'Energy Limited (Ts ≤ Ta)' : 'Energy Saturated (Ts > Ta)'}
                             </p>
                         </div>
                     </div>
                 </div>
             </div>
        )}

      </main>
    </div>
  );
};

export default App;