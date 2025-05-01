// Utility functions for processing temperature anomaly data

/**
 * Parses CSV temperature data and returns an object of county names to temperature anomaly values
 * @param year Optional specific year (18-23) to load, if not provided loads the averaged data
 */
export async function fetchTemperatureData(year?: number): Promise<Record<string, number>> {
  try {
    // Determine which file to load based on the year parameter
    const fileName = year ? `/temp${year}.csv` : '/temp18-23.csv';
    console.log(`[fetchTemperatureData] Loading data from ${fileName}`);
    const response = await fetch(fileName);
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.split('\n');
    console.log(`[fetchTemperatureData] Parsed ${lines.length} lines from CSV`);
    
    // Create an object of county names to temperature anomaly values
    const temperatureByCounty: Record<string, number> = {};
    
    // Process data starting from line 1 (after header)
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < 5) continue; // Skip incomplete rows
      
      // County ID not used but kept for reference
      const countyName = row[1].trim(); // e.g., "Alameda County"
      
      // Format the county name exactly as it appears in the GeoJSON
      // Some county names might have special handling, but generally we want to keep it as is
      // because the GeoJSON likely uses the full county name
      
      const anomaly = row[4]; // Anomaly value
      
      if (anomaly && anomaly !== '') {
        // Parse the anomaly value
        const anomalyValue = parseFloat(anomaly);
        if (!isNaN(anomalyValue)) {
          temperatureByCounty[countyName] = anomalyValue;
          console.log(`[fetchTemperatureData] Added ${countyName}: ${anomalyValue}`);
        }
      }
    }
    
    console.log(`[fetchTemperatureData] Processed data for ${Object.keys(temperatureByCounty).length} counties`);
    return temperatureByCounty;
  } catch (error) {
    console.error(`Error fetching or parsing temperature data${year ? ` for year ${year}` : ''}:`, error);
    return {};
  }
}

/**
 * Get color for choropleth map based on temperature anomaly value
 */
export function getTemperatureColor(anomaly: number | null): string {
  if (anomaly === null) return '#cccccc'; // Default for no data
  
  // Color scale from cool (blue) to hot (red) for temperature anomalies
  if (anomaly < 0) return '#4575b4';       // Cooling
  if (anomaly < 1) return '#91bfdb';       // Slight warming
  if (anomaly < 2) return '#e0f3f8';       // Moderate warming
  if (anomaly < 3) return '#fee090';       // Significant warming
  if (anomaly < 4) return '#fc8d59';       // High warming
  return '#d73027';                        // Extreme warming
}

/**
 * Get available years for temperature data
 */
export function getAvailableTemperatureYears(): { value: number | null; label: string }[] {
  return [
    { value: null, label: 'Average (2018-2023)' },
    { value: 18, label: '2018' },
    { value: 19, label: '2019' },
    { value: 20, label: '2020' },
    { value: 21, label: '2021' },
    { value: 22, label: '2022' },
    { value: 23, label: '2023' }
  ];
}
