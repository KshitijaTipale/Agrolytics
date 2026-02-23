"""
Generate taluka_stats.json from the sugarcane dataset.
This script reads the CSV and computes per-Taluka aggregations
that power the Factory Dashboard with real, data-backed numbers.
"""

import csv
import json
import os
from collections import defaultdict
from datetime import datetime

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CSV_PATH = os.path.join(PROJECT_ROOT, 'dataset', 'ahmednagar_sugarcane_enriched.csv')
OUTPUT_PATH = os.path.join(PROJECT_ROOT, 'src', 'data', 'taluka_stats.json')

def parse_date(date_str):
    """Parse DD-MM-YYYY date string safely."""
    try:
        return datetime.strptime(date_str.strip(), '%d-%m-%Y')
    except (ValueError, AttributeError):
        return None

def safe_float(val, default=0.0):
    """Safely convert to float."""
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def main():
    # Accumulators per Taluka
    taluka_data = defaultdict(lambda: {
        'yields': [],
        'areas': [],
        'ndvi': [],
        'evi': [],
        'rainfall': [],
        'humidity': [],
        'max_temp': [],
        'min_temp': [],
        'solar_radiation': [],
        'lst': [],
        'varieties': defaultdict(list),    # variety -> [yields]
        'seasons': defaultdict(list),      # season -> [yields]
        'soil_types': defaultdict(int),    # soil_type -> count
        'irrigation': defaultdict(int),    # irrigation -> count
        'harvest_durations': [],           # days between planting and harvest
        'field_count': 0,
        'harvest_years': defaultdict(list) # year -> [yields]
    })

    # Read CSV
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            taluka = row.get('Taluka', '').strip()
            if not taluka:
                continue

            td = taluka_data[taluka]
            td['field_count'] += 1

            # Numerical aggregations
            yield_val = safe_float(row.get('Yield_Tonnes_Ha'))
            area_val = safe_float(row.get('Area_Harvested_Ha'))
            ndvi_val = safe_float(row.get('Avg_NDVI'))
            evi_val = safe_float(row.get('Avg_EVI'))
            rainfall_val = safe_float(row.get('Accumulated_Rainfall_mm'))
            humidity_val = safe_float(row.get('Avg_Humidity_Percent'))
            max_temp = safe_float(row.get('Avg_Max_Temp_Celsius'))
            min_temp = safe_float(row.get('Avg_Min_Temp_Celsius'))
            solar = safe_float(row.get('Solar_Radiation_kWh'))
            lst = safe_float(row.get('Avg_LST_Celsius'))

            td['yields'].append(yield_val)
            td['areas'].append(area_val)
            td['ndvi'].append(ndvi_val)
            td['evi'].append(evi_val)
            td['rainfall'].append(rainfall_val)
            td['humidity'].append(humidity_val)
            td['max_temp'].append(max_temp)
            td['min_temp'].append(min_temp)
            td['solar_radiation'].append(solar)
            td['lst'].append(lst)

            # Categorical aggregations
            variety = row.get('Cane_Variety', '').strip()
            season = row.get('Season', '').strip()
            soil = row.get('Soil_Type', '').strip()
            irrigation = row.get('Irrigation_Method', '').strip()

            if variety:
                td['varieties'][variety].append(yield_val)
            if season:
                td['seasons'][season].append(yield_val)
            if soil:
                td['soil_types'][soil] += 1
            if irrigation:
                td['irrigation'][irrigation] += 1

            # Harvest duration
            planting = parse_date(row.get('Planting_Date', ''))
            harvest = parse_date(row.get('Harvest_Date', ''))
            if planting and harvest and harvest > planting:
                td['harvest_durations'].append((harvest - planting).days)

            # Yearly tracking
            year = row.get('Harvest_Year', '').strip()
            if year:
                td['harvest_years'][year].append(yield_val)

    # Build output JSON
    output = {}
    for taluka, td in sorted(taluka_data.items()):
        avg = lambda lst: round(sum(lst) / len(lst), 2) if lst else 0

        # Crop Health grading from NDVI
        ndvi_vals = td['ndvi']
        excellent = sum(1 for n in ndvi_vals if n >= 0.75)
        moderate = sum(1 for n in ndvi_vals if 0.55 <= n < 0.75)
        poor = sum(1 for n in ndvi_vals if n < 0.55)
        total = len(ndvi_vals) or 1

        # Top variety by avg yield
        variety_perf = {}
        for v, yields in td['varieties'].items():
            variety_perf[v] = round(sum(yields) / len(yields), 2) if yields else 0
        top_variety = max(variety_perf, key=variety_perf.get) if variety_perf else 'Unknown'

        # Season performance
        season_perf = {}
        for s, yields in td['seasons'].items():
            season_perf[s] = round(sum(yields) / len(yields), 2) if yields else 0
        top_season = max(season_perf, key=season_perf.get) if season_perf else 'Unknown'

        # Yearly trend (last 3 years)
        yearly_avg = {}
        for yr, yields in sorted(td['harvest_years'].items()):
            yearly_avg[yr] = round(sum(yields) / len(yields), 2)

        output[taluka] = {
            'fieldCount': td['field_count'],
            'avgYield': avg(td['yields']),
            'totalArea': round(sum(td['areas']), 2),
            'avgArea': avg(td['areas']),
            'totalEstYield': round(sum(td['areas']) * avg(td['yields']), 0),
            
            # Climate & Health
            'avgNDVI': avg(td['ndvi']),
            'avgEVI': avg(td['evi']),
            'avgRainfall': avg(td['rainfall']),
            'avgHumidity': avg(td['humidity']),
            'avgMaxTemp': avg(td['max_temp']),
            'avgMinTemp': avg(td['min_temp']),
            'avgSolarRadiation': avg(td['solar_radiation']),
            'avgLST': avg(td['lst']),

            # Crop Health Index
            'cropHealth': {
                'excellent': excellent,
                'moderate': moderate,
                'poor': poor,
                'excellentPct': round(excellent / total * 100, 1),
                'moderatePct': round(moderate / total * 100, 1),
                'poorPct': round(poor / total * 100, 1)
            },

            # Variety & Season Performance
            'varietyPerformance': variety_perf,
            'seasonPerformance': season_perf,
            'topVariety': top_variety,
            'topSeason': top_season,

            # Soil & Irrigation distribution
            'soilDistribution': dict(td['soil_types']),
            'irrigationDistribution': dict(td['irrigation']),

            # Harvest timing
            'avgHarvestDuration': round(avg(td['harvest_durations'])) if td['harvest_durations'] else 0,
            'minHarvestDuration': min(td['harvest_durations']) if td['harvest_durations'] else 0,
            'maxHarvestDuration': max(td['harvest_durations']) if td['harvest_durations'] else 0,

            # Yearly trend
            'yearlyTrend': yearly_avg
        }

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated taluka_stats.json with data for {len(output)} Talukas")
    print(f"   Output: {OUTPUT_PATH}")
    for t, d in output.items():
        print(f"   {t}: {d['fieldCount']} fields, avg yield {d['avgYield']} T/Ha, "
              f"health: {d['cropHealth']['excellentPct']}% excellent")

if __name__ == '__main__':
    main()
