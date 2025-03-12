import { useState, useEffect } from "react";
import useTimeOfDay from "../../utils/weather/useTimeOfDay";
import { gradients } from "../../utils/weather/gradients";
import { applyWeatherGrayness } from "../../utils/weather/applyWeatherGrayness";
import { useAuth } from "../../context/AuthContext";
import { getWeatherByLocation } from "../../utils/weather/web";
import StarsBackground from "../../components/common/StarsBackground";
import { motion } from "framer-motion";
import SunCalc from "suncalc";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  CircularProgress,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import RemindersWidget from "./RemindersWidget";
import GradientBackground from "../../components/common/GradientBackground";

const Home = () => {
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      const data = await getWeatherByLocation();
      setWeather(data);
      setLoading(false);
    };
    fetchWeather();
  }, []);

  const phase = { phase: "midnight" };

  const gradientKeys = Object.keys(gradients);
  const phaseIndex = gradientKeys.indexOf(phase.phase);
  const nextPhaseIndex = Math.min(phaseIndex + 1, gradientKeys.length - 1);
  const nextPhase = gradientKeys[nextPhaseIndex];

  var currentGradient = gradients[phase.phase] ?? [];
  var nextGradient = gradients[nextPhase] ?? [];

  if (currentGradient.length === 0) currentGradient = ["#000000", "#222222"];
  if (nextGradient.length === 0) nextGradient = ["#000000", "#222222"];

  const phaseProgress = 1.0;
  const interpolatedGradient = interpolateGradientColors(currentGradient, nextGradient, phaseProgress);

  function interpolateGradientColors(fromColors, toColors, progress) {
    return fromColors.map((color, index) =>
      toColors[index] ? interpolateColor(fromColors[index], toColors[index], progress) : color
    );
  }

  function interpolateColor(color1, color2, progress) {
    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);
    return rgbToHex(
      Math.round(r1 + (r2 - r1) * progress),
      Math.round(g1 + (g2 - g1) * progress),
      Math.round(b1 + (b2 - b1) * progress)
    );
  }

  function hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }

  function rgbToHex(r, g, b) {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  const backgroundStyle = {
    background: `linear-gradient(180deg, ${interpolatedGradient.join(", ")})`,
    minHeight: "100vh",
    backgroundRepeat: "no-repeat",
    transition: "background 1s ease-in-out",
  };

  var isNight = SunCalc.getTimes(new Date(), user.latitude, user.longitude).sunset < new Date();

  return (
<GradientBackground location={location} cloudCover="40">
      <motion.div style={{ minHeight: "100vh" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <StarsBackground numStars={isNight ? 50 : 0} />
        <AppBar position="static" color="transparent" sx={{ boxShadow: "none" }}>
          <Toolbar sx={{ flexWrap: "wrap" }}>
            <Button sx={{ color: "white", mb: { xs: 1, sm: 0 } }} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Container sx={{ textAlign: "center", pt: 5 }}>
          {loading ? (
            <CircularProgress color="inherit" />
          ) : (
            weather && (
              <>
                <Typography variant="h3" color="white">
                  {weather.temp}°C - {weather.condition}
                </Typography>
                <Typography variant="h6" color="white" sx={{ mt: 2 }}>
                  🌅 Sunrise: {weather.sunriseTime} | 🌇 Sunset: {weather.sunsetTime}
                </Typography>
              </>
            )
          )}
          <div style={{ height: 30 }} />
          <center><RemindersWidget /></center>
        </Container>
      </motion.div>
    </GradientBackground>
  );
};

export default Home;
