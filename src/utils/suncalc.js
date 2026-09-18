/**
 * Pattaya Solar Calculator & Golden Hour Tracker
 * Computes astronomical sunrise, golden hour, and sunset countdown for Pattaya Bay (12.9345°N, 100.8825°E)
 */

export function getPattayaSolarTimes(date = new Date()) {
  const lat = 12.9345;
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Solar declination
  const declination = -23.44 * Math.cos(((360 / 365) * (dayOfYear + 10) * Math.PI) / 180);
  const latRad = (lat * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;

  // Hour angle
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
  const hourAngleDeg = (Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180) / Math.PI;

  const solarNoonHoursIct = 12.275;
  const halfDayHours = hourAngleDeg / 15;

  const sunriseHoursIct = solarNoonHoursIct - halfDayHours;
  const sunsetHoursIct = solarNoonHoursIct + halfDayHours;
  const goldenHourStartIct = sunsetHoursIct - 0.75; // 45 min before sunset

  return {
    sunriseHoursIct,
    sunsetHoursIct,
    goldenHourStartIct,
  };
}

/**
 * Returns human-readable golden hour / sunset status string
 */
export function getSunsetStatus(date = new Date()) {
  try {
    const { sunriseHoursIct, sunsetHoursIct, goldenHourStartIct } = getPattayaSolarTimes(date);

    // Current ICT decimal hour
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
    const ictHours = (utcHours + 7) % 24;

    const toTimeStr = (decimalHours) => {
      const h = Math.floor(decimalHours);
      const m = Math.floor((decimalHours - h) * 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const sunsetFormatted = toTimeStr(sunsetHoursIct);

    // 1. Golden Hour (45 min leading to sunset)
    if (ictHours >= goldenHourStartIct && ictHours < sunsetHoursIct) {
      const remainingMin = Math.max(1, Math.round((sunsetHoursIct - ictHours) * 60));
      return {
        isGoldenHour: true,
        isNight: false,
        label: `✨ Golden Hour (Sunset in ${remainingMin}m at ${sunsetFormatted})`,
        sunsetTime: sunsetFormatted,
      };
    }

    // 2. Daytime before golden hour
    if (ictHours >= sunriseHoursIct && ictHours < goldenHourStartIct) {
      const diffHours = sunsetHoursIct - ictHours;
      const h = Math.floor(diffHours);
      const m = Math.round((diffHours - h) * 60);
      return {
        isGoldenHour: false,
        isNight: false,
        label: `🌅 Sunset at ${sunsetFormatted} (${h > 0 ? `${h}h ` : ''}${m}m)`,
        sunsetTime: sunsetFormatted,
      };
    }

    // 3. Dusk Twilight (up to 30 min after sunset)
    if (ictHours >= sunsetHoursIct && ictHours < sunsetHoursIct + 0.5) {
      return {
        isGoldenHour: false,
        isNight: true,
        label: '🌆 Twilight over Pattaya Bay',
        sunsetTime: sunsetFormatted,
      };
    }

    // 4. Nighttime
    return {
      isGoldenHour: false,
      isNight: true,
      label: `🌙 Night • Sunset was ${sunsetFormatted}`,
      sunsetTime: sunsetFormatted,
    };
  } catch {
    return {
      isGoldenHour: false,
      isNight: true,
      label: '🌅 Sunset 18:25 ICT',
      sunsetTime: '18:25',
    };
  }
}
