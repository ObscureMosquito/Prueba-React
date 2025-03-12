import { useEffect } from "react";

const StarsBackground = ({ numStars = 60 }) => {
  useEffect(() => {
    const canvas = document.getElementById("starCanvas");
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initializeStars() {
      let stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          baseRadius: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
          pulseSpeed: Math.random() * 0.005 + 0.001,
          shouldPulse: Math.random() > 0.5,
        });
      }

      function drawStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach((star) => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          ctx.fill();

          star.x += star.speedX;
          star.y += star.speedY;
          if (star.x < 0 || star.x > canvas.width) star.speedX *= -1;
          if (star.y < 0 || star.y > canvas.height) star.speedY *= -1;
          if (star.shouldPulse) {
            star.radius = star.baseRadius + Math.sin(Date.now() * star.pulseSpeed) * 0.2;
          }
          star.alpha += (Math.random() - 0.5) * 0.05;
          star.alpha = Math.max(0.1, Math.min(1, star.alpha));
        });

        requestAnimationFrame(drawStars);
      }

      drawStars();
    }

    function setup() {
      resizeCanvas();
      initializeStars();
    }

    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        initializeStars();
      }, 200);
    });

    setup();
  }, [numStars]);

  return <canvas id="starCanvas" className="absolute inset-0 w-full h-full"></canvas>;
};

export default StarsBackground;
