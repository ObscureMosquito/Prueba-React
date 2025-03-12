export const applyWeatherGrayness = (colors, cloudPercentage) => {
  if (!Array.isArray(colors)) {
    console.error(
      "Error applying weather grayness: Invalid colors array",
      colors
    );
    return [];
  }

  const graynessFactor = Math.max(0, Math.min(cloudPercentage / 100, 1));

  return colors.map((hex) => {
    if (typeof hex !== "string") {
      console.warn("Skipping invalid color format:", hex);
      return hex;
    }

    const [r, g, b] = hexToRgb(hex);
    if (r == null || g == null || b == null) {

      console.warn("Unable to parse color:", hex);
      return hex;
    }

    const gray = (r + g + b) / 3;
    const newR = Math.round(r * (1 - graynessFactor) + gray * graynessFactor);
    const newG = Math.round(g * (1 - graynessFactor) + gray * graynessFactor);
    const newB = Math.round(b * (1 - graynessFactor) + gray * graynessFactor);

    return `rgb(${newR}, ${newG}, ${newB})`;
  });
};

function hexToRgb(hex) {
  let sanitized = hex.replace("#", "");

  if (sanitized.length === 3) {
    sanitized =
      sanitized[0] +
      sanitized[0] +
      sanitized[1] +
      sanitized[1] +
      sanitized[2] +
      sanitized[2];
  }
  const intVal = parseInt(sanitized, 16);
  if (isNaN(intVal)) return [null, null, null];

  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;

  return [r, g, b];
}
