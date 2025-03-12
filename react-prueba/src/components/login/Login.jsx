import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import StarsBackground from "../../components/common/StarsBackground";

const Login = () => {
  const { login, error } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(formData.email, formData.password);
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-[rgba(27,57,105,0.9)] to-[rgba(70,14,126,0.61)] p-6">
      <StarsBackground numStars={50} />

      <div className="relative w-[310px] max-w-full backdrop-blur-lg backdrop-saturate-180 bg-gray-200/20 border border-white/20 shadow-[inset_0.5px_1px_1px_rgba(255,255,255,0.125)] rounded-lg p-6 text-center z-10">
        <h2 className="text-3xl font-bold text-white">Log In</h2>
        <p className="text-gray-300 mt-2">Welcome Back!</p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mt-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-white/30 rounded-md bg-transparent text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-white/30 rounded-md bg-transparent text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-300 hover:text-gray-100"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className={`w-full p-3 font-bold rounded-md text-white transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-gray-300 text-sm mt-4">
          No account?{" "}
          <Link to="/register" className="text-blue-500 font-semibold">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
