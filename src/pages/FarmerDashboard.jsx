import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AddFieldModal from '../components/AddFieldModal'
import ConfirmModal from '../components/ConfirmModal'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '../components/LanguageToggle'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import talukaStats from '../data/taluka_stats.json'
import {
  Sprout, Plus, Trash2, MoreVertical, LayoutGrid, Leaf,
  Thermometer, Droplets, Wind, AlertCircle, CheckCircle2,
  CloudRain, Sun, Calendar, Clock, ArrowRight, BrainCircuit, ShieldCheck, Activity, BarChart2, MapPin, Terminal, Layers, TrendingUp, Smartphone, BellRing
} from 'lucide-react'

// Mock Telemetry Data 
const initialTelemetry = [
  { id: 1, time: 'Just now', msg: 'Syncing edge node metrics.', type: 'info' },
  { id: 2, time: '2m ago', msg: 'Calibrating local NDVI sensor layer.', type: 'warn' },
  { id: 3, time: '15m ago', msg: 'Sentinel-2 imagery successfully ingested.', type: 'success' },
];

const FarmerDashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [farmerName, setFarmerName] = useState('Farmer')
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard | map
  const [telemetryLogs, setTelemetryLogs] = useState(initialTelemetry)
  const [liveWeather, setLiveWeather] = useState(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Real-time telemetry simulation
  useEffect(() => {
    // 1. Fetch Real Live Weather (Open-Meteo API for approx Maharashtra coordinates + no key required)
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=19.09&longitude=74.74&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto');
        const data = await res.json();
        setLiveWeather(data.current);
      } catch (err) {
        console.error('Failed to fetch live weather, falling back to taluka avg:', err);
      }
    };
    fetchWeather();

    // 2. Telemetry logs loop
    const interval = setInterval(() => {
      setTelemetryLogs(prev => {
        const r = Math.random();
        let newLog = null;
        if (r > 0.8) newLog = { id: Date.now(), time: 'Just now', msg: 'Updating localized weather grid.', type: 'info' };
        else if (r > 0.6) newLog = { id: Date.now(), time: 'Just now', msg: 'Cross-referencing soil neural model.', type: 'info' };

        if (newLog) {
          return [newLog, ...prev].slice(0, 5); // Keep last 5 logs
        }
        return prev;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Delete & Menu State
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/')
        return
      }

      // 1. Fetch Farmer Name
      if (user.user_metadata?.full_name) {
        setFarmerName(user.user_metadata.full_name.split(' ')[0])
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          setFarmerName(profile.full_name.split(' ')[0])
        }
      }

      // 2. Fetch Fields & Check config manually vs field_details
      const { data, error } = await supabase
        .from('fields')
        .select(`
          *,
          field_details (
            id,
            planting_date,
            variety
          )
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error('Error fetching data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleAddField = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('fields')
        .insert([{
          name,
          farmer_id: user.id
        }])
        .select(`*, field_details (id, planting_date, variety)`)

      if (error) throw error

      setFields([data[0], ...fields])
    } catch (error) {
      console.error('Error adding field:', error.message)
      alert('Failed to add field')
    }
  }

  const toggleMenu = (id, e) => {
    e.stopPropagation()
    setMenuOpenId(menuOpenId === id ? null : id)
  }

  const confirmDelete = (id, e) => {
    e.stopPropagation()
    setDeleteConfirmId(id)
    setMenuOpenId(null)
  }

  const performDelete = async () => {
    try {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', deleteConfirmId)

      if (error) throw error

      setFields(fields.filter(f => f.id !== deleteConfirmId))
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting field:', error.message)
      alert('Failed to delete field')
    }
  }

  const handleOutsideClick = () => {
    if (menuOpenId) setMenuOpenId(null)
  }

  // Calculate dynamic stats
  const totalFields = fields.length

  // A field is considered unconfigured if field_details is empty or planting_date is null
  const pendingFields = fields.filter(f => {
    // Supabase returns array or null for one-to-many relationship
    const details = Array.isArray(f.field_details) ? f.field_details[0] : f.field_details
    return !details || !details.planting_date
  })

  const configuredFieldsCount = totalFields - pendingFields.length

  const getProgress = (field) => {
    const details = Array.isArray(field.field_details) ? field.field_details[0] : field.field_details
    if (!details || !details.planting_date) return 0

    const plantDate = new Date(details.planting_date)
    const now = new Date()
    // Fake average cane period (12 months approx 365 days)
    const diffTime = Math.abs(now - plantDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let prog = (diffDays / 365) * 100
    if (prog > 100) prog = 100
    return Math.round(prog)
  }

  // Extra Data Logic
  const activeTaluka = fields.length > 0 && fields[0].field_details ?
    (Array.isArray(fields[0].field_details) ? fields[0].field_details[0]?.taluka : fields[0].field_details?.taluka) : null;
  const weatherTaluka = activeTaluka || 'Ahmednagar';
  const weatherStats = talukaStats[weatherTaluka] || talukaStats['Ahmednagar'];

  // Aggy by Variety for Recharts
  const varietyMap = {}
  fields.forEach(f => {
    const details = Array.isArray(f.field_details) ? f.field_details[0] : f.field_details
    if (details && details.variety) {
      varietyMap[details.variety] = (varietyMap[details.variety] || 0) + 1
    }
  })
  const chartData = Object.keys(varietyMap).map(k => ({ name: k, value: varietyMap[k] }))
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  // Generate Smart Calendar Tasks based on actual crop growth
  const upcomingTasks = []
  if (totalFields > 0 && configuredFieldsCount > 0) {
    fields.forEach(f => {
      const details = Array.isArray(f.field_details) ? f.field_details[0] : f.field_details
      if (!details || !details.planting_date) return;

      const plantDate = new Date(details.planting_date)
      const diffDays = Math.ceil(Math.abs(new Date() - plantDate) / (1000 * 60 * 60 * 24))

      if (diffDays >= 30 && diffDays <= 45) {
        upcomingTasks.push({ id: f.id, field: f.name, time: 'Day 30-45 Window', task: 'Fertilizer Application Window (N-P-K)', priority: 'high' })
      } else if (diffDays >= 115 && diffDays <= 125) {
        upcomingTasks.push({ id: f.id, field: f.name, time: 'Day 120 Window', task: 'Earthing up recommended to prevent lodging', priority: 'high' })
      } else if (diffDays >= 300) {
        upcomingTasks.push({ id: f.id, field: f.name, time: 'Day 300+ Window', task: 'Pre-harvest assessment (Sugar sampling)', priority: 'high' })
      } else if (diffDays < 30) {
        upcomingTasks.push({ id: f.id, field: f.name, time: 'Early Phase', task: 'Monitor soil moisture and weed emergence', priority: 'med' })
      } else if (diffDays > 45 && diffDays < 115) {
        upcomingTasks.push({ id: f.id, field: f.name, time: 'Grand Growth', task: 'Monitor leaf health and canopy coverage', priority: 'med' })
      }
    })
  }
  // Trim to 3 most relevant Tasks
  const topTasks = upcomingTasks.slice(0, 3)

  return (
    <div className="dash-dark-container" onClick={handleOutsideClick}>
      {/* Dynamic Background */}
      <div className="dash-dark-bg">
        <div className="glow-orb top-right"></div>
        <div className="glow-orb bottom-left"></div>
      </div>

      <div className="dash-dark-content">
        {/* HEADER SECTION */}
        <header className="dash-top-header">
          <div className="dash-brand-area">
            <img src="/agrolytics.png" alt="Logo" className="dash-logo" />
            <div className="dash-greeting-box">
              <span className="dash-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <h1 className="dash-welcome">{t('header.welcomeBack')}, {farmerName} <span className="wave">👋</span></h1>
            </div>
          </div>

          <div className="dash-header-actions">

            {/* WhatsApp Alert Mock Toggle */}
            <LanguageToggle />
            <div className={`dash-notify-toggle ${notificationsEnabled ? 'on' : 'off'}`} onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
              <Smartphone size={16} />
              <span>{notificationsEnabled ? t('header.smsAlertsOn') : t('header.smsAlertsOff')}</span>
              {notificationsEnabled && <BellRing size={14} className="ring-anim" />}
            </div>

            <div className="dash-system-status">
              <ShieldCheck size={18} color="#10b981" />
              <span>{t('header.systemSecure')}</span>
            </div>
            <button onClick={handleLogout} className="dash-logout-btn">
              {t('header.logout')}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="dash-loading-state">
            <Sprout className="spin-slow" size={40} color="#10b981" />
            <p>{t('loading')}</p>
          </div>
        ) : (
          <div className="dash-main-layout">

            {/* LEFT COLUMN: Fields & Stats */}
            <div className="dash-left-col">

              {/* QUICK STATS ROW */}
              <div className="dash-stats-row">
                <div className="dash-stat-card">
                  <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <LayoutGrid size={24} color="#60a5fa" />
                  </div>
                  <div>
                    <p className="stat-label">{t('stats.totalFields')}</p>
                    <h2 className="stat-value">{totalFields}</h2>
                  </div>
                </div>

                <div className="dash-stat-card">
                  <div className="stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <Activity size={24} color="#34d399" />
                  </div>
                  <div>
                    <p className="stat-label">{t('stats.aiMonitored')}</p>
                    <h2 className="stat-value">{configuredFieldsCount} <span className="stat-sub">/ {totalFields}</span></h2>
                  </div>
                </div>

                <div className="dash-stat-card border-glow-warning">
                  <div className="stat-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <AlertCircle size={24} color="#fbbf24" />
                  </div>
                  <div>
                    <p className="stat-label">{t('stats.actionNeeded')}</p>
                    <h2 className="stat-value" style={{ color: pendingFields.length > 0 ? '#fbbf24' : 'inherit' }}>{pendingFields.length}</h2>
                  </div>
                </div>
              </div>

              {/* MID ROW: Insights & Chart */}
              <div className="dash-mid-row">
                {/* INSIGHTS PANEL (Dynamic) */}
                <div className="dash-widget insights-widget" style={{ marginBottom: 0, height: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div className="widget-header">
                    <h3 className="widget-title"><BrainCircuit size={18} color="#a78bfa" /> {t('widgets.aiInsights')}</h3>
                  </div>
                  <div className="insights-list" style={{ flex: 1 }}>
                    {pendingFields.length > 0 ? (
                      <div className="insight-item warning-insight">
                        <div className="insight-icon"><AlertCircle size={16} /></div>
                        <p>{t('widgets.actionRequiredPending', { count: pendingFields.length })}</p>
                      </div>
                    ) : (
                      <div className="insight-item success-insight">
                        <div className="insight-icon"><CheckCircle2 size={16} /></div>
                        <p>{t('widgets.allFieldsConfigured')}</p>
                      </div>
                    )}

                    {/* Dynamic AI insights based on active fields */}
                    {totalFields > 0 && configuredFieldsCount > 0 && fields.slice(0, 2).map((field, idx) => {
                      const prog = getProgress(field);
                      if (prog < 20) {
                        return (
                          <div key={idx} className="insight-item info-insight">
                            <div className="insight-icon"><Droplets size={16} color="#3b82f6" /></div>
                            <p><b>{field.name}</b>: Germination phase detected. Maintain optimal soil moisture for next 15 days.</p>
                          </div>
                        );
                      } else if (prog >= 20 && prog < 90) {
                        return (
                          <div key={idx} className="insight-item info-insight">
                            <div className="insight-icon"><Activity size={16} color="#10b981" /></div>
                            <p><b>{field.name}</b>: NDVI satellite imagery indicates healthy rapid growth phase. Fertilizer window optimal.</p>
                          </div>
                        );
                      } else {
                        return (
                          <div key={idx} className="insight-item info-insight" style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b' }}>
                            <div className="insight-icon"><Calendar size={16} color="#f59e0b" /></div>
                            <p><b>{field.name}</b>: <b>Harvest Ready!</b> Crop maturity over 90%. Schedule machinery and check mill capacity.</p>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>

                {/* CHART WIDGET (Recharts) */}
                {chartData.length > 0 && (
                  <div className="dash-widget chart-widget" style={{ marginBottom: 0, height: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div className="widget-header">
                      <h3 className="widget-title"><BarChart2 size={16} color="#10b981" /> {t('widgets.cropVarieties')}</h3>
                    </div>
                    <div style={{ width: '100%', height: 180, marginTop: '1rem', flex: 1 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                            itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      {chartData.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                          <span style={{ color: '#94a3b8' }}>{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* NAVIGATION / TABS */}
              <div className="dash-tabs-container">
                <button
                  className={`dash-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutGrid size={16} /> {t('tabs.overview')}
                </button>
                
              </div>

              {activeTab === 'dashboard' && (
                <>
                  {/* FIELDS TITLE AREA */}
                  <div className="dash-section-header">
                    <div>
                      <h2 className="dash-section-title">{t('fields.yourFields')}</h2>
                      <p className="dash-section-sub">{t('fields.selectField')}</p>
                    </div>
                  </div>

                  {/* FIELDS GRID */}
                  <div className="dash-fields-grid">
                    {fields.length === 0 ? (
                      <div className="dash-empty-state">
                        <div className="empty-icon-circle"><Leaf size={40} color="#10b981" /></div>
                        <h3>{t('fields.noFieldsRegistered')}</h3>
                        <p>{t('fields.addFieldPrompt')}</p>
                        <button onClick={() => setIsModalOpen(true)} className="dash-btn-primary mt-4">
                          <Plus size={18} /> {t('fields.addField')}
                        </button>
                      </div>
                    ) : (
                      fields.map(field => {
                        const details = Array.isArray(field.field_details) ? field.field_details[0] : field.field_details
                        const isConfigured = !!(details && details.planting_date);
                        const progress = isConfigured ? getProgress(field) : 0;

                        return (
                          <div
                            key={field.id}
                            className={`dash-smart-card ${!isConfigured ? 'needs-action' : ''}`}
                            onClick={() => navigate(`/farmer/field/${field.id}`)}
                          >
                            <div className="card-top-row">
                              <div className="card-left-group">
                                <div className={`card-icon-box ${isConfigured ? 'configured' : 'pending'}`}>
                                  <Sprout size={20} />
                                </div>
                                <div>
                                  <h3 className="card-field-name">{field.name}</h3>
                                  <div className="card-field-chip">{details?.variety || 'Sugarcane'}</div>
                                </div>
                              </div>

                              <div style={{ position: 'relative' }}>
                                <button className="card-menu-btn" onClick={(e) => toggleMenu(field.id, e)}>
                                  <MoreVertical size={20} />
                                </button>
                                {menuOpenId === field.id && (
                                  <div className="card-dropdown">
                                    <button
                                      className="dropdown-action-del"
                                      onClick={(e) => confirmDelete(field.id, e)}
                                    >
                                      <Trash2 size={16} /> {t('fields.delete')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="card-mid-row">
                              {isConfigured ? (
                                <div className="progress-container">
                                  <div className="progress-header">
                                    <span className="prog-label">{t('fields.growthPhase')}</span>
                                    <span className="prog-val">{progress}%</span>
                                  </div>
                                  <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                  </div>
                                </div>
                              ) : (
                                <div className="action-required-alert">
                                  <AlertCircle size={14} /> {t('fields.setupRequired')}
                                </div>
                              )}
                            </div>

                            <div className="card-bottom-row">
                              <span className="card-date-added">{t('fields.added')} {new Date(field.created_at).toLocaleDateString()}</span>
                              <div className="card-arrow"><ArrowRight size={18} /></div>
                            </div>
                          </div>
                        )
                      }) /* Close map */
                    )}
                  </div>
                </>
              )}

              {activeTab === 'map' && (
                <div className="map-placeholder-container">
                  <div className="map-overlay-glow"></div>
                  <MapPin size={48} color="#10b981" className="bounce-anim" style={{ marginBottom: '1rem' }} />
                  <h3>{t('tabs.mapInitializing')}</h3>
                  <p>{t('tabs.mapAwating')}</p>
                  <button onClick={() => setIsModalOpen(true)} className="dash-btn-outline mt-3">
                    {t('tabs.addNewBoundary')}
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Widgets */}
            <div className="dash-right-col">

              {/* WEATHER WIDGET (Dynamic) */}
              <div className="dash-widget weather-widget">
                <div className="widget-header">
                  <h3 className="widget-title">{t('widgets.localConditions')}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <MapPin size={14} /> {weatherTaluka}
                  </div>
                </div>
                <div className="weather-main-row">
                  <Sun size={48} color="#fbbf24" strokeWidth={1.5} className="weather-icon-anim" />
                  <div>
                    <h2 className="weather-temp">{liveWeather ? Math.round(liveWeather.temperature_2m) : weatherStats.avgMaxTemp}°C</h2>
                    <p className="weather-desc">{liveWeather?.precipitation > 0 ? t('widgets.rainPossible') : t('widgets.clearSunny')}</p>
                  </div>
                </div>
                <div className="weather-details-grid">
                  <div className="weather-detail-item">
                    <Droplets size={16} color="#60a5fa" />
                    <span>{liveWeather ? liveWeather.relative_humidity_2m : weatherStats.avgHumidity}% {t('widgets.hum')}</span>
                  </div>
                  <div className="weather-detail-item">
                    <Thermometer size={16} color="#f87171" />
                    <span>{weatherStats.avgMinTemp}°C {t('widgets.min')}</span>
                  </div>
                  <div className="weather-detail-item">
                    <Wind size={16} color="#94a3b8" />
                    <span>{liveWeather ? liveWeather.wind_speed_10m : '10'} km/h</span>
                  </div>
                  <div className="weather-detail-item">
                    <CloudRain size={16} color="#60a5fa" />
                    <span>{liveWeather ? liveWeather.precipitation : weatherStats.avgRainfall}mm {t('widgets.rain')}</span>
                  </div>
                </div>
              </div>

              {/* SMART CALENDAR / TO-DO WIDGET */}
              {(topTasks.length > 0 || pendingFields.length > 0) && (
                <div className="dash-widget todo-widget">
                  <div className="widget-header">
                    <h3 className="widget-title"><Clock size={16} color="#fbbf24" /> {t('widgets.upcomingTasks')}</h3>
                  </div>
                  <div className="task-list">
                    {pendingFields.length > 0 && (
                      <div className="task-item high-priority">
                        <div className="task-check"><AlertCircle size={14} color="#fbbf24" /></div>
                        <div className="task-content">
                          <h4>{t('widgets.configurePending')}</h4>
                          <span>{t('widgets.immediateSetup')}</span>
                        </div>
                      </div>
                    )}

                    {topTasks.map((task, idx) => (
                      <div key={`${task.id}-${idx}`} className={`task-item ${task.priority === 'high' ? 'high-priority' : 'med-priority'}`}>
                        <div className="task-check"><CheckCircle2 size={14} color={task.priority === 'high' ? '#f87171' : '#10b981'} /></div>
                        <div className="task-content">
                          <h4>{task.task}</h4>
                          <span>{task.time} • {t('widgets.field')} {task.field}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* TELEMETRY WIDGET (Expert Demo) */}
              <div className="dash-widget telemetry-widget">
                <div className="telemetry-header">
                  <Terminal size={14} color="#34d399" /> <span>sys.telemetry_feed</span>
                </div>
                <div className="telemetry-log-box" key={telemetryLogs[0].id}>
                  {telemetryLogs.map((log) => (
                    <div key={log.id} className={`telemetry-row ${log.type}`}>
                      <span className="telemetry-time">[{log.time}]</span>
                      <span className="telemetry-msg">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              

            </div>

          </div>
        )}

        {/* Floating Action Button */}
        {!loading && (
          <button className="dash-fab" onClick={() => setIsModalOpen(true)}>
            <Plus size={28} />
          </button>
        )}
      </div>

      {/* Modals */}
      <AddFieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddField}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Field?"
        message="Are you sure you want to remove this field? This action cannot be undone."
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={performDelete}
      />

      <style>{`
        /* --- DASHBOARD LIGHT THEME ROOT --- */
        .dash-dark-container {
          min-height: 100vh;
          background: #f8fafc; /* Soft off-white background */
          font-family: 'Outfit', sans-serif;
          color: #0f172a; /* Slate 900 for high contrast text */
          position: relative;
          overflow-x: hidden;
        }

        .dash-dark-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          pointer-events: none;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.05; /* Much more subtle for light theme */
        }

        .glow-orb.top-right {
          top: -100px; right: -100px;
          width: 500px; height: 500px;
          background: #10b981;
        }

        .glow-orb.bottom-left {
          bottom: -100px; left: -100px;
          width: 500px; height: 500px;
          background: #3b82f6;
        }

        .dash-dark-content {
          position: relative;
          z-index: 10;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* --- HEADER --- */
        .dash-top-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 2.5rem;
           padding-bottom: 1.5rem;
           border-bottom: 1px solid #e2e8f0;
        }

        .dash-brand-area {
           display: flex;
           align-items: center;
           gap: 1.5rem;
        }

        .dash-logo {
           width: 48px;
           height: 48px;
        }

        .dash-date {
           display: block;
           font-size: 0.85rem;
           color: #64748b;
           margin-bottom: 0.2rem;
           text-transform: uppercase;
           letter-spacing: 1px;
           font-weight: 600;
        }

        .dash-welcome {
           font-size: 2rem;
           font-weight: 700;
           margin: 0;
           color: #0f172a;
           letter-spacing: -0.5px;
        }

        .wave {
           display: inline-block;
           animation: wave-animation 2.5s infinite;
           transform-origin: 70% 70%;
        }

        @keyframes wave-animation {
            0% { transform: rotate( 0.0deg) }
           10% { transform: rotate( 14.0deg) }
           20% { transform: rotate(-8.0deg) }
           30% { transform: rotate( 14.0deg) }
           40% { transform: rotate(-4.0deg) }
           50% { transform: rotate( 10.0deg) }
           60% { transform: rotate( 0.0deg) }
          100% { transform: rotate( 0.0deg) }
        }

        .dash-header-actions {
           display: flex;
           align-items: center;
           gap: 1.5rem;
        }

        .dash-system-status {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           background: rgba(16,185,129,0.1);
           border: 1px solid rgba(16,185,129,0.2);
           padding: 0.5rem 1rem;
           border-radius: 20px;
           font-size: 0.85rem;
           color: #059669;
           font-weight: 600;
        }

        .dash-logout-btn {
           background: transparent;
           border: 1px solid #cbd5e1;
           color: #475569;
           padding: 0.6rem 1.2rem;
           border-radius: 12px;
           font-size: 0.9rem;
           font-weight: 600;
           cursor: pointer;
           transition: all 0.2s;
        }

        .dash-logout-btn:hover {
           background: #f1f5f9;
           color: #ef4444;
           border-color: #fca5a5;
        }

        /* --- LAYOUT GRID --- */
        .dash-main-layout {
           display: grid;
           grid-template-columns: 1fr 340px;
           gap: 2.5rem;
        }

        .dash-mid-row {
           display: grid;
           grid-template-columns: 1.5fr 1fr;
           gap: 1.5rem;
           margin-bottom: 2.5rem;
           align-items: stretch;
        }

        @media (max-width: 1024px) {
           .dash-main-layout {
               grid-template-columns: 1fr;
           }
           .dash-mid-row {
               grid-template-columns: 1fr;
           }
        }

        /* --- QUICK STATS --- */
        .dash-stats-row {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
           gap: 1.5rem;
           margin-bottom: 2.5rem;
        }

        .dash-stat-card {
           background: #ffffff;
           border: 1px solid #e2e8f0;
           border-radius: 16px;
           padding: 1.5rem;
           display: flex;
           align-items: center;
           gap: 1.2rem;
           box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
           transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .dash-stat-card:hover {
           transform: translateY(-2px);
           box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .dash-stat-card.border-glow-warning {
           border-color: #fcd34d;
           background: #fffbeb;
        }

        .stat-icon-wrap {
           width: 50px;
           height: 50px;
           border-radius: 12px;
           display: flex;
           align-items: center;
           justify-content: center;
        }

        .stat-label {
           margin: 0 0 0.2rem 0;
           font-size: 0.85rem;
           color: #64748b;
           font-weight: 500;
        }

        .stat-value {
           margin: 0;
           font-size: 1.5rem;
           font-weight: 700;
           color: #0f172a;
           line-height: 1;
        }

        .stat-sub {
           font-size: 1rem;
           color: #94a3b8;
           font-weight: 500;
        }

        /* --- FIELDS LIST --- */
        .dash-section-header {
           display: flex;
           justify-content: space-between;
           align-items: flex-end;
           margin-bottom: 1.5rem;
        }

        .dash-section-title {
           font-size: 1.4rem;
           margin: 0 0 0.2rem 0;
           color: #0f172a;
        }

        .dash-section-sub {
           color: #64748b;
           font-size: 0.9rem;
           margin: 0;
        }

        /* --- TABS --- */
        .dash-tabs-container {
           display: flex;
           gap: 1rem;
           margin-bottom: 2rem;
           border-bottom: 1px solid #e2e8f0;
           padding-bottom: 0.5rem;
        }

        .dash-tab {
           background: transparent;
           border: none;
           color: #64748b;
           font-size: 1rem;
           font-weight: 600;
           padding: 0.5rem 1rem;
           cursor: pointer;
           display: flex;
           align-items: center;
           gap: 0.5rem;
           transition: all 0.2s;
           position: relative;
        }

        .dash-tab:hover { color: #0f172a; }
        
        .dash-tab.active {
           color: #10b981;
        }

        .dash-tab.active::after {
           content: '';
           position: absolute;
           bottom: -0.5rem;
           left: 0; right: 0;
           height: 2px;
           background: #10b981;
           border-radius: 2px 2px 0 0;
        }

        /* --- FIELDS LIST --- */
        .dash-fields-grid {
           display: grid;
           grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
           gap: 1.5rem;
        }

        .dash-smart-card {
           background: #ffffff;
           border: 1px solid #e2e8f0;
           border-radius: 16px;
           padding: 1.25rem;
           cursor: pointer;
           box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
           transition: all 0.2s ease-out;
           display: flex;
           flex-direction: column;
           gap: 1.2rem;
        }

        .dash-smart-card:hover {
           transform: translateY(-4px);
           border-color: #a7f3d0;
           box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }

        .dash-smart-card.needs-action {
           border-left: 3px solid #fbbf24;
        }

        .dash-smart-card.needs-action:hover {
           border-color: #fcd34d;
        }

        .card-top-row {
           display: flex;
           justify-content: space-between;
           align-items: flex-start;
        }

        .card-left-group {
           display: flex;
           gap: 1rem;
           align-items: center;
        }

        .card-icon-box {
           width: 44px;
           height: 44px;
           border-radius: 12px;
           display: flex;
           align-items: center;
           justify-content: center;
        }

        .card-icon-box.configured {
           background: #d1fae5;
           color: #059669;
        }

        .card-icon-box.pending {
           background: #fef3c7;
           color: #d97706;
        }

        .card-field-name {
           font-size: 1.1rem;
           font-weight: 600;
           margin: 0 0 0.3rem 0;
           color: #0f172a;
        }

        .card-field-chip {
           font-size: 0.75rem;
           background: #f1f5f9;
           padding: 0.2rem 0.6rem;
           border-radius: 6px;
           color: #475569;
           font-weight: 500;
           display: inline-block;
        }

        .card-menu-btn {
           background: transparent;
           border: none;
           color: #94a3b8;
           cursor: pointer;
           padding: 0.2rem;
        }

        .card-menu-btn:hover { color: #0f172a; }

        .card-dropdown {
           position: absolute;
           top: 100%; right: 0;
           background: #ffffff;
           border: 1px solid #e2e8f0;
           border-radius: 8px;
           padding: 0.5rem;
           z-index: 20;
           width: 120px;
           box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .dropdown-action-del {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           width: 100%;
           padding: 0.5rem;
           background: transparent;
           border: none;
           color: #ef4444;
           font-size: 0.9rem;
           font-weight: 500;
           cursor: pointer;
           border-radius: 6px;
           text-align: left;
        }

        .dropdown-action-del:hover {
           background: #fef2f2;
        }

        .progress-container {
           width: 100%;
        }

        .progress-header {
           display: flex;
           justify-content: space-between;
           font-size: 0.85rem;
           margin-bottom: 0.4rem;
        }

        .prog-label { color: #64748b; font-weight: 500; }
        .prog-val { color: #059669; font-weight: 700; }

        .progress-bar-bg {
           height: 6px;
           background: #e2e8f0;
           border-radius: 3px;
           overflow: hidden;
        }

        .progress-bar-fill {
           height: 100%;
           background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
           border-radius: 3px;
           transition: width 1s ease-in-out;
        }

        .action-required-alert {
           display: flex;
           align-items: center;
           gap: 0.4rem;
           color: #d97706;
           font-size: 0.85rem;
           font-weight: 500;
           background: #fef3c7;
           padding: 0.6rem;
           border-radius: 8px;
           border: 1px dashed #fcd34d;
        }

        .card-bottom-row {
           display: flex;
           justify-content: space-between;
           align-items: center;
           border-top: 1px solid #f1f5f9;
           padding-top: 1rem;
        }

        .card-date-added {
           font-size: 0.8rem;
           color: #64748b;
           font-weight: 500;
        }

        .card-arrow {
           width: 28px; height: 28px;
           border-radius: 50%;
           background: #f1f5f9;
           display: flex;
           align-items: center;
           justify-content: center;
           color: #94a3b8;
           transition: all 0.2s;
        }

        .dash-smart-card:hover .card-arrow {
           background: #10b981;
           color: white;
           transform: translateX(4px);
        }

        /* --- RIGHT COLUMN WIDGETS --- */
        .dash-widget {
           background: #ffffff;
           border: 1px solid #e2e8f0;
           border-radius: 16px;
           padding: 1.5rem;
           margin-bottom: 1.5rem;
           box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }

        .widget-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 1.25rem;
        }

        .widget-title {
           font-size: 1.1rem;
           font-weight: 700;
           color: #0f172a;
           margin: 0;
           display: flex;
           align-items: center;
           gap: 0.5rem;
        }

        /* WEATHER */
        .weather-main-row {
           display: flex;
           align-items: center;
           gap: 1.5rem;
           margin-bottom: 1.5rem;
        }

        .weather-temp {
           font-size: 2.5rem;
           color: #0f172a;
           margin: 0;
           line-height: 1;
        }

        .weather-desc {
           color: #d97706;
           margin: 0.2rem 0 0 0;
           font-size: 0.9rem;
           font-weight: 600;
        }

        .weather-icon-anim {
           animation: spin-slow 15s linear infinite;
        }

        @keyframes spin-slow {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
        }

        .weather-details-grid {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 1rem;
        }

        .weather-detail-item {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           font-size: 0.85rem;
           font-weight: 500;
           color: #475569;
           background: #f8fafc;
           padding: 0.6rem;
           border-radius: 8px;
           border: 1px solid #f1f5f9;
        }

        /* INSIGHTS */
        .insights-list {
           display: flex;
           flex-direction: column;
           gap: 0.8rem;
        }

        .insight-item {
           display: flex;
           gap: 0.8rem;
           padding: 1rem;
           border-radius: 10px;
           font-size: 0.9rem;
           line-height: 1.4;
           border-left: 3px solid transparent;
        }

        .insight-item p { margin: 0; color: #475569; }
        .insight-item b { color: #0f172a; }

        .warning-insight {
           background: #fffbeb;
           border-left-color: #f59e0b;
        }
        .warning-insight .insight-icon { color: #f59e0b; }

        .success-insight {
           background: #ecfdf5;
           border-left-color: #10b981;
        }
        .success-insight .insight-icon { color: #10b981; }

        .info-insight {
           background: #f8fafc;
           border: 1px solid #e2e8f0;
           box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        /* --- NOTIFICATIONS TOGGLE --- */
        .dash-notify-toggle {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           padding: 0.5rem 1rem;
           border-radius: 20px;
           font-size: 0.85rem;
           font-weight: 600;
           cursor: pointer;
           transition: all 0.2s;
           border: 1px solid transparent;
        }

        .dash-notify-toggle.on {
           background: #dbeafe;
           color: #2563eb;
           border-color: #bfdbfe;
        }

        .dash-notify-toggle.off {
           background: #f1f5f9;
           color: #64748b;
        }

        .ring-anim {
           animation: ring 2s infinite;
        }
        @keyframes ring {
           0%, 100% { transform: rotate(0deg); }
           20% { transform: rotate(15deg); }
           40% { transform: rotate(-10deg); }
           60% { transform: rotate(5deg); }
           80% { transform: rotate(-5deg); }
        }

        /* --- MARKET TRENDS WIDGET --- */
        .market-widget {
           padding: 1.5rem;
        }

        .market-row {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 0.8rem 0;
           border-bottom: 1px dashed #e2e8f0;
        }
        .market-row:last-child { border-bottom: none; padding-bottom: 0; }

        .market-label {
           color: #475569;
           font-size: 0.9rem;
           font-weight: 500;
        }

        .market-price {
           font-weight: 700;
           color: #0f172a;
           font-size: 1.05rem;
           display: flex;
           align-items: baseline;
           gap: 0.3rem;
        }

        .market-price small {
           font-size: 0.75rem;
           color: #64748b;
           font-weight: 600;
        }

        .market-price.up small { color: #059669; }
        .market-price.down small { color: #dc2626; }

        /* --- TELEMETRY --- */
        .telemetry-widget {
           background: #f8fafc;
           border: 1px solid #e2e8f0;
           padding: 1rem;
           font-family: 'Consolas', 'Courier New', monospace;
           box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.02);
        }

        .telemetry-header {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           font-size: 0.85rem;
           font-weight: 600;
           color: #64748b;
           border-bottom: 1px dashed #cbd5e1;
           padding-bottom: 0.5rem;
           margin-bottom: 1rem;
        }

        .telemetry-log-box {
           display: flex;
           flex-direction: column;
           gap: 0.4rem;
           font-size: 0.8rem;
        }

        .telemetry-row { display: flex; gap: 0.5rem; animation: fade-in 0.5s ease-out; }
        .telemetry-time { color: #94a3b8; min-width: 70px; }
        
        .telemetry-row.info .telemetry-msg { color: #3b82f6; }
        .telemetry-row.success .telemetry-msg { color: #059669; }
        .telemetry-row.warn .telemetry-msg { color: #d97706; }

        @keyframes fade-in {
           from { opacity: 0; transform: translateY(-5px); }
           to { opacity: 1; transform: translateY(0); }
        }

        /* --- SMART CALENDAR TODO MAPPING --- */
        .task-list {
           display: flex;
           flex-direction: column;
           gap: 0.8rem;
        }

        .task-item {
           display: flex;
           align-items: flex-start;
           gap: 0.8rem;
           background: #ffffff;
           border: 1px solid #e2e8f0;
           padding: 0.8rem;
           border-radius: 10px;
           box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        .task-item.high-priority {
           border-left: 3px solid #ef4444;
        }

        .task-item.med-priority {
           border-left: 3px solid #10b981;
        }

        .task-check {
           margin-top: 2px;
        }

        .task-content h4 {
           margin: 0 0 0.2rem 0;
           font-size: 0.95rem;
           font-weight: 600;
           color: #0f172a;
        }

        .task-content span {
           font-size: 0.75rem;
           color: #64748b;
           font-weight: 500;
        }

        /* --- MAP PLACEHOLDER --- */
        .map-placeholder-container {
           height: 500px;
           background: #ffffff;
           border: 1px dashed #cbd5e1;
           border-radius: 16px;
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           position: relative;
           overflow: hidden;
           text-align: center;
        }

        .map-overlay-glow {
           position: absolute;
           top: 0; left: 0; right: 0; bottom: 0;
           background: radial-gradient(circle at center, rgba(16,185,129,0.05) 0%, transparent 70%);
           pointer-events: none;
        }

        .map-placeholder-container h3 { color: #0f172a; margin: 0.5rem 0; font-weight: 700; }
        .map-placeholder-container p { color: #64748b; font-weight: 500; }

        .bounce-anim {
           animation: bounce 2s infinite;
        }
        @keyframes bounce {
           0%, 100% { transform: translateY(0); }
           50% { transform: translateY(-10px); }
        }

        .dash-btn-outline {
           background: #ffffff;
           border: 2px solid #10b981;
           color: #059669;
           padding: 0.8rem 1.5rem;
           border-radius: 10px;
           cursor: pointer;
           font-weight: 600;
           transition: all 0.2s;
        }
        .dash-btn-outline:hover {
           background: #ecfdf5;
        }

        /* --- EMPTY & LOADING STATES --- */
        .dash-empty-state {
           grid-column: 1 / -1;
           border: 2px dashed #cbd5e1;
           border-radius: 16px;
           padding: 4rem 2rem;
           text-align: center;
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 1rem;
           background: #ffffff;
        }

        .empty-icon-circle {
           width: 80px; height: 80px;
           border-radius: 50%;
           background: #ecfdf5;
           display: flex; align-items: center; justify-content: center;
           margin-bottom: 0.5rem;
        }

        .dash-empty-state h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
        .dash-empty-state p { color: #64748b; margin: 0; max-width: 300px; font-weight: 500; }

        .dash-btn-primary {
           background: linear-gradient(135deg, #10b981 0%, #059669 100%);
           color: white;
           border: none;
           padding: 0.8rem 1.5rem;
           border-radius: 10px;
           font-weight: 600;
           font-size: 1rem;
           display: inline-flex;
           align-items: center;
           gap: 0.5rem;
           cursor: pointer;
           box-shadow: 0 4px 6px -1px rgb(16 185 129 / 0.3);
           transition: all 0.2s;
        }
        .dash-btn-primary:hover {
           transform: translateY(-2px);
           box-shadow: 0 10px 15px -3px rgb(16 185 129 / 0.4);
        }

        .dash-loading-state {
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           padding: 5rem;
           gap: 1rem;
           color: #64748b;
           font-weight: 500;
        }

        /* --- FAB --- */
        .dash-fab {
           position: fixed;
           bottom: 2rem; right: 2rem;
           width: 60px; height: 60px;
           border-radius: 20px;
           background: linear-gradient(135deg, #10b981 0%, #059669 100%);
           color: white;
           border: none;
           display: flex; align-items: center; justify-content: center;
           box-shadow: 0 10px 15px -3px rgb(16 185 129 / 0.4);
           cursor: pointer;
           z-index: 100;
           transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .dash-fab:hover {
           transform: scale(1.1) rotate(90deg);
           box-shadow: 0 20px 25px -5px rgb(16 185 129 / 0.5);
        }

        /* Responsive Fixes */
        @media (max-width: 600px) {
           .dash-top-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
           .dash-header-actions { width: 100%; justify-content: space-between; }
           .dash-dark-content { padding: 1.5rem 1rem; }
        }
      `}</style>
    </div>
  )
}

export default FarmerDashboard
