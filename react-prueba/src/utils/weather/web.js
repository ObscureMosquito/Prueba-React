export const fetchWeather = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=sunrise,sunset&hourly=apparent_temperature,cloudcover,windspeed_10m&timezone=auto`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.current_weather || !data.daily || !data.hourly) {
      throw new Error("Incomplete weather data received.");
    }

    const weatherConditions = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Freezing rain (light)",
      67: "Freezing rain (heavy)",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };

    return {
      temp: data.current_weather.temperature ?? "N/A",
      feelsLike: data.hourly.apparent_temperature?.[0] ?? "N/A",
      windSpeed: data.hourly.windspeed_10m?.[0] ?? "N/A",
      humidity: data.hourly.humidity?.[0] ?? "N/A",
      clouds: data.hourly.cloudcover?.[0] ?? 0,
      condition:
        weatherConditions[data.current_weather.weathercode] || "Unknown",
      sunriseTime: data.daily.sunrise?.[0]?.split("T")[1] ?? "N/A",
      sunsetTime: data.daily.sunset?.[0]?.split("T")[1] ?? "N/A",
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
};

export const getWeatherByLocation = async () => {
  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const weatherData = await fetchWeather(latitude, longitude);
          resolve(weatherData);
        },
        (error) => {
          console.warn("Geolocation permission denied:", error);
          resolve(null);
        }
      );
    } else {
      console.warn("Geolocation is not supported in this browser");
      resolve(null);
    }
  });
};
