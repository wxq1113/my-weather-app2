// Physical constants
export const GAMMA = 0.066; // Psychrometric constant (kPa/°C) approx at standard pressure
export const SLOPE_SCALE = 10; // Scaling factor for visual representation of slope in SVG

/**
 * Calculates Saturation Vapor Pressure (e*) using the formula from the paper (Eq after 149)
 * e*(T) = 6.108 * exp(17.27 * T / (237.3 + T))
 * Result in hPa (mbar), converted to kPa by dividing by 10 for consistency if needed.
 * The paper likely uses hPa or kPa. Let's assume kPa for standard met calculations, 
 * but the coefficient 6.108 usually implies hPa. 
 * Let's standardize on kPa for the visualization: 0.6108 * ...
 */
export const calculateSatVaporPressure = (T: number): number => {
  return 0.6108 * Math.exp((17.27 * T) / (237.3 + T));
};

/**
 * Calculates the Isothermal Vapor Pressure (e_I)
 * Based on Equation (3) and (4) in the paper.
 * 
 * @param Ts Surface Temperature (C)
 * @param Ta Air Temperature (C)
 */
export const calculateIsothermalVaporPressure = (Ts: number, Ta: number): { eI: number, regime: 'limited' | 'saturated' } => {
  const es_star = calculateSatVaporPressure(Ts);
  const ea_star = calculateSatVaporPressure(Ta);
  
  // Projection along isenthalp: e = es* - gamma * (Ta - Ts)
  // Note: Paper Eq (2) says: e = es* - gamma * (T - Ts)
  // We want e at T = Ta.
  const projected_e = es_star - GAMMA * (Ta - Ts);

  if (Ts <= Ta) {
    // Energy-limited regime (Figure 2a)
    return { eI: projected_e, regime: 'limited' };
  } else {
    // Energy-saturated regime (Figure 2b)
    // The projection might exceed ea*, so it is capped.
    // However, the paper Eq (4) says eI = ea* for the saturated regime.
    return { eI: ea_star, regime: 'saturated' };
  }
};

export const calculateLEI = (Qn: number, eI: number, ea: number, es_star: number, Ts: number, Ta: number): number => {
  // Equation (9)
  // Note: This is a simplified implementation of the ratio logic. 
  // In the paper LE_I = Qn * (G_I / G_W) * ... which simplifies to piecewise.
  
  // Denominator term from Eq 9: (es* - ea) - gamma(Ta - Ts)
  const denominator = (es_star - ea) - GAMMA * (Ta - Ts);
  
  if (denominator === 0) return 0; // Avoid division by zero

  if (Ts <= Ta) {
    // Energy limited
    return Qn; // Simplifies to Qn as per paper discussion for Ts < Ta
  } else {
    // Energy saturated
    // LE_I = Qn * (ea* - ea) / denominator
    const ea_star = calculateSatVaporPressure(Ta);
    return Qn * ((ea_star - ea) / denominator);
  }
};