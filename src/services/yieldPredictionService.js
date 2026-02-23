import { supabase } from '../supabase'
import talukaStats from '../data/taluka_stats.json'

/**
 * Build the prediction payload for a single field using real dataset averages.
 * Falls back gracefully if taluka weather data is missing.
 */
const buildPayload = (field) => {
  const d = field._details || {}
  const taluka = d.taluka || 'Ahmednagar'
  const stats = talukaStats[taluka] || talukaStats['Ahmednagar'] || {}

  return {
    Taluka: taluka,
    Season: d.season,
    Cane_Variety: d.variety,
    Soil_Type: d.soil_type,
    Irrigation_Method: d.irrigation_method,
    Area_Harvested_Ha: parseFloat(field.area_size || 1) * 0.404686,
    Latitude: 19.09,
    Longitude: 74.74,
    Avg_NDVI: stats.avgNDVI || 0.65,
    Avg_EVI: (stats.avgEVI || 0.52),
    Avg_LST_Celsius: (stats.avgLST || 31),
    Avg_Max_Temp_Celsius: stats.avgMaxTemp || 33,
    Avg_Min_Temp_Celsius: stats.avgMinTemp || 20,
    Avg_Humidity_Percent: stats.avgHumidity || 62,
    Solar_Radiation_kWh: stats.avgSolarRadiation || 5.7,
    Accumulated_Rainfall_mm: stats.avgRainfall || 500
  }
}

/**
 * Check if a field has all required configuration to make a prediction.
 */
const isConfigured = (field) => {
  const d = field._details
  if (!d) return false
  return !!(d.taluka && d.season && d.variety && d.soil_type && d.irrigation_method)
}

/**
 * Call the prediction API for a single field. Returns predicted yield in T/Ha or null.
 */
const predictSingle = async (payload) => {
  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.predicted_yield || null
  } catch {
    return null
  }
}

/**
 * Run predictions in batches to avoid overwhelming the API.
 * @param {Array} payloads - Array of { fieldId, payload } objects
 * @param {number} batchSize - Max concurrent requests
 * @returns {Object} - { fieldId: predictedYield }
 */
const runBatched = async (items, batchSize = 5) => {
  const results = {}
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const promises = batch.map(async (item) => {
      const yield_val = await predictSingle(item.payload)
      return { fieldId: item.fieldId, yield: yield_val }
    })
    const batchResults = await Promise.allSettled(promises)
    batchResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value.yield !== null) {
        results[r.value.fieldId] = r.value.yield
      }
    })
  }
  return results
}

/**
 * Main function: Fetch all fields → batch predict → aggregate per Taluka.
 *
 * @returns {Object} {
 *   byTaluka: { [taluka]: { totalPredicted, avgPredicted, fieldCount, fields: [...] } },
 *   allRegions: { totalPredicted, avgPredicted, fieldCount },
 *   fieldPredictions: { [fieldId]: predictedYield },
 *   configuredCount: number,
 *   unconfiguredCount: number
 * }
 */
