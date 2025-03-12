const useTimeOfDay = (sunriseUTC, sunsetUTC, debugHour) => {
  if (!sunriseUTC || !sunsetUTC) return { phase: "midnight" };

  const mockNow = new Date();
  if (typeof debugHour === "number") {
    mockNow.setHours(debugHour, 0, 0, 0);
  }

  const sunrise = new Date(sunriseUTC);
  const sunset = new Date(sunsetUTC);

  const transitionDuration = 45 * 60 * 1000; // 45 min in ms
  const sunriseStart = new Date(sunrise.getTime() - transitionDuration);
  const sunriseEnd = new Date(sunrise.getTime() + transitionDuration);
  const sunsetStart = new Date(sunset.getTime() - transitionDuration);
  const sunsetEnd = new Date(sunset.getTime() + transitionDuration);

  if (mockNow >= sunriseStart && mockNow <= sunriseEnd) {
    const progress = (mockNow - sunriseStart) / (sunriseEnd - sunriseStart);
    return { phase: "sunrise", progress };
  }

  if (mockNow > sunriseEnd && mockNow < sunsetStart) {
    return { phase: "day" };
  }

  if (mockNow >= sunsetStart && mockNow <= sunsetEnd) {
    const progress = (mockNow - sunsetStart) / (sunsetEnd - sunsetStart);
    return { phase: "sunset", progress };
  }

  return { phase: "night" };
};

export default useTimeOfDay;
