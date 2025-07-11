"use client";

// Imports
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, easeInOut } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  Lock,
  FileText,
  Image,
  Video,
  Key,
} from "lucide-react";

// Simple CAPTCHA type
interface CaptchaData {
  num1: number;
  num2: number;
  answer: number;
}

export function EncryptPage() {
  // UI state
  const [activeMode, setActiveMode] = useState<"text" | "image" | "video">(
    "text"
  );
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [plainText, setPlainText] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [encryptedFilename, setEncryptedFilename] = useState<string | null>(
    null
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Mouse position for background
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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

  // Track mouse for background effect
  useEffect(() => {
    window.scrollTo(0, 0);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Make a new CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
    setCaptchaInput("");
    setIsCaptchaValid(false);
    setCaptchaError("");
  };

  // Make CAPTCHA on mount
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

  // Copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Rate limit check (max 5 per minute)
  const checkRateLimit = () => {
    const now = Date.now();
    const windowStart = now - 60000;
    const attempts = JSON.parse(
      sessionStorage.getItem("encryptAttempts") || "[]"
    ).filter((timestamp: number) => timestamp > windowStart);

    if (attempts.length >= 5) {
      setIsRateLimited(true);
      setCooldownTime(60 - Math.floor((now - attempts[0]) / 1000));
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

    attempts.push(now);
    sessionStorage.setItem("encryptAttempts", JSON.stringify(attempts));
    setAttemptCount(attempts.length);
    return true;
  };

  // Make a random hex string for filenames
  const generateRandomHex = () => {
    return [...crypto.getRandomValues(new Uint8Array(8))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Encrypt text
  const handleEncryptText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRateLimit()) {
      alert(`Too many attempts. Please wait ${cooldownTime} seconds.`);
      return;
    }
    if (!key || !plainText) {
      alert("Please enter both the encryption key and plaintext.");
      return;
    }
    if (!validateCaptcha()) {
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/encrypt-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText, password: key }),
      });
      if (!response.ok) throw new Error("Encryption failed.");
      const data = await response.json();
      setEncryptedText(data.encryptedText);
      generateCaptcha();
    } catch (error) {
      alert("Encryption failed. Please try again.");
      setEncryptedText("");
      generateCaptcha();
    }
  };

  // Encrypt file (image/video)
  const handleEncryptFile = async () => {
    if (!checkRateLimit()) {
      alert(`Too many attempts. Please wait ${cooldownTime} seconds.`);
      return;
    }
    if (!file || !key) {
      alert("Please select a file and enter the encryption key.");
      return;
    }
    if (!validateCaptcha()) {
      return;
    }
    setIsLoading(true);
    setEncryptedFilename(null);

    const formData = new FormData();
    const fieldName = activeMode === "image" ? "image" : "video";
    formData.append(fieldName, file);
    formData.append("password", key);
    const randomHexFilename = generateRandomHex() + ".txt";

    try {
      const response = await fetch(
        `http://localhost:5000/encrypt-${activeMode}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Encryption failed.");
      const blob = await response.blob();
      setEncryptedFilename(randomHexFilename);

      // Download encrypted file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = randomHexFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      generateCaptcha();
    } catch (error) {
      alert("Encryption failed. Please try again.");
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Icons for mode selector
  const modeIcons = {
    text: FileText,
    image: Image,
    video: Video,
  };

  // Animated background gradient
  const slantingLightVariants = {
    animate: {
      background: [
        "linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.06) 20%, transparent 21%, transparent 40%, rgba(59, 130, 246, 0.04) 60%, transparent 61%, transparent 80%, rgba(59, 130, 246, 0.08) 90%, transparent 91%)",
        "linear-gradient(135deg, transparent 0%, rgba(139, 92, 246, 0.08) 25%, transparent 26%, transparent 45%, rgba(59, 130, 246, 0.06) 65%, transparent 66%, transparent 85%, rgba(139, 92, 246, 0.05) 95%, transparent 96%)",
        "linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.06) 20%, transparent 21%, transparent 40%, rgba(59, 130, 246, 0.04) 60%, transparent 61%, transparent 80%, rgba(59, 130, 246, 0.08) 90%, transparent 91%)",
      ],
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: easeInOut,
      },
    },
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }
    // Check file type
    if (
      (activeMode === "image" && !selectedFile.type.startsWith("image/")) ||
      (activeMode === "video" && !selectedFile.type.startsWith("video/"))
    ) {
      setFile(null);
      setFileError(
        activeMode === "image"
          ? "Please select a valid image file."
          : "Please select a valid video file."
      );
      return;
    }
    // Check file size (max 1GB)
    if (selectedFile.size > 1073741824) {
      setFile(null);
      setFileError("Please upload a file less than 1GB.");
      return;
    }
    setFile(selectedFile);
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

      {/* SLANTING LIGHT BEAM*/}
      <motion.div
        className="absolute inset-0"
        variants={slantingLightVariants}
        animate="animate"
      />

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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent blur-3xl transform -skew-y-2 scale-150" />

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
                  Encrypt
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
                Securely encrypt your data with advanced cryptographic
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
              {/* TEXT Encryption */}
              {activeMode === "text" && (
                <form
                  onSubmit={handleEncryptText}
                  className="space-y-4 sm:space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="text-gray-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-400 flex-shrink-0" />
                      Plaintext
                    </label>
                    <textarea
                      value={plainText}
                      onChange={(e) => setPlainText(e.target.value)}
                      placeholder="Enter text to encrypt"
                      className="w-full h-24 sm:h-28 md:h-32 bg-gray-900/30 border border-white/10 focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 outline-none text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm resize-none placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="flex text-gray-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 items-center">
                      <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-400 flex-shrink-0" />
                      Encryption Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Set an encryption key"
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
                          : "!bg-transparent backdrop-blur-sm border !border-white/10 !text-white focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 hover:!bg-gray-600/20"
                      }`}
                    >
                      <span className="flex items-center justify-center">
                        <Lock className="w-3 h-3 mr-2 flex-shrink-0" />
                        Encrypt Text
                      </span>
                    </Button>
                  </motion.div>
                </form>
              )}

              {/* IMAGE / VIDEO Encryption */}
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
                        Upload{" "}
                        {activeMode.charAt(0).toUpperCase() +
                          activeMode.slice(1)}
                        <span className="hidden sm:inline"> (Max: 1GB)</span>
                        <span className="sm:hidden"> (Max 1GB)</span>
                      </span>
                    </label>
                    <input
                      type="file"
                      accept={activeMode === "image" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                      className="w-full !bg-gray-900/30 border !border-white/10 text-white rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 file:mr-2 sm:file:mr-3 file:py-1 file:px-2 sm:file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-600/30 file:text-white hover:file:bg-gray-600/50 file:cursor-pointer transition-all duration-300"
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
                      Encryption Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Set an encryption key"
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

                  {/* CAPTCHA Section for File Encryption */}
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
                      onClick={handleEncryptFile}
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
                          Encrypting...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <Lock className="w-3 h-3 mr-2 flex-shrink-0" />
                          Encrypt{" "}
                          {activeMode.charAt(0).toUpperCase() +
                            activeMode.slice(1)}
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Encrypted File Output */}
            {activeMode !== "text" && encryptedFilename && (
              <motion.div
                className="mt-4 sm:mt-6 p-3 sm:p-4 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center text-gray-300 text-xs">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="block sm:inline">
                      Encrypted file downloaded:{" "}
                    </span>
                    <span className="font-mono text-white break-all">
                      {encryptedFilename}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Encrypted Text Output Box */}
            {activeMode === "text" && encryptedText && (
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
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">Encrypted Output</span>
                  </h3>
                  <Button
                    onClick={() => copyToClipboard(encryptedText)}
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
                  {encryptedText}
                </pre>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