export async function fetchBatchPredictions() {
  // 1. Fetch all fields with their details
  const { data: fieldsData, error } = await supabase
    .from('fields')
    .select(`id, name, area_size, field_details ( taluka, season, variety, soil_type, irrigation_method )`)

  if (error || !fieldsData) {
    console.error('Failed to fetch fields for predictions:', error)
    return null
  }

  // 2. Normalize field_details
  const fields = fieldsData.map(f => ({
    ...f,
    _details: Array.isArray(f.field_details) ? f.field_details[0] : f.field_details
  }))

  const configured = fields.filter(isConfigured)
  const unconfigured = fields.filter(f => !isConfigured(f))

  if (configured.length === 0) {
    return {
      byTaluka: {},
      allRegions: { totalPredicted: 0, avgPredicted: 0, fieldCount: 0 },
      fieldPredictions: {},
      configuredCount: 0,
      unconfiguredCount: unconfigured.length
    }
  }

  // 3. Build payloads
  const items = configured.map(f => ({
    fieldId: f.id,
    taluka: f._details.taluka,
    areaHa: parseFloat(f.area_size || 1) * 0.404686,
    payload: buildPayload(f)
  }))

  // 4. Batch predict
  const predictions = await runBatched(items, 5)

  // 5. Aggregate per Taluka
  const byTaluka = {}
  let allTotal = 0, allCount = 0

  items.forEach(item => {
    const yieldPerHa = predictions[item.fieldId]
    if (yieldPerHa == null) return

    const totalForField = yieldPerHa * item.areaHa
    const taluka = item.taluka

    if (!byTaluka[taluka]) {
      byTaluka[taluka] = { totalPredicted: 0, fields: [], fieldCount: 0, yields: [] }
    }
    byTaluka[taluka].totalPredicted += totalForField
    byTaluka[taluka].fieldCount += 1
    byTaluka[taluka].yields.push(yieldPerHa)
    byTaluka[taluka].fields.push({ fieldId: item.fieldId, yieldPerHa, totalYield: totalForField })

    allTotal += totalForField
    allCount += 1
  })

  // Compute averages
  Object.values(byTaluka).forEach(t => {
    t.totalPredicted = Math.round(t.totalPredicted)
    t.avgPredicted = t.yields.length ? parseFloat((t.yields.reduce((a, b) => a + b, 0) / t.yields.length).toFixed(2)) : 0
    delete t.yields
  })

  return {
    byTaluka,
    allRegions: {
      totalPredicted: Math.round(allTotal),
      avgPredicted: allCount ? parseFloat((Object.values(byTaluka).reduce((s, t) => s + t.avgPredicted, 0) / Object.keys(byTaluka).length).toFixed(2)) : 0,
      fieldCount: allCount
    },
    fieldPredictions: predictions,
    configuredCount: configured.length,
    unconfiguredCount: unconfigured.length
  }
}

/**
 * Call the prediction API for a single field harvest duration. Returns predicted days or null.
 */
const predictSingleHarvest = async (payload) => {
  try {
    const response = await fetch('/api/predict-harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.predicted_harvest_days || null
  } catch {
    return null
  }
}

/**
 * Run harvest predictions in batches.
 */
const runBatchedHarvest = async (items, batchSize = 5) => {
  const results = {}
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const promises = batch.map(async (item) => {
      const days = await predictSingleHarvest(item.payload)
      return { fieldId: item.fieldId, days }
    })
    const batchResults = await Promise.allSettled(promises)
    batchResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value.days !== null) {
        results[r.value.fieldId] = r.value.days
      }
    })
  }
  return results
}

/**
 * Fetch all fields → batch predict harvest duration → sort by urgency.
 */
export async function fetchHarvestPredictions() {
  const { data: fieldsData, error } = await supabase
    .from('fields')
    .select(`id, name, area_size, field_details ( taluka, season, variety, soil_type, irrigation_method, planting_date ), farmers:farmer_id ( users ( full_name ) )`)

  if (error || !fieldsData) {
    console.error('Failed to fetch fields for harvest predictions:', error)
    return []
  }

  const fields = fieldsData.map(f => ({
    ...f,
    _details: Array.isArray(f.field_details) ? f.field_details[0] : f.field_details,
    farmerName: f.farmers?.users?.full_name || f.farmers?.full_name || 'Unknown Farmer'
  }))

  // Only fields with full config AND a planting date can be scheduled
  const schedulable = fields.filter(f => isConfigured(f) && f._details.planting_date)

  if (schedulable.length === 0) return []

  const items = schedulable.map(f => ({
    fieldId: f.id,
    payload: buildPayload(f)
  }))

  const predictions = await runBatchedHarvest(items, 5)

  const today = new Date()
  const queue = []

  schedulable.forEach(f => {
    const predictedDays = predictions[f.id]
    if (predictedDays == null) return

    // Ensure valid planting date format (assuming YYYY-MM-DD)
    const plantingDate = new Date(f._details.planting_date)
    
    // Check if valid date
    if (isNaN(plantingDate.getTime())) return

    const harvestDate = new Date(plantingDate.getTime() + (predictedDays * 24 * 60 * 60 * 1000))
    const diffTime = harvestDate.getTime() - today.getTime()
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let urgency = 'maturing'
    if (daysRemaining <= 0) urgency = 'critical'
    else if (daysRemaining <= 15) urgency = 'high'

    queue.push({
      fieldId: f.id,
      fieldName: f.name,
      farmerName: f.farmerName,
      taluka: f._details.taluka,
      variety: f._details.variety,
      area: parseFloat(f.area_size || 0).toFixed(2),
      predictedDays,
      daysRemaining,
      urgency,
      expectedDate: harvestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    })
  })

  // Sort by urgency: lowest days remaining first
  return queue.sort((a, b) => a.daysRemaining - b.daysRemaining)
}
