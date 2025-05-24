export async function geocodeCity(cityName) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        country: result.display_name.split(',').pop().trim()
      };
    }
    throw new Error('找不到该城市，请重试。');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
} 