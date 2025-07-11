"use client";

// Imports
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  Lock,
  Unlock,
  FileText,
  Image,
  Video,
  Key,
} from "lucide-react";

interface CaptchaData {
  num1: number;
  num2: number;
  answer: number;
}

export function DecryptPage() {
  // Main state
  const [activeMode, setActiveMode] = useState<"text" | "image" | "video">(
    "text"
  );
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [cipherText, setCipherText] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Scroll animation
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // CAPTCHA state
  const [captcha, setCaptcha] = useState<CaptchaData>({
    num1: 0,
    num2: 0,
    answer: 0,
  });
  const [captchaInput, setCaptchaInput] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [captchaError, setCaptchaError] = useState("");

  // Rate limit state
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Track mouse position for background effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Create a new CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
    setCaptchaInput("");
    setIsCaptchaValid(false);
    setCaptchaError("");
  };

  // Init CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Check CAPTCHA answer
  const validateCaptcha = () => {
    const userAnswer = parseInt(captchaInput);
    if (userAnswer === captcha.answer) {
      setIsCaptchaValid(true);
      setCaptchaError("");
      return true;
    } else {
      setIsCaptchaValid(false);
      setCaptchaError(
        "Incorrect CAPTCHA. Please solve the math problem correctly."
      );
      setTimeout(() => {
        generateCaptcha();
      }, 2000);
      return false;
    }
  };

  // Copy decrypted text
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Simple rate limit (memory only)
  const attemptHistory: number[] = [];

  const checkRateLimit = () => {
    const now = Date.now();
    const windowStart = now - 60000;
    const recentAttempts = attemptHistory.filter(
      (timestamp) => timestamp > windowStart
    );

    if (recentAttempts.length >= 5) {
      setIsRateLimited(true);
      setCooldownTime(60 - Math.floor((now - recentAttempts[0]) / 1000));
      const countdown = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return false;
    }

    attemptHistory.push(now);
    setAttemptCount(recentAttempts.length + 1);
    return true;
  };

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (decryptedUrl) URL.revokeObjectURL(decryptedUrl);
    };
  }, [decryptedUrl]);

  // Decrypt text handler
  const handleDecryptText = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!checkRateLimit()) {
        alert(`Too many attempts. Please wait ${cooldownTime} seconds.`);
        return;
      }
      if (!key || !cipherText) {
        alert("Please enter both the decryption key and ciphertext.");
        return;
      }
      if (!validateCaptcha()) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:5000/decrypt-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ciphertext: cipherText, password: key }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Decryption failed.");
        setDecryptedText(data.decryptedText);
        generateCaptcha();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Decryption failed.");
        setDecryptedText("");
        generateCaptcha();
      } finally {
        setIsLoading(false);
      }
    },
    [cipherText, key, captcha.answer, captchaInput, cooldownTime]
  );

  // Decrypt file handler
  const handleDecryptFile = useCallback(
    async (type: "image" | "video") => {
      if (!checkRateLimit()) {
        alert(`Too many attempts. Please wait ${cooldownTime} seconds.`);
        return;
      }
      if (!file || !key) {
        alert("Please select a file and enter the decryption key.");
        return;
      }
      if (!file.name.endsWith(".txt")) {
        setFileError("Only .txt files are accepted as ciphertext.");
        return;
      }
      setFileError(null);
      if (!validateCaptcha()) {
        return;
      }

      setIsLoading(true);
      setDecryptedUrl(null);

      const formData = new FormData();
      formData.append("textfile", file);
      formData.append("password", key);

      try {
        const response = await fetch(`http://localhost:5000/decrypt-${type}`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error(await response.text());
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDecryptedUrl(url);

        if (type === "video" && videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
          videoRef.current.play();
        }
        generateCaptcha();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Decryption failed.");
        generateCaptcha();
      } finally {
        setIsLoading(false);
      }
    },
    [file, key, captcha.answer, captchaInput, cooldownTime]
  );

  // Icons for mode selector
  const modeIcons = {
    text: FileText,
    image: Image,
    video: Video,
  };

  return (
    <>
      {/* Cosmic Background */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ y: backgroundY }}
      >
        {/* Starfield background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-black">
          {/* Static stars */}
          {[
            ...Array(
              window.innerWidth < 768
                ? 100
                : window.innerWidth < 1024
                ? 150
                : 200
            ),
          ].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-px h-px bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}

          {/* Twinkling stars */}
          {[
            ...Array(
              window.innerWidth < 768 ? 25 : window.innerWidth < 1024 ? 35 : 50
            ),
          ].map((_, i) => (
            <motion.div
              key={`twinkle-${i}`}
              className="absolute bg-white rounded-full"
              style={{
                width: `${
                  Math.random() * (window.innerWidth < 768 ? 2 : 3) + 1
                }px`,
                height: `${
                  Math.random() * (window.innerWidth < 768 ? 2 : 3) + 1
                }px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: Math.random() * 4 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Nebula-like clouds */}
        <motion.div
          className="absolute rounded-full opacity-5 blur-3xl"
          style={{
            width:
              window.innerWidth < 768
                ? "300px"
                : window.innerWidth < 1024
                ? "600px"
                : "1200px",
            height:
              window.innerWidth < 768
                ? "200px"
                : window.innerWidth < 1024
                ? "400px"
                : "800px",
            background: `radial-gradient(ellipse, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 40%, transparent 70%)`,
            left: `${20 + mousePosition.x * 0.02}%`,
            top: `${10 + mousePosition.y * 0.02}%`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="absolute rounded-full opacity-4 blur-3xl"
          style={{
            width:
              window.innerWidth < 768
                ? "200px"
                : window.innerWidth < 1024
                ? "400px"
                : "800px",
            height:
              window.innerWidth < 768
                ? "150px"
                : window.innerWidth < 1024
                ? "300px"
                : "600px",
            background: `radial-gradient(ellipse, rgba(147, 51, 234, 0.2) 0%, rgba(236, 72, 153, 0.1) 40%, transparent 70%)`,
            right: `${10 + mousePosition.x * 0.015}%`,
            bottom: `${20 + mousePosition.y * 0.015}%`,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Cosmic dust particles */}
        {[
          ...Array(
            window.innerWidth < 768 ? 50 : window.innerWidth < 1024 ? 75 : 100
          ),
        ].map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute bg-white rounded-full opacity-30"
            style={{
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, window.innerWidth < 768 ? -100 : -200, 0],
              x: [
                0,
                Math.random() * (window.innerWidth < 768 ? 50 : 100) -
                  (window.innerWidth < 768 ? 25 : 50),
                0,
              ],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear",
            }}
          />
        ))}

        {/* Shooting stars */}
        {[
          ...Array(
            window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3
          ),
        ].map((_, i) => (
          <motion.div
            key={`shooting-${i}`}
            className="absolute h-px bg-gradient-to-r from-white to-transparent"
            style={{
              width: window.innerWidth < 768 ? "8px" : "16px",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
            }}
            animate={{
              x: [
                0,
                window.innerWidth < 768
                  ? 150
                  : window.innerWidth < 1024
                  ? 225
                  : 300,
              ],
              y: [
                0,
                window.innerWidth < 768
                  ? 75
                  : window.innerWidth < 1024
                  ? 110
                  : 150,
              ],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: Math.random() * 8 + 2,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      {/* Static Hero Beam */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ y: backgroundY }}
      />

      <div className="fixed inset-0 flex items-center justify-center">
        <div
          className="fixed"
          style={{
            width:
              window.innerWidth < 768
                ? "200px"
                : window.innerWidth < 1024
                ? "400px"
                : "750px",
            height: "100vh",
            background:
              window.innerWidth < 768
                ? `linear-gradient(90deg,
                    transparent 0%,
                    rgba(59, 130, 246, 0.06) 20%,
                    rgba(59, 130, 246, 0.08) 50%,
                    rgba(59, 130, 246, 0.06) 80%,
                    transparent 100%
                  )`
                : `linear-gradient(90deg,
                    transparent 0%,
                    rgba(59, 130, 246, 0.08) 20%,
                    rgba(59, 130, 246, 0.12) 50%,
                    rgba(59, 130, 246, 0.08) 80%,
                    transparent 100%
                  )`,
            filter: window.innerWidth < 768 ? "blur(1px)" : "blur(2px)",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 pt-32 relative z-10">
        <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="w-full max-w-2xl">
            {/* Hero Header */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-center relative"
            >
              {/* Additional glow effect specifically for the title */}
              <div className="fixed inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent blur-3xl transform -skew-y-2 scale-150" />

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight tracking-tight mb-4 sm:mb-6 relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                style={{
                  textShadow: `
                    0 0 30px rgba(59, 130, 246, 0.3),
                    0 0 60px rgba(59, 130, 246, 0.2),
                    0 0 90px rgba(59, 130, 246, 0.1)
                  `,
                }}
              >
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Decrypt
                </span>
              </motion.h1>

              <motion.h2
                className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight mb-4 sm:mb-6 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <span className="bg-white bg-clip-text text-transparent">
                  with
                </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent px-2">
                  Deimos Cipher
                </span>
              </motion.h2>

              <motion.p
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto leading-relaxed px-2 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                Securely decrypt your data with advanced cryptographic
                protection and multi-layer authentication protocols.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-gradient-to-br from-red-900/30 to-red-800/20 backdrop-blur-lg rounded-2xl border border-red-700/30"
          >
            <div className="flex items-center text-red-300 text-sm">
              <Shield className="w-4 h-4 mr-2" />
              Rate limit exceeded. Please wait {cooldownTime} seconds.
            </div>
          </motion.div>
        )}

        {/* Attempt Counter */}
        {attemptCount > 0 && !isRateLimited && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-3 bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-lg rounded-xl border border-gray-700/30"
          >
            <p className="text-gray-400 text-xs text-center flex items-center justify-center">
              <Lock className="w-3 h-3 mr-1" />
              Attempts: {attemptCount}/5 (resets every minute)
            </p>
          </motion.div>
        )}

        {/* Mode Selector */}
        <motion.div
          className="relative mb-6 sm:mb-8 md:mb-10 p-2 sm:p-3 bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl mx-2 sm:mx-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Changed from flex-col sm:flex-row to always flex-row */}
          <div className="flex relative flex-row gap-1 sm:gap-2">
            {(["text", "image", "video"] as const).map((mode) => {
              const IconComponent = modeIcons[mode];
              const isActive = activeMode === mode;

              return (
                <motion.button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`relative !bg-transparent !border-white/10 mx-0 sm:mx-2 px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 lg:py-6 text-xs sm:text-sm font-semibold transition-all duration-400 !rounded-2xl sm:!rounded-3xl flex items-center justify-center space-x-2 sm:space-x-3 min-w-[80px] sm:min-w-[100px] md:min-w-[120px] flex-1 sm:flex-initial ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-gray-200 hover:text-gray-100"
                  }`}
                  whileHover={{
                    scale: 1.02,
                    y: -1,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{
                    scale: 0.98,
                    transition: { duration: 0.1 },
                  }}
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 -mx-0 sm:-mx-1 bg-gradient-to-br from-gray-800/70 to-gray-900/90 backdrop-blur-sm border border-white/30 rounded-xl sm:rounded-2xl"
                      layoutId="activeTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                        duration: 0.4,
                      }}
                      style={{
                        boxShadow:
                          "0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                      }}
                    />
                  )}

                  <div className="relative z-10 flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <motion.div
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <IconComponent
                        className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${
                          isActive ? "text-blue-400" : "text-current"
                        }`}
                      />
                    </motion.div>
                    <span className="font-medium tracking-wide text-[10px] sm:text-xs md:text-sm">
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Input Section */}
        <motion.div
          className="w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-xl xl:max-w-xl 2xl:max-w-2xl mx-auto px-4 sm:px-6 md:px-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="relative p-4 sm:p-6 md:p-8 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl">
            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-gray-600/10 to-transparent opacity-30 blur-sm"></div>

            <div className="relative z-10">
              {/* TEXT Decryption */}
              {activeMode === "text" && (
                <form
                  onSubmit={handleDecryptText}
                  className="space-y-4 sm:space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="text-gray-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-400 flex-shrink-0" />
                      Ciphertext
                    </label>
                    <textarea
                      value={cipherText}
                      onChange={(e) => setCipherText(e.target.value)}
                      placeholder="Enter ciphertext to decrypt"
                      className="w-full h-24 sm:h-28 md:h-32 bg-gray-900/30 border border-white/10 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm resize-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 placeholder-gray-400 backdrop-blur-sm transition-all duration-300 outline-none"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="flex text-gray-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 items-center">
                      <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-400 flex-shrink-0" />
                      Decryption Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter decryption key"
                        className="w-full !bg-gray-900/30 !border-white/10 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-xs sm:text-sm focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 backdrop-blur-sm transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center !bg-transparent text-gray-400 hover:!bg-gray-600/30 hover:!border-transparent hover:!rounded-lg transition-all duration-300 ease-in-out group w-5 h-6"
                      >
                        <div
                          className={`transition-transform p-1 duration-300 ease-in-out transform ${
                            showKey ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          {showKey ? (
                            <EyeOff className="w-4 h-4 transition-all duration-300 ease-in-out" />
                          ) : (
                            <Eye className="w-4 h-4 transition-all duration-300 ease-in-out" />
                          )}
                        </div>
                      </button>
                    </div>
                  </motion.div>

                  {/* CAPTCHA Section */}
                  <motion.div
                    className="p-4 sm:p-6 bg-black/20 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="flex text-gray-300 text-xs sm:text-sm font-medium mb-3 sm:mb-4 items-center">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-400 flex-shrink-0" />
                      Security Verification
                    </label>
                    <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
                      <div className="text-gray-300 bg-gray-900/30 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-mono text-xs sm:text-sm text-center min-w-[90px] sm:min-w-[120px] border border-white/10 flex-1 sm:flex-initial">
                        {captcha.num1} + {captcha.num2} = ?
                      </div>
                      <Button
                        type="button"
                        onClick={generateCaptcha}
                        className="p-2 sm:p-3 !bg-gray-900/30 hover:!bg-black/30 rounded-xl transition-all duration-300 border !border-white/10 flex-shrink-0"
                        title="Generate new CAPTCHA"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="#d1d5db"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </div>
                    <Input
                      type="number"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter the answer"
                      className={`w-full !bg-gray-900/30 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:!ring-2 transition-all duration-300 ${
                        isCaptchaValid
                          ? "border-green-500/30 focus:!border-green-400 focus:!ring-green-500/10"
                          : captchaError
                          ? "border-red-500/30 focus:!border-red-400 focus:!ring-red-500/10"
                          : "border-white/10 focus:!border-blue-500/30 focus:!ring-blue-500/10"
                      }`}
                    />
                    {captchaError && (
                      <p className="text-red-400 text-xs mt-2 sm:mt-3 font-medium">
                        {captchaError}
                      </p>
                    )}
                    {isCaptchaValid && (
                      <p className="text-green-400 text-xs mt-2 sm:mt-3 font-medium">
                        CAPTCHA verified
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center"
                  >
                    <Button
                      type="submit"
                      disabled={isRateLimited}
                      className={`w-auto py-2 px-4 !rounded-xl transition-all duration-300 relative overflow-hidden text-xs ${
                        isLoading || isRateLimited
                          ? "!bg-gray-700/50 cursor-not-allowed text-white"
                          : "!bg-transparent backdrop-blur-sm border !border-white/10 !text-white hover:!bg-gray-600/20 focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10"
                      }`}
                    >
                      <span className="flex items-center justify-center">
                        <Unlock className="w-3 h-3 mr-2 flex-shrink-0" />
                        Decrypt Text
                      </span>
                    </Button>
                  </motion.div>
                </form>
              )}

              {/* IMAGE / VIDEO Decryption */}
              {activeMode !== "text" && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="text-gray-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
                      {activeMode === "image" ? (
                        <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-400 flex-shrink-0" />
                      ) : activeMode === "video" ? (
                        <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-400 flex-shrink-0" />
                      ) : (
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-400 flex-shrink-0" />
                      )}
                      <span className="break-words">
                        Upload Ciphertext (
                        {activeMode.charAt(0).toUpperCase() +
                          activeMode.slice(1)}
                        ) File
                      </span>
                    </label>
                    <input
                      type="file"
                      accept="text/plain"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0] || null;
                        if (
                          selectedFile &&
                          !selectedFile.name.endsWith(".txt")
                        ) {
                          setFile(null);
                          setFileError(
                            "Please select a .txt file as ciphertext."
                          );
                        } else {
                          setFile(selectedFile);
                          setFileError(null);
                        }
                      }}
                      className="w-full !bg-gray-900/30 border !border-white/10 text-white rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 file:mr-2 sm:file:mr-3 file:py-1 file:px-2 sm:file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-600/30 file:text-white hover:file:bg-gray-600/50 file:cursor-pointer transition-all duration-300 outline-none"
                    />
                    {fileError && (
                      <p className="text-red-400 text-xs mt-2 font-medium">
                        {fileError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
                      <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-400 flex-shrink-0" />
                      Decryption Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter decryption key"
                        className="w-full !bg-gray-900/30 !border-white/10 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-xs sm:text-sm focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center !bg-transparent text-gray-400 hover:!bg-gray-600/30 hover:!border-transparent hover:!rounded-lg transition-all duration-300 ease-in-out group w-5 h-6"
                      >
                        <div
                          className={`transition-transform p-1 duration-300 ease-in-out transform ${
                            showKey ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          {showKey ? (
                            <EyeOff className="w-4 h-4 transition-all duration-300 ease-in-out" />
                          ) : (
                            <Eye className="w-4 h-4 transition-all duration-300 ease-in-out" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* CAPTCHA Section for File Decryption */}
                  <motion.div
                    className="p-4 sm:p-6 bg-black/20 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="flex text-gray-300 text-xs sm:text-sm font-medium mb-3 sm:mb-4 items-center">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-400 flex-shrink-0" />
                      Security Verification
                    </label>
                    <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
                      <div className="text-gray-300 bg-gray-900/30 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-mono text-xs sm:text-sm text-center min-w-[90px] sm:min-w-[120px] border border-white/10 flex-1 sm:flex-initial">
                        {captcha.num1} + {captcha.num2} = ?
                      </div>
                      <Button
                        type="button"
                        onClick={generateCaptcha}
                        className="p-2 sm:p-3 !bg-gray-900/30 hover:!bg-black/30 rounded-xl transition-all duration-300 border !border-white/10 flex-shrink-0"
                        title="Generate new CAPTCHA"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="#d1d5db"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </div>
                    <Input
                      type="number"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter the answer"
                      className={`w-full !bg-gray-900/30 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:!ring-2 transition-all duration-300 ${
                        isCaptchaValid
                          ? "border-green-500/30 focus:!border-green-400 focus:!ring-green-500/10"
                          : captchaError
                          ? "border-red-500/30 focus:!border-red-400 focus:!ring-red-500/10"
                          : "border-white/10 focus:!border-blue-500/30 focus:!ring-blue-500/10"
                      }`}
                    />
                    {captchaError && (
                      <p className="text-red-400 text-xs mt-2 sm:mt-3 font-medium">
                        {captchaError}
                      </p>
                    )}
                    {isCaptchaValid && (
                      <p className="text-green-400 text-xs mt-2 sm:mt-3 font-medium">
                        CAPTCHA verified
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center"
                  >
                    <Button
                      onClick={() => handleDecryptFile(activeMode)}
                      disabled={isLoading || isRateLimited}
                      className={`w-auto py-2 px-4 !rounded-xl transition-all duration-300 relative overflow-hidden text-xs ${
                        isLoading || isRateLimited
                          ? "!bg-gray-700/50 cursor-not-allowed text-white"
                          : "!bg-transparent backdrop-blur-sm border !border-white/10 !text-white hover:!bg-gray-600/20 focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10"
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 sm:mr-3 h-3 w-3 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Decrypting...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <Unlock className="w-3 h-3 mr-2 flex-shrink-0" />
                          Decrypt{" "}
                          {activeMode.charAt(0).toUpperCase() +
                            activeMode.slice(1)}
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Decrypted Text Output Box */}
          {activeMode === "text" && decryptedText && (
            <motion.div
              className="w-full mt-6 sm:mt-8 p-4 sm:p-6 bg-black/20 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-4">
                <h3 className="text-base sm:text-lg font-medium text-white flex items-center min-w-0 flex-shrink">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate">Decrypted Output</span>
                </h3>
                <Button
                  onClick={() => copyToClipboard(decryptedText)}
                  className="flex items-center gap-1 sm:gap-2 !bg-black/20 hover:!bg-gray-600/20 !text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-300 border !border-white/10 flex-shrink-0 whitespace-nowrap"
                  title="Copy to clipboard"
                >
                  {copySuccess ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  )}
                  <span className="hidden xs:inline sm:inline">
                    {copySuccess ? "Copied!" : "Copy"}
                  </span>
                </Button>
              </div>
              <pre className="bg-black/20 border border-white/10 rounded-xl p-3 sm:p-4 overflow-auto text-gray-300 text-xs sm:text-sm whitespace-pre-wrap break-all font-mono max-h-32 sm:max-h-40 md:max-h-48 backdrop-blur-sm">
                {decryptedText}
              </pre>
            </motion.div>
          )}
        </motion.div>
        {/* Image Display Section */}
        {decryptedUrl && activeMode === "image" && (
          <motion.div
            className="w-full max-w-6xl mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-black/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <h3 className="text-base sm:text-lg font-medium text-white flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Decrypted Image
              </h3>
            </div>

            <div className="bg-transparent border border-white/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
              <img
                src={decryptedUrl}
                alt="Decrypted"
                className="w-full h-auto min-h-[300px] max-h-[400px] sm:min-h-[350px] sm:max-h-[450px] object-contain rounded-lg bg-black/20"
                loading="lazy"
              />

              {/* Static Controls Below Image */}
              <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-transparent backdrop-blur-xl rounded-xl border border-white/20">
                <div className="flex flex-row items-center justify-center space-x-3 sm:space-x-4">
                  <button
                    onClick={() => window.open(decryptedUrl, "_blank")}
                    className="flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-sm sm:text-base transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                    <span className="hidden sm:inline">View Full Size</span>
                    <span className="sm:hidden">View</span>
                  </button>

                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = decryptedUrl;
                      link.download = "decrypted-image";
                      link.click();
                    }}
                    className="flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-sm sm:text-base transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Video Display Section */}
        {decryptedUrl && activeMode === "video" && (
          <motion.div
            className="w-full max-w-6xl mx-auto mt-6 sm:mt-8 p-4 sm:p-6 bg-black/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <h3 className="text-base sm:text-lg font-medium text-white flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Decrypted Video
              </h3>
            </div>

            <div className="bg-transparent border border-white/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
              <video
                ref={videoRef}
                controls
                className="w-full h-auto min-h-[300px] max-h-[400px] sm:min-h-[350px] sm:max-h-[450px] object-contain bg-black/20 rounded-lg"
                preload="metadata"
                playsInline
              >
                <source src={decryptedUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              <div className="mt-4 sm:mt-6 p-4 sm:p-5 !bg-transparent backdrop-blur-xl !rounded-xl border border-white/20">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                  <button
                    onClick={() => videoRef.current?.play()}
                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-xs sm:text-sm transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Play</span>
                  </button>

                  <button
                    onClick={() => videoRef.current?.pause()}
                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-xs sm:text-sm transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    <span>Pause</span>
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.max(
                          0,
                          videoRef.current.currentTime - 10
                        );
                      }
                    }}
                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-xs sm:text-sm transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                    </svg>
                    <span>-10s</span>
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.min(
                          videoRef.current.duration,
                          videoRef.current.currentTime + 10
                        );
                      }
                    }}
                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-xs sm:text-sm transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                    </svg>
                    <span>+10s</span>
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoRef.current.requestFullscreen) {
                          videoRef.current.requestFullscreen();
                        } else if (
                          (videoRef.current as any).webkitRequestFullscreen
                        ) {
                          (videoRef.current as any).webkitRequestFullscreen();
                        } else if (
                          (videoRef.current as any).mozRequestFullScreen
                        ) {
                          (videoRef.current as any).mozRequestFullScreen();
                        }
                      }
                    }}
                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-xs sm:text-sm transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                    <span className="hidden sm:inline">Fullscreen</span>
                    <span className="sm:hidden">Full</span>
                  </button>

                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = decryptedUrl;
                      link.download = "decrypted-video.mp4";
                      link.click();
                    }}
                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 !bg-transparent hover:!bg-slate-600/30 text-white !rounded-xl text-xs sm:text-sm transition-all duration-300 border !border-white/20 hover:!border-white/30 backdrop-blur-sm"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
