// Utility functions for processing asthma data

/**
 * Parses CSV asthma data and returns an object of county names to prevalence rates
 * for the "All ages" category in the "Total population" strata
 */
export async function fetchAsthmaData(): Promise<Record<string, number>> {
  try {
    const response = await fetch('/asthma-prevalence-18-23.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.split('\n');
    const header = lines[0].split(',');
    
    // Create an object of county names to prevalence rates
    const asthmaRatesByCounty: Record<string, number> = {};
    
    // Skip header row and process data
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < 5) continue; // Skip incomplete rows
      
      const county = row[0];
      const strata = row[2];
      const ageGroup = row[3];
      const prevalence = row[4];
      
      // Only include county-level data for all ages in total population
      if (county !== 'California' && strata === 'Total population' && ageGroup === 'All ages' && prevalence && prevalence !== '') {
        // Parse the prevalence rate (remove any non-numeric characters)
        const rate = parseFloat(prevalence.replace(/[^\d.-]/g, ''));
        if (!isNaN(rate)) {
          asthmaRatesByCounty[county] = rate;
        }
      }
    }
    
    return asthmaRatesByCounty;
  } catch (error) {
    console.error('Error fetching or parsing asthma data:', error);
    return {};
  }
}

/**
 * Get color for choropleth map based on asthma prevalence rate
 */
export function getAsthmaColor(rate: number | null): string {
  if (rate === null) return '#cccccc'; // Default for no data
  
  // Color scale from low (green) to high (red) prevalence
  if (rate < 7) return '#1a9850';       // Very low 
  if (rate < 9) return '#91cf60';       // Low
  if (rate < 11) return '#d9ef8b';      // Medium-low
  if (rate < 13) return '#fee08b';      // Medium
  if (rate < 15) return '#fc8d59';      // Medium-high
  return '#d73027';                     // High
}
