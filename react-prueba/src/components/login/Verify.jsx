import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StarsBackground from "../../components/common/StarsBackground";
import { useAuth } from "../../context/AuthContext";

const Verify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email;
  const password = location.state?.password;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email || !password) {
      navigate("/login");
    }

    const storedTime = localStorage.getItem("resendTimer");
    if (storedTime) {
      const timeLeft = Math.max(0, Math.ceil((parseInt(storedTime) - Date.now()) / 1000));
      if (timeLeft > 0) {
        setResendTimer(timeLeft);
      }
    }
  }, [email, password, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("resendTimer");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length === 6) {
      setCode(value.split("").slice(0, 6));
      inputRefs.current[5]?.focus();
    } else if (value.length === 1) {
      let newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedText.length === 6) {
      setCode(pastedText.split(""));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Verification failed");

      setMessage("Verification successful! Logging in...");
      await login(email, password);
      navigate("/home");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Failed to resend code");

      setMessage("Verification code resent! Check your email.");
      setResendTimer(60);
      localStorage.setItem("resendTimer", Date.now() + 60000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-[rgba(27,57,105,0.9)] to-[rgba(70,14,126,0.61)] p-6">
      <StarsBackground numStars={50} />

      <div className="relative w-[320px] max-w-full backdrop-blur-lg backdrop-saturate-150 bg-gray-200/20 border border-white/20 shadow-[inset_0.5px_1px_1px_rgba(255,255,255,0.125)] rounded-lg p-6 text-center z-10">
        <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>

        {message && <p className="text-green-500 mt-2">{message}</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-4">
          {/* ✅ Centered & Responsive Email with Truncation */}
          <p className="text-gray-300 text-md font-semibold text-center break-words truncate" style={{ 
              maxWidth: "100%", 
              minWidth: "200px", 
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
            {email}
          </p>

          {/* ✅ Shorter & Centered Code Inputs */}
          <div className="flex justify-center gap-2 mt-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                maxLength="1"
                className="w-10 h-10 text-center text-lg font-bold bg-gray-800 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full p-3 font-bold rounded-md text-white bg-blue-500 hover:bg-blue-600 mt-4"
          >
            Verify
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleResendCode}
            disabled={resendTimer > 0}
            className={`text-blue-400 hover:text-blue-500 ${
              resendTimer > 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verify;
