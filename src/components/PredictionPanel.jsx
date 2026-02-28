import { useState, useEffect } from 'react';
import { 
  Leaf, 
  Droplets, 
  ThermometerSun, 
  Wind, 
  TrendingUp, 
  Sprout, 
  RefreshCcw,
  MapPin,
  Calendar,
  IndianRupee,
  Banknote,
  Timer,
  Activity,
  AlertTriangle,
  Waves
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import talukaStats from '../data/taluka_stats.json';

// Build weather data from real dataset averages (taluka_stats.json)
const getWeatherForTaluka = (taluka) => {
  const s = talukaStats[taluka];
  if (!s) return { Accumulated_Rainfall_mm: 500, Avg_NDVI: 0.65, Solar_Radiation_kWh: 5.7, Avg_Humidity_Percent: 62, Avg_Max_Temp_Celsius: 33, Avg_Min_Temp_Celsius: 20, Latitude: 19.09, Longitude: 74.74 };
  return {
    Accumulated_Rainfall_mm: s.avgRainfall,
    Avg_NDVI: s.avgNDVI,
    Solar_Radiation_kWh: s.avgSolarRadiation,
    Avg_Humidity_Percent: s.avgHumidity,
    Avg_Max_Temp_Celsius: s.avgMaxTemp,
    Avg_Min_Temp_Celsius: s.avgMinTemp,
    Latitude: 19.09,
    Longitude: 74.74
  };
};

const PredictionPanel = ({ details }) => {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState(null);
  const [pricePrediction, setPricePrediction] = useState(null);
  const [harvestPrediction, setHarvestPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentWeather = details ? getWeatherForTaluka(details.taluka) : getWeatherForTaluka('Ahmednagar');

  useEffect(() => {
    if (details) validateAndFetch();
  }, [details]);

  const validateAndFetch = () => {
      // API requires these specific fields to be present
      const requiredFields = ['taluka', 'season', 'variety', 'soil_type', 'irrigation_method'];
      const missing = requiredFields.filter(field => !details[field]);

      if (missing.length > 0) {
          setError(`Configuration Incomplete: Missing ${missing.join(', ')}. Please update details.`);
          return;
      }

      fetchPrediction();
  };

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedWeather = getWeatherForTaluka(details.taluka);
      const completeWeather = {
          ...selectedWeather,
          Avg_EVI: selectedWeather.Avg_NDVI * 0.6, 
          Avg_LST_Celsius: selectedWeather.Avg_Max_Temp_Celsius - 2.0 
      };

      const payload = {
        Taluka: details.taluka,
        Season: details.season,
        Cane_Variety: details.variety,
        Soil_Type: details.soil_type,
        Irrigation_Method: details.irrigation_method,
        Area_Harvested_Ha: (details.area_size || 1) * 0.404686,
        ...completeWeather
      };

      const pricePayload = {
        Taluka: details.taluka,
        Season: details.season,
        Cane_Variety: details.variety,
        Soil_Type: details.soil_type,
        Irrigation_Method: details.irrigation_method,
        Harvest_Year: details.planting_date ? new Date(details.planting_date).getFullYear() + 1 : new Date().getFullYear(),
        ...completeWeather
      };

      const [yieldRes, priceRes, harvestRes] = await Promise.all([
        fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        fetch('/api/predict-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pricePayload),
        }).catch(() => ({ ok: false })),
        fetch('/api/predict-harvest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => ({ ok: false }))
      ]);

      if (!yieldRes.ok) {
           const errData = await yieldRes.json();
           throw new Error(errData.error || 'Yield Prediction API failed');
      }
      
      const yieldData = await yieldRes.json();
      setPrediction(yieldData.predicted_yield);
      
      if (priceRes.ok) {
          const priceData = await priceRes.json();
          if (priceData.predicted_price_per_ton) {
              setPricePrediction(priceData.predicted_price_per_ton);
          }
      }
      
      if (harvestRes.ok) {
          const harvestData = await harvestRes.json();
          if (harvestData.predicted_harvest_days) {
              setHarvestPrediction(harvestData.predicted_harvest_days);
          }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Backend Offline');
    } finally {
      setLoading(false);
    }
  };

  if (!details) return null;

  // Render "Setup Required" state if error is about configuration
  if (error && error.includes('Configuration Incomplete')) {
      return (
          <div className="bento-wrapper">
              <div className="bento-card hero-card" style={{ background: '#FFF3E0', border: '1px solid #FFB74D' }}>
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <h2 style={{ color: '#E65100' }}>{t('fieldDetails.prediction.setupRequired')}</h2>
                      <p style={{ margin: '1rem 0', color: '#5D4037' }}>{error}</p>
                      <p style={{ fontSize: '0.9rem' }}>{t('fieldDetails.prediction.goToConfig')}</p>
                  </div>
              </div>
          </div>
      );
  }

  // Calculated Values
  const yieldPerAcre = prediction ? (prediction * 0.4047).toFixed(2) : '--';
  const totalYield = prediction ? ((prediction * 0.4047) * (details.area_size || 1)).toFixed(1) : '--';
  const predictedPrice = pricePrediction ? pricePrediction.toLocaleString('en-IN') : '--';
  const estimatedRevenue = (prediction && pricePrediction) ? (parseFloat(totalYield) * pricePrediction).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '--';

  // Feat 2: Yield Benchmarking
  let benchmarkBadge = null;
  if (prediction && details.taluka && talukaStats[details.taluka]) {
      // API prediction is T/Ha, taluka stats are T/Ha. Convert taluka stats to T/Ac
      const talukaAvgYieldAc = talukaStats[details.taluka].avgYield * 0.4047;
      const currentYieldAc = parseFloat(yieldPerAcre);
      
      const percentDiff = ((currentYieldAc - talukaAvgYieldAc) / talukaAvgYieldAc) * 100;
      const isAbove = percentDiff >= 0;
      const diffAbs = Math.abs(percentDiff).toFixed(1);
      
      benchmarkBadge = {
          text: `${isAbove ? '↑' : '↓'} ${diffAbs}% ${t('fieldDetails.prediction.vsRegionalAvg')}`,
          color: isAbove ? '#10b981' : '#ef4444',
          bg: isAbove ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          icon: isAbove ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
          avgVal: talukaAvgYieldAc.toFixed(2)
      };
  }

  // Harvest Window Calculations
  let harvestDateStr = 'Not Available';
  let daysRemaining = null;
  let harvestStatus = 'Pending';
  let harvestColor = '#64748b'; // default Slate

  if (details.planting_date && harvestPrediction) {
    const pDate = new Date(details.planting_date);
    const hDate = new Date(pDate);
    hDate.setDate(hDate.getDate() + harvestPrediction);
    
    harvestDateStr = hDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const today = new Date();
    const diffTime = hDate - today;
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
        harvestStatus = 'Overdue';
        daysRemaining = Math.abs(daysRemaining); // e.g. 5 Days Overdue
        harvestColor = '#ef4444'; // Red
    } else if (daysRemaining <= 30) {
        harvestStatus = 'Action Phase';
        harvestColor = '#f59e0b'; // Amber
    } else {
        harvestStatus = 'Growing';
        harvestColor = '#3b82f6'; // Blue
    }
  }

  // Feat 3: Smart Agronomic Alerts
  let agronomicAlert = null;
  if (details.planting_date) {
      const pDate = new Date(details.planting_date);
      const today = new Date();
      const ageInDays = Math.floor((today - pDate) / (1000 * 60 * 60 * 24));
      
      if (ageInDays < 0) {
          agronomicAlert = { title: "Pre-Planting", action: "Prepare soil and ensure adequate basal fertilizer application.", color: "#8b5cf6" }; // Purple
      } else if (ageInDays <= 30) {
          agronomicAlert = { title: "Germination Phase", action: "Monitor initial shoot emergence & soil moisture closely.", color: "#3b82f6" }; // Blue
      } else if (ageInDays <= 45) {
          agronomicAlert = { title: "Early Tillering", action: "Optimal window for 1st top dressing of Nitrogen fertilizer.", color: "#10b981" }; // Green
      } else if (ageInDays <= 100) {
          agronomicAlert = { title: "Grand Tillering", action: "Maintain strong weed control and check for early shoot borer.", color: "#f59e0b" }; // Amber
      } else if (ageInDays <= 130) {
          agronomicAlert = { title: "Grand Growth Setup", action: "Crucial time for earthing-up and final N-P-K fertilizer dose.", color: "#f97316" }; // Orange
      } else if (ageInDays <= 250) {
          agronomicAlert = { title: "Peak Growth", action: "Watch for water stress and leaf health (rust/smut).", color: "#14b8a6" }; // Teal
      } else if (ageInDays <= 320) {
          agronomicAlert = { title: "Early Maturity", action: "Gradually reduce irrigation to aid sucrose accumulation.", color: "#6366f1" }; // Indigo
      } else {
          agronomicAlert = { title: "Harvesting Phase", action: "Conduct Brix tests to confirm sugar content for harvest.", color: "#ef4444" }; // Red
      }
      agronomicAlert.age = ageInDays;
  }

  // Feat 4: Local Trend Mock Data Generator
  const generateTrendData = () => {
      const baseYield = talukaStats[details.taluka]?.avgYield * 0.4047 || 35; // Default 35 T/Ac
      const basePrice = talukaStats[details.taluka]?.avgPrice || 3000;
      
      return [
          { year: '2020', yield: baseYield * 0.92, price: basePrice * 0.85 },
          { year: '2021', yield: baseYield * 0.98, price: basePrice * 0.90 },
          { year: '2022', yield: baseYield * 1.05, price: basePrice * 0.98 },
          { year: '2023', yield: baseYield * 0.95, price: basePrice * 1.10 },
          { year: '2024', yield: baseYield * 1.02, price: basePrice * 1.05 }
      ].map(d => ({ ...d, yield: parseFloat(d.yield.toFixed(1)), price: Math.round(d.price) }));
  };
  const trendData = generateTrendData();

  // Feat 5: Water Retention Risk Heuristic
  const getSoilRisk = () => {
       const soil = details.soil_type?.toLowerCase() || '';
       const irrigation = details.irrigation_method?.toLowerCase() || '';
       const temp = currentWeather.Avg_Max_Temp_Celsius;
       
       if (soil.includes('sandy') && irrigation.includes('rainfed')) {
           return { status: 'High Drought Risk', msg: 'Sandy soil drains fast. Rainfed irrigation is insufficient.', color: '#ef4444', icon: <AlertTriangle size={24} /> };
       } else if (soil.includes('clay') && irrigation.includes('flood') && temp < 30) {
           return { status: 'Waterlogging Risk', msg: 'Heavy clay and flood irrigation may reduce root aeration.', color: '#f59e0b', icon: <Waves size={24} /> };
       } else if (irrigation.includes('drip') || irrigation.includes('sprinkler')) {
           return { status: 'Optimal Moisture Control', msg: 'Micro-irrigation ensures efficient water retention.', color: '#10b981', icon: <Droplets size={24} /> };
       } else {
           return { status: 'Moderate Risk', msg: 'Monitor soil moisture regularly during dry spells.', color: '#64748b', icon: <AlertTriangle size={24} /> };
       }
  };
  const soilRisk = getSoilRisk();

  return (
    <div className="bento-wrapper">
      {/* Header Section */}
      <div className="bento-header">
        <div>
          <h2 className="text-gradient">{t('fieldDetails.prediction.fieldIntelligence')}</h2>
          <div className="weather-pill">
            <MapPin size={14} /> {details.taluka} | <ThermometerSun size={14} /> {currentWeather.Avg_Max_Temp_Celsius}°C
          </div>
        </div>
        <button onClick={fetchPrediction} className="refresh-btn" disabled={loading}>
          <RefreshCcw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* FEAT 3: SMART AGRONOMIC ALERTS (Top Banner Level) */}
      {agronomicAlert && (
          <div className="bento-card" style={{ marginBottom: '1.5rem', background: '#f8fafc', borderLeft: `6px solid ${agronomicAlert.color}` }}>
             <div style={{ background: `${agronomicAlert.color}15`, color: agronomicAlert.color, padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px', width: '56px' }}>
                 <Activity size={28} />
             </div>
             <div style={{ flex: 1, marginLeft: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 700 }}>{agronomicAlert.title}</h3>
                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>{t('fieldDetails.prediction.cropAge', { age: agronomicAlert.age })}</span>
                 </div>
                 <p style={{ margin: 0, color: '#475569', fontSize: '1rem', lineHeight: '1.5' }}>{agronomicAlert.action}</p>
             </div>
          </div>
      )}

      {/* --- THE COMMAND CENTER: Unified Yield & Price (Top Spread) --- */}
      <div className="command-center-container">
          <div className="command-center">
              <div className="command-bg-glow"></div>
              
              {/* Left Side: Yield Potential */}
              <div className="command-item">
                  <span className="command-label">
                     <div className="icon-box" style={{ width: '36px', height: '36px', background: '#ecfdf5', color: '#10b981', borderRadius: '10px' }}><Leaf size={20} /></div>
                     {t('fieldDetails.prediction.yieldPotential')}
                  </span>
                  
                  {loading ? <span className="loader-text" style={{ fontSize: '2rem' }}>{t('fieldDetails.prediction.analyzing')}</span> : (
                      <>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                              <h1 className="command-value" style={{ color: '#10b981' }}>{yieldPerAcre}</h1>
                              <span className="command-unit">{t('fieldDetails.prediction.tonsPerAcre')}</span>
                          </div>
                          
                          {benchmarkBadge && (
                              <div style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                  background: benchmarkBadge.bg, color: benchmarkBadge.color,
                                  padding: '0.4rem 0.8rem', borderRadius: '16px', marginTop: '1rem',
                                  fontSize: '0.95rem', fontWeight: 600, alignSelf: 'flex-start'
                              }}>
                                  {benchmarkBadge.icon} {benchmarkBadge.text}
                              </div>
                          )}
                      </>
                  )}
              </div>

              {/* Right Side: Predicted Price & Revenue */}
              <div className="command-item">
                  <span className="command-label">
                     <div className="icon-box" style={{ width: '36px', height: '36px', background: '#eff6ff', color: '#3b82f6', borderRadius: '10px' }}><IndianRupee size={20} /></div>
                     {t('fieldDetails.prediction.predictedPrice')}
                  </span>
                  
                  {loading ? <span className="loader-text" style={{ fontSize: '2rem' }}>{t('fieldDetails.prediction.analyzing')}</span> : (
                      <>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                              <h1 className="command-value" style={{ color: '#3b82f6' }}>₹{predictedPrice}</h1>
                              <span className="command-unit">{t('fieldDetails.prediction.perTon')}</span>
                          </div>
                          
                          {/* Inner Revenue Pillar */}
                          <div style={{ 
                              marginTop: '1.5rem', padding: '1rem 1.5rem', background: '#f8fafc', 
                              border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', 
                              justifyContent: 'space-between', alignItems: 'center'
                          }}>
                              <div>
                                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('fieldDetails.prediction.estRevenue')}</span>
                                  <h3 style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '1.4rem' }}>₹{estimatedRevenue}</h3>
                              </div>
                              <Banknote size={28} color="#94a3b8" />
                          </div>
                      </>
                  )}
              </div>
          </div>
      </div>

      {/* --- STRUCTURAL GRID (3 Columns) --- */}
      <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>

        {/* INFO CARD: Total Harvest */}
        <div className="bento-card" style={{ background: '#fff7ed', borderColor: '#ffedd5' }}>
           <div className="icon-box" style={{ background: '#ffedd5', color: '#ea580c' }}><Sprout size={24} /></div>
           <div style={{ marginTop: '1.5rem' }}>
             <span className="card-label" style={{ color: '#9a3412', marginBottom: '0.2rem', display: 'block' }}>{t('fieldDetails.prediction.expectedHarvest')}</span>
             <h3 style={{ fontSize: '2rem', margin: '0', color: '#c2410c', fontWeight: 800, letterSpacing: '-1px' }}>{loading ? '...' : totalYield} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ea580c' }}>{t('fieldDetails.prediction.tons')}</span></h3>
             <span style={{ fontSize: '0.9rem', color: '#fdba74', fontWeight: 500 }}>{t('fieldDetails.prediction.forAcres', { acres: details.area_size })}</span>
           </div>
        </div>

        {/* FEAT 1: OPTIMAL HARVEST WINDOW CARD */}
        <div className="bento-card" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
           <div className="icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}><Timer size={24} /></div>
           <div style={{ marginTop: '1.5rem' }}>
             <span className="card-label" style={{ color: '#166534', marginBottom: '0.2rem', display: 'block' }}>{t('fieldDetails.prediction.optimalHarvestDate')}</span>
             <h3 style={{ fontSize: '1.8rem', margin: '0', color: '#15803d', fontWeight: 800, letterSpacing: '-0.5px' }}>{loading ? '...' : harvestDateStr}</h3>
             
             {daysRemaining !== null && !loading && (
                 <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                        background: harvestColor, color: 'white', padding: '0.2rem 0.6rem', 
                        borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600
                    }}>
                        {harvestStatus}
                    </span>
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                        {daysRemaining} {t('fieldDetails.prediction.days')} 
                    </span>
                 </div>
             )}
           </div>
        </div>

        {/* FEAT 5: SOIL & MOISTURE RISK */}
        <div className="bento-card" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
           <div className="icon-box" style={{ background: `${soilRisk.color}15`, color: soilRisk.color }}>
               {soilRisk.icon}
           </div>
           <div style={{ marginTop: '1.5rem' }}>
             <span className="card-label" style={{ color: '#475569', marginBottom: '0.2rem', display: 'block' }}>{t('fieldDetails.prediction.moistureRisk')}</span>
             <h3 style={{ fontSize: '1.5rem', margin: '0', color: soilRisk.color, fontWeight: 700, letterSpacing: '-0.5px' }}>{soilRisk.status}</h3>
             <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5' }}>{soilRisk.msg}</p>
           </div>
        </div>

        {/* --- ROW 4: REGIONAL CONTEXT & TRENDS --- */}

        {/* CONTEXT CARD: Rainfall */}
        <div className="bento-card" style={{ background: '#f8fafc', borderColor: '#f1f5f9' }}>
           <div className="icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}><Droplets size={24} /></div>
           <div style={{ marginTop: '1.5rem' }}>
             <span className="card-label" style={{ color: '#475569', marginBottom: '0.2rem', display: 'block' }}>{t('fieldDetails.prediction.avgRainfall')}</span>
             <h3 style={{ fontSize: '1.8rem', margin: '0', color: '#0369a1', fontWeight: 800 }}>{currentWeather.Accumulated_Rainfall_mm} <span style={{ fontSize: '1rem', fontWeight: 600 }}>{t('fieldDetails.prediction.mm')}</span></h3>
             <span style={{ fontSize: '0.9rem', color: '#7dd3fc', fontWeight: 500 }}>{t('fieldDetails.prediction.regionalAverage')}</span>
           </div>
        </div>

        {/* FEAT 4: REGIONAL PERFORMANCE TREND CHART (Full Width Bottom) */}
        <div className="bento-card" style={{ gridColumn: 'span 2', background: '#ffffff', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', fontWeight: 700 }}>{t('fieldDetails.prediction.regionalHistory')}</h3>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>{t('fieldDetails.prediction.trendsDesc', { taluka: details.taluka })}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}><span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></span> {t('fieldDetails.prediction.yieldLabel')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}><span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%' }}></span> {t('fieldDetails.prediction.priceLabel')}</div>
                </div>
            </div>
            
            <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <XAxis dataKey="year" stroke="#cbd5e1" tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} />
                        <YAxis yAxisId="left" stroke="#cbd5e1" tick={{fill: '#94a3b8', fontSize: 13}} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#cbd5e1" tick={{fill: '#94a3b8', fontSize: 13}} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', color: '#1e293b', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 600, fontSize: '1rem' }}
                            labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}
                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="yield" name={t('fieldDetails.prediction.chartYield')} stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }} />
                        <Line yAxisId="right" type="monotone" dataKey="price" name={t('fieldDetails.prediction.chartPrice')} stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PredictionPanel;
