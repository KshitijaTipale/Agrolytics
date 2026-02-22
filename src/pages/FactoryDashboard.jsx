import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Users, Droplets, TrendingUp, TrendingDown, AlertTriangle, Factory, Calendar, Search, Map as MapIcon, Activity, Leaf, BarChart3, Thermometer, Brain, Zap, Loader2, Clock } from 'lucide-react'
import talukaStats from '../data/taluka_stats.json'
import { fetchBatchPredictions, fetchHarvestPredictions } from '../services/yieldPredictionService'
import { generateRiskAlerts } from '../services/riskAnalysisService'

// --- HELPER: Aggregate all Talukas for "All Regions" view ---
const getAggregatedData = () => {
  const allTalukas = Object.entries(talukaStats)
  const count = allTalukas.length || 1
  const sum = (key) => allTalukas.reduce((s, [, d]) => s + (d[key] || 0), 0)
  const avg = (key) => parseFloat((sum(key) / count).toFixed(2))

  const healthExcellent = allTalukas.reduce((s, [, d]) => s + (d.cropHealth?.excellent || 0), 0)
  const healthModerate = allTalukas.reduce((s, [, d]) => s + (d.cropHealth?.moderate || 0), 0)
  const healthPoor = allTalukas.reduce((s, [, d]) => s + (d.cropHealth?.poor || 0), 0)
  const healthTotal = healthExcellent + healthModerate + healthPoor || 1

  const varietyTotals = {}, varietyCounts = {}
  allTalukas.forEach(([, d]) => { Object.entries(d.varietyPerformance || {}).forEach(([v, y]) => { varietyTotals[v] = (varietyTotals[v] || 0) + y; varietyCounts[v] = (varietyCounts[v] || 0) + 1 }) })
  const varietyPerformance = {}
  Object.keys(varietyTotals).forEach(v => { varietyPerformance[v] = parseFloat((varietyTotals[v] / varietyCounts[v]).toFixed(2)) })

  const seasonTotals = {}, seasonCounts = {}
  allTalukas.forEach(([, d]) => { Object.entries(d.seasonPerformance || {}).forEach(([s, y]) => { seasonTotals[s] = (seasonTotals[s] || 0) + y; seasonCounts[s] = (seasonCounts[s] || 0) + 1 }) })
  const seasonPerformance = {}
  Object.keys(seasonTotals).forEach(s => { seasonPerformance[s] = parseFloat((seasonTotals[s] / seasonCounts[s]).toFixed(2)) })

  const yearTotals = {}, yearCounts = {}
  allTalukas.forEach(([, d]) => { Object.entries(d.yearlyTrend || {}).forEach(([yr, y]) => { yearTotals[yr] = (yearTotals[yr] || 0) + y; yearCounts[yr] = (yearCounts[yr] || 0) + 1 }) })
  const yearlyTrend = {}
  Object.keys(yearTotals).sort().forEach(yr => { yearlyTrend[yr] = parseFloat((yearTotals[yr] / yearCounts[yr]).toFixed(2)) })

  return {
    fieldCount: sum('fieldCount'), avgYield: avg('avgYield'), totalArea: parseFloat(sum('totalArea').toFixed(2)),
    totalEstYield: sum('totalEstYield'), avgNDVI: avg('avgNDVI'), avgRainfall: avg('avgRainfall'),
    avgHumidity: avg('avgHumidity'), avgMaxTemp: avg('avgMaxTemp'), avgMinTemp: avg('avgMinTemp'),
    avgHarvestDuration: Math.round(avg('avgHarvestDuration')),
    cropHealth: { excellent: healthExcellent, moderate: healthModerate, poor: healthPoor, excellentPct: parseFloat((healthExcellent / healthTotal * 100).toFixed(1)), moderatePct: parseFloat((healthModerate / healthTotal * 100).toFixed(1)), poorPct: parseFloat((healthPoor / healthTotal * 100).toFixed(1)) },
    varietyPerformance, seasonPerformance,
    topVariety: Object.keys(varietyPerformance).reduce((a, b) => varietyPerformance[a] > varietyPerformance[b] ? a : b, ''),
    topSeason: Object.keys(seasonPerformance).reduce((a, b) => seasonPerformance[a] > seasonPerformance[b] ? a : b, ''),
    yearlyTrend
  }
}

const FactoryDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [factoryName, setFactoryName] = useState('Central Factory Command')
  const [selectedTaluka, setSelectedTaluka] = useState('All Regions')
  const [searchTerm, setSearchTerm] = useState('')
  const [fields, setFields] = useState([])

  // Phase 2: AI Predictions
  const [aiPredictions, setAiPredictions] = useState(null)
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [predictionsError, setPredictionsError] = useState(null)

  // Phase 3: Harvest Queue
  const [harvestQueue, setHarvestQueue] = useState([])
  const [harvestLoading, setHarvestLoading] = useState(false)

  const talukaNames = Object.keys(talukaStats)

  const currentData = useMemo(() => {
    if (selectedTaluka === 'All Regions') return getAggregatedData()
    return talukaStats[selectedTaluka] || getAggregatedData()
  }, [selectedTaluka])

  // Current AI prediction data for selected Taluka
  const currentAI = useMemo(() => {
    if (!aiPredictions) return null
    if (selectedTaluka === 'All Regions') return aiPredictions.allRegions
    return aiPredictions.byTaluka?.[selectedTaluka] || null
  }, [aiPredictions, selectedTaluka])

  useEffect(() => { fetchFactoryData() }, [])

  const fetchFactoryData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/factory/auth'); return }
      if (user.user_metadata?.factory_name) setFactoryName(user.user_metadata.factory_name)

      const { data: fieldsData } = await supabase
        .from('fields')
        .select(`id, name, area_size, field_details ( taluka, variety ), farmers:farmer_id ( users ( full_name ) )`)

      const processedFields = (fieldsData || []).map(field => {
        const fName = field.farmers?.users?.full_name || field.farmers?.full_name || 'Unknown Farmer'
        const detailsObj = Array.isArray(field.field_details) ? field.field_details[0] : field.field_details
        return { ...field, farmerName: fName, taluka: detailsObj?.taluka || 'Unknown', variety: detailsObj?.variety || '-', area: parseFloat(field.area_size || 0).toFixed(2) }
      })
      setFields(processedFields)
    } catch (error) {
      console.error('Error fetching data:', error.message)
    } finally { setLoading(false) }

    // Fire off AI predictions in background (non-blocking)
    loadPredictions()
  }

  const loadPredictions = async () => {
    setPredictionsLoading(true)
    setHarvestLoading(true)
    setPredictionsError(null)
    try {
      const [yieldResult, harvestResult] = await Promise.all([
        fetchBatchPredictions(),
        fetchHarvestPredictions()
      ])
      setAiPredictions(yieldResult)
      setHarvestQueue(harvestResult || [])
    } catch (err) {
      console.error('Prediction batch failed:', err)
      setPredictionsError('AI predictions unavailable')
    } finally {
      setPredictionsLoading(false)
      setHarvestLoading(false)
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/') }

  const filteredFields = fields.filter(f => {
    const matchTaluka = selectedTaluka === 'All Regions' || (f.taluka || '').toLowerCase().includes(selectedTaluka.toLowerCase())
    const matchSearch = (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (f.farmerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchTaluka && matchSearch
  })

  const yieldTrend = useMemo(() => {
    const years = Object.keys(currentData?.yearlyTrend || {}).sort()
    if (years.length < 2) return 'stable'
    const last = currentData.yearlyTrend[years[years.length - 1]]
    const prev = currentData.yearlyTrend[years[years.length - 2]]
    return last > prev ? 'up' : last < prev ? 'down' : 'stable'
  }, [currentData])

  // Phase 4: Active Risk Alerts
  const activeAlerts = useMemo(() => {
    return generateRiskAlerts(filteredFields, talukaStats)
  }, [filteredFields])

  // --- RENDER HELPERS ---

  const renderTopBar = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Factory size={32} color="#3b82f6" /> {factoryName}
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="status-badge running"><span className="status-indicator running"></span> Mill Active</span>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select className="select-modern" value={selectedTaluka} onChange={(e) => setSelectedTaluka(e.target.value)}>
          <option value="All Regions">🌍 All Regions ({Object.values(talukaStats).reduce((s, d) => s + d.fieldCount, 0)} fields)</option>
          {talukaNames.map(t => <option key={t} value={t}>📍 {t} ({talukaStats[t].fieldCount} fields)</option>)}
        </select>
        <button onClick={handleLogout} className="action-btn-urgent" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>Logout</button>
      </div>
    </div>
  )

  const renderMetrics = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Avg Yield */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <span className="card-label">Avg Yield (Dataset)</span>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '8px' }}><TrendingUp size={20} color="#10b981" /></div>
        </div>
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {currentData?.avgYield || 0} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>T/Ha</span>
          {yieldTrend === 'up' && <TrendingUp size={20} color="#10b981" />}
          {yieldTrend === 'down' && <TrendingDown size={20} color="#ef4444" />}
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Across {currentData?.fieldCount?.toLocaleString() || 0} historical records</p>
      </div>

      {/* AI Predicted Yield — Phase 2 NEW */}
      <div className="glass-card" style={{ border: '1px solid rgba(139,92,246,0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', padding: '0.2rem 0.7rem', borderRadius: '0 0 0 8px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>AI LIVE</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <span className="card-label">AI Predicted Yield</span>
          <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.5rem', borderRadius: '8px' }}><Brain size={20} color="#8b5cf6" /></div>
        </div>
        {predictionsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
            <Loader2 size={20} className="spin-slow" color="#8b5cf6" />
            <span style={{ color: '#a78bfa', fontSize: '0.9rem' }}>Running predictions...</span>
          </div>
        ) : currentAI ? (
          <>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.3rem 0', color: '#a78bfa' }}>
              {currentAI.avgPredicted || '—'} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>T/Ha</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{currentAI.fieldCount || 0} fields predicted • {currentAI.totalPredicted?.toLocaleString() || 0} T total</p>
          </>
        ) : (
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{predictionsError || 'No configured fields to predict'}</p>
            {aiPredictions && <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.3rem 0 0' }}>{aiPredictions.unconfiguredCount || 0} fields need configuration</p>}
          </div>
        )}
      </div>

      {/* Crop Health */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <span className="card-label">Crop Health (NDVI)</span>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px' }}><Activity size={20} color="#3b82f6" /></div>
        </div>
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.3rem 0', color: '#10b981' }}>{currentData?.cropHealth?.excellentPct || 0}% <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Excellent</span></h2>
        <div className="progress-bar-container" style={{ height: '10px', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${currentData?.cropHealth?.excellentPct || 0}%`, background: '#10b981' }}></div>
            <div style={{ width: `${currentData?.cropHealth?.moderatePct || 0}%`, background: '#f59e0b' }}></div>
            <div style={{ width: `${currentData?.cropHealth?.poorPct || 0}%`, background: '#ef4444' }}></div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>🟢 {currentData?.cropHealth?.excellentPct}%</span>
          <span>🟡 {currentData?.cropHealth?.moderatePct}%</span>
          <span>🔴 {currentData?.cropHealth?.poorPct}%</span>
        </div>
      </div>

      {/* Climate Summary */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <span className="card-label">Climate Profile</span>
          <div style={{ background: 'rgba(244,63,94,0.1)', padding: '0.5rem', borderRadius: '8px' }}><Thermometer size={20} color="#f43f5e" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
          <div><span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Avg Rainfall</span><strong>{currentData?.avgRainfall || 0} mm</strong></div>
          <div><span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Avg Humidity</span><strong>{currentData?.avgHumidity || 0}%</strong></div>
          <div><span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Max Temp</span><strong>{currentData?.avgMaxTemp || 0}°C</strong></div>
          <div><span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>Min Temp</span><strong>{currentData?.avgMinTemp || 0}°C</strong></div>
        </div>
      </div>
    </div>
  )

  // AI vs Historical Comparison — Phase 2 NEW
  const renderAIComparison = () => {
    if (!currentAI || !currentAI.fieldCount) return null
    const historical = currentData?.avgYield || 0
    const aiAvg = currentAI.avgPredicted || 0
    const diff = aiAvg - historical
    const diffPct = historical ? ((diff / historical) * 100).toFixed(1) : 0
    const isPositive = diff >= 0

    return (
      <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(139,92,246,0.2)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.05))' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', fontSize: '1.1rem' }}>
          <Zap size={20} color="#f59e0b" /> AI vs Historical Yield Comparison
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          {/* Historical */}
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>📊 Historical Avg</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{historical} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>T/Ha</span></div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>{currentData?.fieldCount?.toLocaleString()} dataset records</div>
          </div>
          {/* AI */}
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(139,92,246,0.08)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>🤖 AI Predicted Avg</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa' }}>{aiAvg} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>T/Ha</span></div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>{currentAI.fieldCount} registered fields</div>
          </div>
          {/* Difference */}
          <div style={{ textAlign: 'center', padding: '1rem', background: isPositive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '12px', border: `1px solid ${isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{isPositive ? '📈' : '📉'} Deviation</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444' }}>
              {isPositive ? '+' : ''}{diff.toFixed(1)} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>T/Ha</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: isPositive ? '#10b981' : '#ef4444', marginTop: '0.3rem', fontWeight: 600 }}>
              {isPositive ? '+' : ''}{diffPct}% vs historical
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderInsights = () => {
    const varieties = currentData?.varietyPerformance || {}
    const seasons = currentData?.seasonPerformance || {}
    const yearlyTrend = currentData?.yearlyTrend || {}
    const maxVarietyYield = Math.max(...Object.values(varieties), 1)
    const maxSeasonYield = Math.max(...Object.values(seasons), 1)
    const yearEntries = Object.entries(yearlyTrend).sort(([a], [b]) => a.localeCompare(b))
    const maxYearYield = Math.max(...yearEntries.map(([, v]) => v), 1)

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Variety Performance */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <Leaf size={20} color="#10b981" /> Variety Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {Object.entries(varieties).sort(([, a], [, b]) => b - a).map(([variety, avgYield]) => (
              <div key={variety}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                  <span style={{ color: variety === currentData?.topVariety ? '#10b981' : '#cbd5e1', fontWeight: variety === currentData?.topVariety ? 700 : 400 }}>
                    {variety === currentData?.topVariety ? '⭐ ' : ''}{variety}
                  </span>
                  <span style={{ fontWeight: 600 }}>{avgYield} T/Ha</span>
                </div>
                <div className="progress-bar-container" style={{ height: '6px' }}><div className="progress-bar-fill" style={{ width: `${(avgYield / maxVarietyYield) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Season Performance */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <Calendar size={20} color="#f59e0b" /> Season Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(seasons).sort(([, a], [, b]) => b - a).map(([season, avgYield]) => (
              <div key={season} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '100px', fontSize: '0.85rem', color: season === currentData?.topSeason ? '#f59e0b' : '#cbd5e1', fontWeight: season === currentData?.topSeason ? 700 : 400 }}>
                  {season === currentData?.topSeason ? '🏆 ' : ''}{season}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="progress-bar-container" style={{ height: '8px' }}>
                    <div className="progress-bar-fill" style={{ width: `${(avgYield / maxSeasonYield) * 100}%`, background: season === 'Adsali' ? 'linear-gradient(90deg, #10b981, #34d399)' : season === 'Pre-seasonal' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                  </div>
                </div>
                <span style={{ fontWeight: 600, minWidth: '70px', textAlign: 'right', fontSize: '0.9rem' }}>{avgYield} T/Ha</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem', color: '#fbbf24' }}>
            💡 <strong>Adsali</strong> consistently outperforms by ~40 T/Ha due to longer growth (~{currentData?.avgHarvestDuration || 430} days avg).
          </div>
        </div>

        {/* Yearly Trend */}
        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <BarChart3 size={20} color="#8b5cf6" /> Yield Trend (2019–2024)
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', paddingBottom: '30px', position: 'relative' }}>
            {yearEntries.map(([year, avgYield], i) => {
              const heightPct = Math.max(10, (avgYield / maxYearYield) * 100)
              const prevYield = i > 0 ? yearEntries[i - 1][1] : avgYield
              const isUp = avgYield >= prevYield
              return (
                <div key={year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isUp ? '#10b981' : '#ef4444' }}>{avgYield}</span>
                  <div style={{ width: '100%', maxWidth: '60px', height: `${heightPct}%`, background: isUp ? 'linear-gradient(0deg, #10b981, #34d399)' : 'linear-gradient(0deg, #ef4444, #f87171)', borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }}></div>
                  <span style={{ position: 'absolute', bottom: '0', fontSize: '0.75rem', color: '#94a3b8' }}>{year}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Smart Harvest Scheduling — Phase 3 NEW
  const renderHarvestQueue = () => {
    // Filter queue by selected Taluka if not "All Regions"
    const displayQueue = selectedTaluka === 'All Regions' 
      ? harvestQueue 
      : harvestQueue.filter(q => (q.taluka || '').toLowerCase() === selectedTaluka.toLowerCase())

    return (
      <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
            <Clock size={20} color="#ef4444" /> Smart Harvest Scheduling
          </h3>
          {harvestLoading && <Loader2 size={16} className="spin-slow" color="#ef4444" />}
        </div>
        
        {displayQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            {harvestLoading ? 'Calculating optimal harvest dates...' : 'No fields scheduled for harvest. Update planting dates to see predictions.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {displayQueue.slice(0, 5).map(item => (
              <div key={item.fieldId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', borderLeft: `4px solid ${item.urgency === 'critical' ? '#ef4444' : item.urgency === 'high' ? '#f59e0b' : '#10b981'}` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem' }}>{item.fieldName}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{item.taluka}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{item.farmerName} • {item.area} Ha • {item.variety}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: item.urgency === 'critical' ? '#ef4444' : item.urgency === 'high' ? '#f59e0b' : '#10b981' }}>
                    {item.daysRemaining <= 0 ? 'Ready Now' : `${item.daysRemaining} Days`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Model: {item.predictedDays} days total • Est: {item.expectedDate}
                  </div>
                </div>
              </div>
            ))}
            {displayQueue.length > 5 && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>+ {displayQueue.length - 5} more fields in queue</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Phase 4: Risk Alerts UI
  const renderRiskAlerts = () => {
    if (loading) return null

    return (
      <div className="glass-card" style={{ marginBottom: '2rem', border: activeAlerts.length > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(16,185,129,0.2)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', marginTop: 0, fontSize: '1.1rem' }}>
          {activeAlerts.length > 0 ? <AlertTriangle size={20} color="#f59e0b" /> : <Activity size={20} color="#10b981" />}
          Intelligent Risk Analytics
        </h3>
        
        {activeAlerts.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1.5rem', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', color: '#34d399' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <h4 style={{ margin: '0 0 0.3rem 0', color: '#10b981' }}>All Systems Normal</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No critical agronomic or climate risks detected for the currently displayed fields.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeAlerts.map(alert => {
              const Icon = alert.icon
              const isCritical = alert.severity === 'critical'
              const color = isCritical ? '#ef4444' : '#f59e0b'
              const bg = isCritical ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
              
              return (
                <div key={alert.id} style={{ display: 'flex', gap: '1rem', padding: '1.2rem', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
                  <div style={{ background: bg, padding: '0.8rem', borderRadius: '8px', height: 'fit-content' }}>
                    <Icon size={24} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {alert.title}
                        {isCritical && <span style={{ fontSize: '0.65rem', background: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical</span>}
                      </h4>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color, background: bg, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                        {alert.affectedCount} fields affected
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>{alert.description}</p>
                    <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                      ⚡ <strong>Action:</strong> {alert.action}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderFieldsTable = () => (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', margin: 0 }}>
          <Users size={20} color="#a855f7" /> Registered Fields ({filteredFields.length})
        </h3>
        <div style={{ position: 'relative', width: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 2rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'white', fontSize: '0.85rem', outline: 'none' }} />
        </div>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1e293b' }}>
            <tr>
              {['Field', 'Farmer', 'Taluka', 'Variety', 'Area', 'AI Yield'].map(h => (
                <th key={h} style={{ padding: '0.8rem 0.5rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: '#cbd5e1' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredFields.map(field => {
              const fieldPred = aiPredictions?.fieldPredictions?.[field.id]
              return (
                <tr key={field.id}>
                  <td style={{ padding: '0.7rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#f8fafc' }}>{field.name}</td>
                  <td style={{ padding: '0.7rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#94a3b8' }}>{field.farmerName}</td>
                  <td style={{ padding: '0.7rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ background: 'rgba(15,23,42,0.8)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>{field.taluka}</span>
                  </td>
                  <td style={{ padding: '0.7rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#94a3b8' }}>{field.variety}</td>
                  <td style={{ padding: '0.7rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#3b82f6', fontWeight: 600, fontSize: '0.85rem' }}>{field.area} Ha</td>
                  <td style={{ padding: '0.7rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {predictionsLoading ? (
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>...</span>
                    ) : fieldPred ? (
                      <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.85rem' }}>{fieldPred.toFixed(1)} T/Ha</span>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredFields.length === 0 && !loading && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No fields found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="command-center-bg">
      <div className="dashboard-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '2rem' }}>
        {renderTopBar()}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <Droplets className="spin-slow" size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#94a3b8' }}>Syncing Factory Command Data...</h3>
          </div>
        ) : (
          <>
            {renderMetrics()}
            {renderAIComparison()}
            {renderRiskAlerts()}
            {renderHarvestQueue()}
            {renderInsights()}
            {renderFieldsTable()}
          </>
        )}
      </div>
    </div>
  )
}

export default FactoryDashboard
