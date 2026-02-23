import { AlertTriangle, Flame, Droplets, Activity } from 'lucide-react'

/**
 * Evaluates registered fields against regional climate data to generate actionable risk alerts.
 * 
 * Rules based on:
 * 1. Drought Vulnerability: Low rainfall (<500mm) + No/Rainfed irrigation
 * 2. Heat Stress: High avg max temp (>35°C) + Non-drip irrigation
 * 3. Waterlogging: High rainfall (>800mm) + Poor draining soil (Clay/Deep Black)
 * 4. Regional Health Warning: Low avg NDVI (<0.60) in the Taluka
 * 
 * @param {Array} fields - Array of fields with their details
 * @param {Object} talukaStats - Lookup object for Taluka climate data
 * @returns {Array} - Array of active alert objects sorted by severity
 */
export const generateRiskAlerts = (fields, talukaStats) => {
  if (!fields || fields.length === 0) return []

  const alerts = []
  
  // Track affected fields for each rule
  const droughtFields = []
  const heatFields = []
  const waterloggingFields = []
  const poorHealthFields = []
  
  // Rule Checks Per Field
  fields.forEach(f => {
    const d = f._details || f.field_details || {}
    // Normalize if array
    const details = Array.isArray(d) ? d[0] : d
    
    // Determine Taluka for climate data lookup
    const taluka = details?.taluka || f.taluka
    if (!taluka) return
    
    const stats = talukaStats[taluka]
    if (!stats) return

    // 1. Drought Risk
    // High risk if rainfall < 550mm and no Drip/Sprinkler
    const lowRainfall = stats.avgRainfall < 550
    const poorIrrigation = ['None', 'Rainfed', 'Unknown'].includes(details.irrigation_method)
    if (lowRainfall && poorIrrigation) {
      droughtFields.push(f)
    }

    // 2. Heat Stress
    // High max temp > 34°C and not using Drip (evaporation risk)
    const highTemp = stats.avgMaxTemp > 34
    const notDrip = details.irrigation_method !== 'Drip'
    if (highTemp && notDrip) {
      heatFields.push(f)
    }

    // 3. Waterlogging Risk
    // High rainfall > 800mm and poor drainage soil
    const highRainfall = stats.avgRainfall > 800
    const poorDrainage = ['Clay', 'Deep Black'].includes(details.soil_type)
    if (highRainfall && poorDrainage) {
      waterloggingFields.push(f)
    }

    // 4. Regional Health Drop
    // Note: Regional level, we just track fields in poor regions.
    const poorNDVI = stats.avgNDVI < 0.60
    if (poorNDVI) {
      poorHealthFields.push(f)
    }
  })

  // Aggregate into alert objects
  if (droughtFields.length > 0) {
    alerts.push({
      id: 'drought',
      title: 'Drought Vulnerability',
      description: `Low regional rainfall (<550mm) detected for rainfed fields. High risk of moisture stress and stunting.`,
      affectedCount: droughtFields.length,
      severity: 'critical',
      icon: Droplets,
      action: 'Advise supplementary irrigation setup'
    })
  }

  if (heatFields.length > 0) {
    alerts.push({
      id: 'heat',
      title: 'Evaporative Heat Stress',
      description: `Sustained high temperatures (>34°C) threatening non-drip irrigated fields. High evaporation rate expected.`,
      affectedCount: heatFields.length,
      severity: 'warning',
      icon: Flame,
      action: 'Increase watering frequency; mulch advisory'
    })
  }

  if (waterloggingFields.length > 0) {
    alerts.push({
      id: 'waterlogging',
      title: 'Waterlogging & Root Rot Risk',
      description: `Heavy regional rainfall intersecting with poorly-drained clay/black soils.`,
      affectedCount: waterloggingFields.length,
      severity: 'warning',
      icon: AlertTriangle,
      action: 'Recommend trenching for water diversion'
    })
  }

  if (poorHealthFields.length > 0) {
    alerts.push({
      id: 'health',
      title: 'Regional Crop Health Decline',
      description: `Regional NDVI has fallen below 0.60 indicating poor overall vigor, potentially disease or pest outbreaks.`,
      affectedCount: poorHealthFields.length,
      severity: 'critical',
      icon: Activity,
      action: 'Dispatch field scouts to affected Talukas'
    })
  }

  // Sort: Critical first, then Warning
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1
    if (a.severity !== 'critical' && b.severity === 'critical') return 1
    return b.affectedCount - a.affectedCount
  })
}
