"use client";

// React and Framer Motion imports
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, easeInOut } from "framer-motion";

// Main contact page component
export default function ContactPage() {
  // Mouse position for background effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // OTP-related states
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false); // New state for verification status
  const [otpError, setOtpError] = useState(""); // New state for OTP errors

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

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

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const validateForm = () => {
    let valid = true;
    let newErrors = { name: "", email: "", message: "" };

    if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const sendOTP = async () => {
    if (!formData.email.trim()) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter your email to receive OTP",
      }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, email: "" }));
    setOtpSending(true);
    setOtpError(""); // Clear any previous OTP errors

    try {
      const response = await fetch("http://localhost:5000/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to send OTP";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage =
            response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      await response.json();

      setOtpSent(true);
      setOtpVerified(false);
      setOtpInput("");
      setOtpError(""); // Clear any previous errors
      setCooldown(90); // Set cooldown for 90 seconds

      console.log("OTP sent successfully");
    } catch (error) {
      console.error("Error sending OTP:", error);
      setErrors((prev) => ({
        ...prev,
        email:
          error instanceof Error
            ? error.message
            : "Failed to send OTP. Please try again.",
      }));
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOTP = async (inputOtp: string) => {
    if (inputOtp.length !== 6) return false;

    setOtpVerifying(true);
    setOtpError("");

    try {
      const response = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: inputOtp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.message || "Failed to verify OTP");
        return false;
      }

      if (data.success === true) {
        // ✅ Fix here
        setOtpError("");
        return true;
      } else {
        setOtpError(data.message || "Invalid OTP. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpError("Network error. Please try again.");
      return false;
    } finally {
      setOtpVerifying(false);
    }
  };

  // Updated handleOtpChange function for 6-box input
  const handleOtpChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    if (value.length <= 1) {
      const newOtp = otpInput.split("");
      newOtp[index] = value;
      const newOtpString = newOtp.join("");

      setOtpInput(newOtpString);
      setOtpError(""); // Clear errors when user types

      // Auto-focus next input if value is entered
      if (value && index < 5) {
        const nextInput = e.target.parentElement?.children[
          index + 1
        ] as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }

      // Verify OTP when 6 digits are entered
      if (newOtpString.length === 6) {
        const isValid = await verifyOTP(newOtpString);
        setOtpVerified(isValid);
      } else {
        setOtpVerified(false);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otpInput[index] && index > 0) {
      const prevInput = e.currentTarget.parentElement?.children[
        index - 1
      ] as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
    // Handle arrow key navigation
    else if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = e.currentTarget.parentElement?.children[
        index - 1
      ] as HTMLInputElement;
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      const nextInput = e.currentTarget.parentElement?.children[
        index + 1
      ] as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  // Handle paste functionality
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "");

    if (paste.length === 6) {
      setOtpInput(paste);
      setOtpError(""); // Clear errors when user pastes

      // Focus the last input box
      const lastInput = e.currentTarget.parentElement
        ?.children[5] as HTMLInputElement;
      if (lastInput) lastInput.focus();

      // Verify the pasted OTP
      const isValid = await verifyOTP(paste);
      setOtpVerified(isValid);
    } else if (paste.length > 0) {
      // Handle partial paste
      const newOtp = otpInput.split("");
      for (let i = 0; i < paste.length && index + i < 6; i++) {
        newOtp[index + i] = paste[i];
      }
      const newOtpString = newOtp.join("");
      setOtpInput(newOtpString);

      // Focus appropriate input
      const focusIndex = Math.min(index + paste.length, 5);
      const focusInput = e.currentTarget.parentElement?.children[
        focusIndex
      ] as HTMLInputElement;
      if (focusInput) focusInput.focus();

      // Verify if complete
      if (newOtpString.length === 6) {
        const isValid = await verifyOTP(newOtpString);
        setOtpVerified(isValid);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;
    if (!otpVerified) {
      setSubmitError("Please verify your email with the OTP first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          message: formData.message.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to send message";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage =
            response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      setFormData({ name: "", email: "", message: "" });
      setErrors({ name: "", email: "", message: "" });
      setOtpSent(false);
      setOtpInput("");
      setOtpVerified(false);
      setOtpError("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 60,
        damping: 20,
        duration: 1.2,
      },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.3, duration: 0.8, ease: easeInOut },
    },
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
              window.innerWidth >= 1024
                ? 200
                : window.innerWidth >= 768
                ? 150
                : 100
            ),
          ].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-px h-px bg-white !rounded-full animate-pulse"
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
              window.innerWidth >= 1024
                ? 50
                : window.innerWidth >= 768
                ? 35
                : 25
            ),
          ].map((_, i) => (
            <motion.div
              key={`twinkle-${i}`}
              className="absolute bg-white !rounded-full"
              style={{
                width: `${
                  Math.random() * (window.innerWidth >= 768 ? 4 : 3) + 1
                }px`,
                height: `${
                  Math.random() * (window.innerWidth >= 768 ? 4 : 3) + 1
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

        {/* Subtle Aurora Borealis */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Soft Aurora Glow */}
          <motion.div
            className="absolute blur-3xl"
            style={{
              width: `${
                window.innerWidth >= 1024
                  ? 120
                  : window.innerWidth >= 768
                  ? 110
                  : 100
              }%`,
              height: `${
                window.innerWidth >= 1024
                  ? 300
                  : window.innerWidth >= 768
                  ? 200
                  : 150
              }px`,
              left: "-10%",
              top: `${
                window.innerWidth >= 1024
                  ? 5
                  : window.innerWidth >= 768
                  ? 8
                  : 12
              }%`,
              background: `linear-gradient(45deg, 
                transparent 0%, 
                rgba(34, 197, 94, 0.15) 30%, 
                rgba(99, 102, 241, 0.18) 50%, 
                rgba(34, 197, 94, 0.16) 70%, 
                transparent 100%)`,
              transform: "rotate(-25deg)",
            }}
            animate={{
              opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
              scaleY: [1, 1.1, 0.9, 1.05, 1],
              x: [0, 20, -15, 10, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Secondary soft glow */}
          <motion.div
            className="absolute blur-3xl"
            style={{
              width: `${
                window.innerWidth >= 1024
                  ? 100
                  : window.innerWidth >= 768
                  ? 90
                  : 80
              }%`,
              height: `${
                window.innerWidth >= 1024
                  ? 200
                  : window.innerWidth >= 768
                  ? 140
                  : 100
              }px`,
              left: "0%",
              top: `${
                window.innerWidth >= 1024
                  ? 15
                  : window.innerWidth >= 768
                  ? 20
                  : 25
              }%`,
              background: `linear-gradient(60deg, 
                transparent 0%, 
                rgba(147, 51, 234, 0.12) 40%, 
                rgba(236, 72, 153, 0.14) 60%, 
                transparent 100%)`,
              transform: "rotate(-20deg)",
            }}
            animate={{
              opacity: [0.2, 0.5, 0.3, 0.6, 0.2],
              scaleY: [1, 0.9, 1.1, 0.95, 1],
              x: [0, -10, 25, -5, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />
        </div>

        {/* Nebula-like clouds */}
        <motion.div
          className="absolute !rounded-full opacity-5 blur-3xl"
          style={{
            width: `${
              window.innerWidth >= 1024
                ? 1200
                : window.innerWidth >= 768
                ? 600
                : 300
            }px`,
            height: `${
              window.innerWidth >= 1024
                ? 800
                : window.innerWidth >= 768
                ? 400
                : 200
            }px`,
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
          className="absolute !rounded-full opacity-4 blur-3xl"
          style={{
            width: `${
              window.innerWidth >= 1024
                ? 800
                : window.innerWidth >= 768
                ? 400
                : 200
            }px`,
            height: `${
              window.innerWidth >= 1024
                ? 600
                : window.innerWidth >= 768
                ? 300
                : 150
            }px`,
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
            window.innerWidth >= 1024 ? 100 : window.innerWidth >= 768 ? 75 : 50
          ),
        ].map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute bg-white !rounded-full opacity-30"
            style={{
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [
                0,
                window.innerWidth >= 1024
                  ? -200
                  : window.innerWidth >= 768
                  ? -150
                  : -100,
                0,
              ],
              x: [
                0,
                Math.random() *
                  (window.innerWidth >= 1024
                    ? 100
                    : window.innerWidth >= 768
                    ? 75
                    : 50) -
                  (window.innerWidth >= 1024
                    ? 50
                    : window.innerWidth >= 768
                    ? 37.5
                    : 25),
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
            window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1
          ),
        ].map((_, i) => (
          <motion.div
            key={`shooting-${i}`}
            className="absolute h-px bg-gradient-to-r from-white to-transparent"
            style={{
              width: `${window.innerWidth >= 768 ? 16 : 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
            }}
            animate={{
              x: [
                0,
                window.innerWidth >= 1024
                  ? 300
                  : window.innerWidth >= 768
                  ? 225
                  : 150,
              ],
              y: [
                0,
                window.innerWidth >= 1024
                  ? 150
                  : window.innerWidth >= 768
                  ? 110
                  : 75,
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

      {/* Success Message Portal */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 flex items-start justify-center pt-4 sm:pt-6 md:pt-8 px-4">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                duration: 0.5,
              }}
              className="bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-green-600/20 
                         border border-green-400/40 !rounded-2xl p-4 sm:p-6 
                         backdrop-blur-lg shadow-2xl max-w-sm w-full
                         pointer-events-auto"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <motion.div
                    className="w-10 h-10 bg-green-500/30 !rounded-full flex items-center justify-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                </div>
                <div>
                  <motion.h4
                    className="text-green-300 font-medium text-base sm:text-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Message Sent Successfully!
                  </motion.h4>
                  <motion.p
                    className="text-green-200/80 text-sm mt-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    I'll get back to you soon.
                  </motion.p>
                </div>
              </div>

              {/* Progress bar */}
              <motion.div
                className="mt-4 h-1 bg-green-500/20 !rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 !rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 flex items-start justify-center pt-4 sm:pt-6 md:pt-8 px-4">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                duration: 0.5,
              }}
              className="bg-gradient-to-br from-red-500/20 via-red-500/15 to-red-600/20 
                         border border-red-400/40 !rounded-2xl p-4 sm:p-6 
                         backdrop-blur-lg shadow-2xl max-w-sm w-full
                         pointer-events-auto"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500/30 !rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-red-300 font-medium text-base sm:text-lg">
                    Error Sending Message
                  </h4>
                  <p className="text-red-200/80 text-sm mt-1">{submitError}</p>
                </div>
              </div>
              <button
                onClick={() => setSubmitError("")}
                className="mt-3 text-red-300 hover:text-red-200 text-sm underline"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Contact Form */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 pt-32 relative z-10">
        <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="w-full max-w-2xl">
            <motion.div
              variants={heroVariants}
              initial="hidden"
              animate="visible"
              className="text-center mb-12 sm:mb-16 lg:mb-20"
            >
              <motion.h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight tracking-tight mb-6 sm:mb-8">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Contact{" "}
                </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Me
                </span>
              </motion.h1>
              <motion.p
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto leading-relaxed px-2 relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                Get in touch with the developer for support, partnerships, or
                inquiries about Deimos Cipher
              </motion.p>
            </motion.div>

            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              className="flex justify-center"
            >
              <div className="w-full overflow-x-hidden relative">
                <form onSubmit={handleSubmit}>
                  <div className="relative p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-black/20 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
                    <div className="relative z-10 space-y-6">
                      {/* Name */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-2"
                      >
                        <label
                          htmlFor="name"
                          className="block text-white font-light text-lg"
                        >
                          Name <span className="text-red-400">*</span>
                        </label>
                        <motion.input
                          id="name"
                          type="text"
                          className="w-full h-14 bg-gray-900/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200 outline-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 focus:bg-gray-900/40"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                      </motion.div>

                      {/* Email + Send OTP */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <label
                            htmlFor="email"
                            className="text-white font-light text-base sm:text-lg"
                          >
                            Email <span className="text-red-400">*</span>
                          </label>

                          {/* Verification Status Badge */}
                          {formData.email && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium ${
                                otpVerified
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              }`}
                            >
                              {otpVerified ? (
                                <>
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Verified
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                  </svg>
                                  Unverified
                                </>
                              )}
                            </motion.div>
                          )}
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                          <motion.input
                            id="email"
                            type="email"
                            className="flex-1 h-12 sm:h-14 bg-gray-900/30 border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200 outline-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 focus:bg-gray-900/40 text-sm sm:text-base"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            required
                            disabled={otpVerified}
                          />
                          <motion.button
                            type="button"
                            onClick={sendOTP}
                            disabled={otpSending || otpVerified || otpSent}
                            className={`relative px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm !rounded-xl !bg-transparent backdrop-blur-md border !border-white/10 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] sm:min-w-[100px] font-medium outline-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 whitespace-nowrap ${
                              !(otpSending || otpVerified || otpSent)
                                ? "hover:!bg-gray-800/30 hover:border-gray-400"
                                : ""
                            }`}
                            whileTap={{
                              scale:
                                otpSending || otpVerified || otpSent ? 1 : 0.95,
                            }}
                          >
                            {otpVerified ? (
                              <span className="flex items-center justify-center text-green-400">
                                <span className="hidden sm:inline">
                                  Verified
                                </span>
                                <svg
                                  className="w-4 h-4 sm:hidden"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            ) : otpSending ? (
                              <span className="flex items-center justify-center">
                                <motion.div
                                  className="w-3 h-3 sm:w-4 sm:h-4 border-2 !border-gray-400/30 !border-t-gray-300 !rounded-full mr-1 sm:mr-2"
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                />
                                <span className="hidden sm:inline">
                                  Sending...
                                </span>
                              </span>
                            ) : otpSent ? (
                              <span className="flex items-center justify-center text-gray-400">
                                <span className="hidden sm:inline">Sent</span>
                                <svg
                                  className="w-4 h-4 sm:hidden"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </span>
                            ) : (
                              <>
                                <span className="hidden sm:inline">
                                  Send OTP
                                </span>
                                <span className="sm:hidden text-xs">
                                  Send OTP
                                </span>
                              </>
                            )}
                          </motion.button>
                        </div>
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-2">
                            {errors.email}
                          </p>
                        )}
                      </motion.div>

                      {/* OTP Input with 6 boxes */}
                      {otpSent && !otpVerified && (
                        <motion.div
                          initial={{ opacity: 0, y: -20, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -20, height: 0 }}
                          transition={{
                            delay: 0.2,
                            duration: 0.5,
                            ease: "easeOut",
                          }}
                          className="overflow-hidden"
                        >
                          <div className="relative p-4 sm:p-6 rounded-xl bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-600/5 border border-cyan-400/20 backdrop-blur-sm">
                            {/* OTP Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                              <label className="text-white font-light text-base sm:text-lg">
                                Enter Verification Code{" "}
                                <span className="text-red-400">*</span>
                              </label>
                              <div className="flex items-center text-xs sm:text-sm text-gray-400">
                                <svg
                                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                Code sent to your email
                              </div>
                            </div>

                            {/* 6-Box OTP Input */}
                            <div className="flex justify-center mb-4 sm:mb-6">
                              <div className="flex gap-2 sm:gap-3">
                                {Array.from({ length: 6 }, (_, index) => (
                                  <motion.input
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    data-otp-index={index}
                                    className={`w-10 h-12 sm:w-12 sm:h-14 bg-gray-900/40 border rounded-xl text-white text-center text-base sm:text-lg font-mono backdrop-blur-sm transition-all duration-200 outline-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 focus:bg-gray-900/50 ${
                                      otpError
                                        ? "border-red-400/50 bg-red-900/20"
                                        : otpInput[index]
                                        ? "border-cyan-400/50 bg-cyan-900/20"
                                        : "border-white/20 hover:border-white/30"
                                    }`}
                                    value={otpInput[index] || ""}
                                    onChange={(e) => handleOtpChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onPaste={(e) => handlePaste(e, index)}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      delay: 0.1 * index,
                                      duration: 0.3,
                                    }}
                                    whileFocus={{ scale: 1.05 }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Status Messages */}
                            <div className="min-h-[20px] sm:min-h-[24px] mb-3 sm:mb-4">
                              {otpError ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  className="flex items-center justify-center text-red-400 text-xs sm:text-sm"
                                >
                                  <motion.div
                                    className="w-4 h-4 sm:w-5 sm:h-5 bg-red-400/20 rounded-full mr-2 sm:mr-3 flex items-center justify-center border border-red-400/30"
                                    animate={{
                                      scale: [1, 1.1, 1],
                                      borderColor: [
                                        "rgba(248, 113, 113, 0.3)",
                                        "rgba(248, 113, 113, 0.6)",
                                        "rgba(248, 113, 113, 0.3)",
                                      ],
                                    }}
                                    transition={{ duration: 1, repeat: 2 }}
                                  >
                                    <svg
                                      className="w-2 h-2 sm:w-3 sm:h-3 text-red-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </motion.div>
                                  <span className="font-medium">
                                    {otpError}
                                  </span>
                                </motion.div>
                              ) : otpVerifying ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  className="flex items-center justify-center text-cyan-400 text-xs sm:text-sm"
                                >
                                  <motion.div
                                    className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full mr-2"
                                    animate={{ rotate: 360 }}
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }}
                                  />
                                  <span className="font-medium">
                                    Verifying your code...
                                  </span>
                                </motion.div>
                              ) : otpInput.length > 0 ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  className="flex items-center justify-center text-gray-400 text-xs sm:text-sm"
                                >
                                  <motion.div
                                    className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-400/20 rounded-full mr-2 sm:mr-3 flex items-center justify-center border border-gray-400/30"
                                    animate={{
                                      scale: [1, 1.05, 1],
                                      opacity: [0.5, 0.8, 0.5],
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                    }}
                                  >
                                    <motion.div
                                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"
                                      animate={{
                                        scale: [0.8, 1.2, 0.8],
                                      }}
                                      transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                      }}
                                    />
                                  </motion.div>
                                  <span>
                                    {otpInput.length}/6 digits entered
                                  </span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex items-center justify-center text-gray-500 text-xs sm:text-sm"
                                >
                                  <span>Enter the 6-digit code</span>
                                </motion.div>
                              )}
                            </div>

                            {/* Resend OTP section */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 bg-gray-900/20 rounded-lg border border-white/5"
                            >
                              <div className="flex items-center justify-center sm:justify-start text-xs sm:text-sm text-gray-400">
                                <motion.div
                                  className="w-3 h-3 sm:w-4 sm:h-4 border border-gray-400/30 rounded-full mr-2 flex items-center justify-center"
                                  animate={{
                                    rotate: [0, 360],
                                    borderColor: [
                                      "rgba(107, 114, 128, 0.3)",
                                      "rgba(156, 163, 175, 0.3)",
                                      "rgba(107, 114, 128, 0.3)",
                                    ],
                                  }}
                                  transition={{ duration: 4, repeat: Infinity }}
                                >
                                  <svg
                                    className="w-2 h-2 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </motion.div>
                                <span>Didn't receive the code?</span>
                              </div>
                              <motion.button
                                type="button"
                                onClick={sendOTP}
                                disabled={cooldown > 0}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm !bg-transparent backdrop-blur-md border !border-white/10 rounded-lg text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium outline-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 whitespace-nowrap mx-auto sm:mx-0 ${
                                  cooldown === 0
                                    ? "hover:!bg-gray-800/30 hover:!border-gray-400/30"
                                    : ""
                                }`}
                                whileTap={{ scale: cooldown > 0 ? 1 : 0.98 }}
                              >
                                {cooldown > 0 ? (
                                  <span className="flex items-center">
                                    <motion.div
                                      className="w-3 h-3 border !border-gray-400/30 !border-t-gray-400 rounded-full mr-2"
                                      animate={{ rotate: 360 }}
                                      transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                    />
                                    {cooldown}s
                                  </span>
                                ) : (
                                  "Resend Code"
                                )}
                              </motion.button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {/* Message */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-2"
                      >
                        <label
                          htmlFor="message"
                          className="block text-white font-light text-lg"
                        >
                          Message <span className="text-red-400">*</span>
                        </label>
                        <motion.textarea
                          id="message"
                          className="w-full h-32 bg-gray-900/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm resize-none transition-all duration-200 outline-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 focus:bg-gray-900/40"
                          placeholder="Tell me about your inquiry"
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          required
                        />
                        {errors.message && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.message}
                          </p>
                        )}
                      </motion.div>

                      {/* Submit */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex justify-center pt-4"
                      >
                        <motion.button
                          type="submit"
                          disabled={isSubmitting}
                          className={`group relative px-12 py-4 !bg-transparent !border-white/10 !rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] outline-none focus:!border-blue-500/30 focus:!ring-2 focus:!ring-blue-500/10 ${
                            !isSubmitting
                              ? "hover:!border-gray-400/30 hover:!bg-gray-800/30"
                              : ""
                          }`}
                          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {isSubmitting ? (
                              <>
                                <motion.div
                                  className="w-5 h-5 border-2 border-white/30 border-t-white !rounded-full mr-3"
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                />
                                Sending...
                              </>
                            ) : (
                              "Send Message"
                            )}
                          </span>
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
