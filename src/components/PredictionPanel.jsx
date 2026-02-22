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
  Calendar
} from 'lucide-react';
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
  const [prediction, setPrediction] = useState(null);
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

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'Prediction API failed');
      }
      
      const data = await response.json();
      setPrediction(data.predicted_yield);
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
                      <h2 style={{ color: '#E65100' }}>Setup Required ⚠️</h2>
                      <p style={{ margin: '1rem 0', color: '#5D4037' }}>{error}</p>
                      <p style={{ fontSize: '0.9rem' }}>Go to the <strong>Configuration Tab</strong> to complete your field details.</p>
                  </div>
              </div>
          </div>
      );
  }

  // Calculated Values
  const yieldPerAcre = prediction ? (prediction * 0.4047).toFixed(2) : '--';
  const totalYield = prediction ? ((prediction * 0.4047) * (details.area_size || 1)).toFixed(1) : '--';

  return (
    <div className="bento-wrapper">
      {/* Header Section */}
      <div className="bento-header">
        <div>
          <h2 className="text-gradient">Field Intelligence</h2>
          <div className="weather-pill">
            <MapPin size={14} /> {details.taluka} | <ThermometerSun size={14} /> {currentWeather.Avg_Max_Temp_Celsius}°C
          </div>
        </div>
        <button onClick={fetchPrediction} className="refresh-btn" disabled={loading}>
          <RefreshCcw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="bento-grid">
        
        {/* HERO CARD: Yield Potential */}
        <div className="bento-card hero-card">
          <div className="card-bg-glow"></div>
          <div className="hero-content">
            <div className="hero-top">
              <div className="icon-box green"><Leaf size={24} /></div>
              <span className="card-label">Yield Potential</span>
            </div>
            <div className="hero-main">
              {loading ? <span className="loader-text">Analyzing...</span> : (
                <>
                  <h1 className="hero-value">{yieldPerAcre}</h1>
                  <span className="hero-unit">Tonnes / Acre</span>
                </>
              )}
            </div>
            <div className="hero-footer">
              <TrendingUp size={16} /> 
              <span>Based on <strong>{details.variety}</strong> crop data</span>
            </div>
          </div>
        </div>

        {/* INFO CARD: Total Harvest */}
        <div className="bento-card info-card">
           <div className="icon-box orange"><Sprout size={20} /></div>
           <div>
             <span className="card-label">Est. Harvest</span>
             <h3 className="info-value">{loading ? '...' : totalYield} <small>T</small></h3>
             <span className="subtext">For {details.area_size} Acres</span>
           </div>
        </div>

        {/* CONTEXT CARD: Rainfall */}
        <div className="bento-card context-card">
           <div className="icon-box blue"><Droplets size={20} /></div>
           <div>
             <span className="card-label">Annual Rainfall</span>
             <h3 className="info-value">{currentWeather.Accumulated_Rainfall_mm} <small>mm</small></h3>
             <span className="subtext">Regional Avg</span>
           </div>
        </div>

        {/* WIDGET CARD: Planting Date */}
        <div className="bento-card widget-card">
            <div className="icon-box purple"><Calendar size={20} /></div>
            <div>
              <span className="card-label">Planting</span>
              <h4 className="widget-value">{details.planting_date || 'Not Set'}</h4>
              <span className="subtext">{details.season} Season</span>
            </div>
        </div>

        {/* PLACEHOLDER: Soil */}
        <div className="bento-card placeholder-card">
           <div className="center-content">
             <span className="coming-soon-badge">Coming Soon</span>
             <h4>Soil Neural Net</h4>
             <p>AI Analysis of N-P-K levels</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default PredictionPanel;
