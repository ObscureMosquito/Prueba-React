import React, { useState, useEffect, useMemo } from "react";
import SunCalc from "suncalc";
import { gradients } from "../../utils/weather/gradients";
import { applyWeatherGrayness } from "../../utils/weather/applyWeatherGrayness";

// --- Helper Functions ---

// Convert HEX string to RGB array.
function hexToRgb(hex) {
  const sanitized = hex.replace("#", "");
  const intVal = parseInt(sanitized, 16);
  return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
}

// Convert RGB values to HEX string.
function rgbToHex(r, g, b) {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Convert RGB (0-255) to HSL (h in [0,360], s/l in [0,1])
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
      default: break;
    }
    h *= 60;
  }
  return [h, s, l];
}

// Convert HSL to RGB (returns array of 0-255 values)
function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Interpolate between two colors using HSL space.
function interpolateColorHSL(hex1, hex2, fraction) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const [h1, s1, l1] = rgbToHsl(r1, g1, b1);
  const [h2, s2, l2] = rgbToHsl(r2, g2, b2);
  // Ensure smooth hue interpolation around the circle:
  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = h1 + fraction * dh;
  const s = s1 + fraction * (s2 - s1);
  const l = l1 + fraction * (l2 - l1);
  const [nr, ng, nb] = hslToRgb(h, s, l);
  return rgbToHex(nr, ng, nb);
}

// Interpolate an array of color stops (each array has 12 stops) using HSL blending.
function interpolateMultipleArrays(arrays, progress) {
  const segmentCount = arrays.length - 1;
  const segIndex = Math.min(Math.floor(progress * segmentCount), segmentCount - 1);
  const nextIndex = Math.min(segIndex + 1, segmentCount);
  const frac = progress * segmentCount - segIndex;
  const result = [];
  for (let i = 0; i < 12; i++) {
    const c1 = arrays[segIndex][i] || "#000000";
    const c2 = arrays[nextIndex][i] || "#000000";
    result.push(interpolateColorHSL(c1, c2, frac));
  }
  return result;
}

// --- Component ---
const GradientBackground = ({
  // Optional location as { latitude, longitude }
  location,
  // Cloud cover percentage (0..100)
  cloudCover = 0,
  // Optional debugHour (0..24) and debugMinute (0..59) overrides
  debugHour,
  debugMinute,
  children,
}) => {
  const [sunrise, setSunrise] = useState(null);
  const [sunset, setSunset] = useState(null);
  const [phaseData, setPhaseData] = useState({ phase: "night", progress: 0 });
  const [finalColors, setFinalColors] = useState([]);

  // --- Debug Time Hook: Expose global setter.
  const [debugTime, setDebugTime] = useState(null);
  useEffect(() => {
    window.setDebugTime = (timeObj) => {
      // Expect timeObj = { hour: Number, minute: Number }
      setDebugTime(timeObj);
    };
  }, []);

  // --- Memoize current time, using debugTime if provided.
  const currentTime = useMemo(() => {
    const now = new Date();
    if (debugTime && typeof debugTime.hour === "number" && typeof debugTime.minute === "number") {
      now.setHours(debugTime.hour, debugTime.minute, 0, 0);
    } else if (
      typeof debugHour === "number" &&
      typeof debugMinute === "number"
    ) {
      now.setHours(debugHour, debugMinute, 0, 0);
    }
    return now;
  }, [debugTime, debugHour, debugMinute]);

  // --- Compute sunrise and sunset using SunCalc.
  useEffect(() => {
    if (location && location.latitude && location.longitude) {
      const times = SunCalc.getTimes(new Date(), location.latitude, location.longitude);
      setSunrise(times.sunrise);
      setSunset(times.sunset);
    } else {
      // Fallback: default local times (6 AM / 6 PM)
      const today = new Date();
      const defaultSunrise = new Date(today);
      defaultSunrise.setHours(6, 0, 0, 0);
      const defaultSunset = new Date(today);
      defaultSunset.setHours(18, 0, 0, 0);
      setSunrise(defaultSunrise);
      setSunset(defaultSunset);
    }
  }, [location]);

  // --- Calculate the current phase using extended offsets.
  useEffect(() => {
    if (!sunrise || !sunset) return;
    const transitionDuration = 45 * 60 * 1000; // 45 minutes in ms
    // iOS adjustments:
    const offsetSunsetStart = 10 * 60 * 1000;  // 10 minutes offset
    const offsetSunsetEnd = 13 * 60 * 1000;    // 13 minutes offset

    const sunriseStart = new Date(sunrise.getTime() - transitionDuration);
    const sunriseEnd = new Date(sunrise.getTime() + transitionDuration);
    const sunsetStart = new Date(sunset.getTime() - transitionDuration + offsetSunsetStart);
    const sunsetEnd = new Date(sunset.getTime() + transitionDuration + offsetSunsetEnd);

    let phase, progress;
    if (currentTime >= sunriseStart && currentTime <= sunriseEnd) {
      progress = (currentTime - sunriseStart) / (sunriseEnd - sunriseStart);
      phase = "sunrise";
    } else if (currentTime > sunriseEnd && currentTime < sunsetStart) {
      phase = "day";
      progress = 0;
    } else if (currentTime >= sunsetStart && currentTime <= sunsetEnd) {
      progress = (currentTime - sunsetStart) / (sunsetEnd - sunsetStart);
      phase = "sunset";
    } else {
      phase = "night";
      progress = 0;
    }
    setPhaseData((prev) => {
      if (prev.phase !== phase || prev.progress !== progress) {
        return { phase, progress };
      }
      return prev;
    });
  }, [sunrise, sunset, currentTime]);

  // --- Determine final gradient colors based on phaseData.
  useEffect(() => {
    let colors = [];
    if (phaseData.phase === "sunrise") {
      // Mimic iOS: transition from sunset12 → ... → sunset1 → earlyDay.
      const arrays = [
        gradients.sunset12,
        gradients.sunset11,
        gradients.sunset10,
        gradients.sunset9,
        gradients.sunset8,
        gradients.sunset7,
        gradients.sunset6,
        gradients.sunset5,
        gradients.sunset4,
        gradients.sunset3,
        gradients.sunset2,
        gradients.sunset1,
        gradients.earlyDay,
      ];
      colors = interpolateMultipleArrays(arrays, phaseData.progress);
    } else if (phaseData.phase === "sunset") {
      // Mimic iOS: transition from sunset1 → ... → sunset12 → earlyNight.
      const arrays = [
        gradients.sunset1,
        gradients.sunset2,
        gradients.sunset3,
        gradients.sunset4,
        gradients.sunset5,
        gradients.sunset6,
        gradients.sunset7,
        gradients.sunset8,
        gradients.sunset9,
        gradients.sunset10,
        gradients.sunset11,
        gradients.sunset12,
        gradients.earlyNight,
      ];
      colors = interpolateMultipleArrays(arrays, phaseData.progress);
    } else {
      // For day, night, or midnight, simply pick the matching gradient.
      const base = gradients[phaseData.phase] || gradients.midnight;
      colors = base.slice(0, 12);
    }
    setFinalColors(colors);
  }, [phaseData]);

  // --- Apply weather-based grayness.
  const finalWithGray = applyWeatherGrayness(finalColors, cloudCover);

  // --- Build style using separate background properties.
  const backgroundStyle = {
    backgroundImage: `linear-gradient(180deg, ${finalWithGray.join(", ")})`,
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    transition: "background-image 1s ease-in-out",
  };

  return <div style={backgroundStyle}>{children}</div>;
};

export default GradientBackground;
