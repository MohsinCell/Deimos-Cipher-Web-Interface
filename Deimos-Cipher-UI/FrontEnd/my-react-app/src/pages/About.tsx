// React and Framer Motion imports
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Main About page component
const About = () => {
  // Mouse position state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Scroll progress for background and text animations
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);
  const beamRotation = useTransform(scrollYProgress, [0, 1], [90, 450]);

  // Screen size state
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Track if user is at the top of the page
  const [isAtTop, setIsAtTop] = useState(true);

  // Mobile detection
  const isMobile = screenSize.width < 1025;

  useEffect(() => {
    // Update screen size on resize
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    // Check if at top of page
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 10);
    };

    updateScreenSize();
    handleScroll();

    window.addEventListener("resize", updateScreenSize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", updateScreenSize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Animation variants for sections
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        duration: 0.8,
      },
    },
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

  // Wrapper for scroll/touch indicator
  const IndicatorWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isAtTop ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
    >
      {children}
    </motion.div>
  );

  // Touch indicator for mobile
  const TouchIndicator = () => (
    <motion.div
      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      <motion.div
        className="flex flex-col items-center"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-10 h-10 border-2 border-gray-400 rounded-full flex items-center justify-center">
          <motion.div
            className="w-1 h-4 bg-gray-400 rounded-full"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <motion.div
          className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-gray-400 mt-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <motion.p className="mt-5 text-lg text-gray-400 font-medium text-center whitespace-nowrap">
        Swipe up
      </motion.p>
    </motion.div>
  );

  // Mouse indicator for desktop
  const MouseIndicator = () => (
    <motion.div
      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      <motion.div
        className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className="w-1 h-3 bg-gray-400 rounded-full mt-2"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <motion.p className="mt-5 text-lg text-gray-400 font-medium text-center whitespace-nowrap">
        Scroll down
      </motion.p>
    </motion.div>
  );

  return (
    <>
      {/* Enhanced Cosmic Background */}
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

        {/* Wide cosmic beams */}
        <motion.div
          className="absolute inset-0"
          style={{ rotate: beamRotation }}
        >
          {/* Secondary beams */}
          <div className="absolute top-0 left-1/4 transform -translate-x-1/2 w-0.5 sm:w-1 h-full bg-gradient-to-b from-transparent via-purple-500/15 to-transparent blur-sm rotate-12" />
          <div className="absolute top-0 right-1/4 transform translate-x-1/2 w-0.5 sm:w-1 h-full bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent blur-sm -rotate-12" />

          {/* Wide spreading beams */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 sm:w-64 md:w-80 lg:w-96 h-full bg-gradient-to-b from-transparent via-blue-500/5 to-transparent blur-3xl" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 sm:w-48 md:w-56 lg:w-64 h-full bg-gradient-to-b from-transparent via-purple-500/8 to-transparent blur-2xl rotate-45" />
        </motion.div>

        {/* Nebula-like clouds */}
        <motion.div
          className="absolute rounded-full opacity-5 blur-3xl"
          style={{
            width: `${
              window.innerWidth < 768
                ? 600
                : window.innerWidth < 1024
                ? 900
                : 1200
            }px`,
            height: `${
              window.innerWidth < 768
                ? 400
                : window.innerWidth < 1024
                ? 600
                : 800
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
          className="absolute rounded-full opacity-4 blur-3xl"
          style={{
            width: `${
              window.innerWidth < 768
                ? 400
                : window.innerWidth < 1024
                ? 600
                : 800
            }px`,
            height: `${
              window.innerWidth < 768
                ? 300
                : window.innerWidth < 1024
                ? 450
                : 600
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
              y: [0, -200, 0],
              x: [0, Math.random() * 100 - 50, 0],
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
            className="absolute w-1 sm:w-2 h-px bg-gradient-to-r from-white to-transparent"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
            }}
            animate={{
              x: [0, window.innerWidth < 768 ? 200 : 300],
              y: [0, window.innerWidth < 768 ? 100 : 150],
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

        {/* Cosmic rings */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-blue-500/10 rounded-full"
          style={{
            width: `${
              window.innerWidth < 768
                ? 288
                : window.innerWidth < 1024
                ? 384
                : 448
            }px`,
            height: `${
              window.innerWidth < 768
                ? 288
                : window.innerWidth < 1024
                ? 384
                : 448
            }px`,
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-purple-500/10 rounded-full"
          style={{
            width: `${
              window.innerWidth < 768
                ? 240
                : window.innerWidth < 1024
                ? 320
                : 384
            }px`,
            height: `${
              window.innerWidth < 768
                ? 240
                : window.innerWidth < 1024
                ? 320
                : 384
            }px`,
          }}
          animate={{
            rotate: [360, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen w-full px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.h1
            className="font-extralight tracking-tight mb-2"
            style={{ fontSize: "clamp(1.25rem, 8vw, 3.25rem)", y: textY }}
          >
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              About
            </span>
          </motion.h1>

          <motion.h2
            className="text-4xl md:text-6xl font-light tracking-tight mb-3 sm:mb-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Deimos Cipher
            </span>
          </motion.h2>

          {/* Animated Horizontal Beam */}
          <div className="relative w-full max-w-4xl mx-auto mb-3 sm:mb-4 flex justify-center">
            <div className="relative w-full h-8 flex items-center justify-center">
              {/* Main horizontal beam */}
              <motion.div
                className="relative w-full h-0.75 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 1.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{ transformOrigin: "center" }}
              >
                {/* Animated light sweep */}
                <motion.div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 h-0.75"
                  style={{
                    background:
                      "linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.15) 48%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.15) 52%, transparent 100%)",
                    transformOrigin: "center",
                  }}
                  initial={{ width: "0%", opacity: 0 }}
                  animate={{
                    width: ["0%", "100%"],
                    opacity: [0, 0.3],
                  }}
                  transition={{
                    delay: 1.8,
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Central orb */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full z-10"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 70%, transparent 100%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.8, 0.6],
                  scale: [0, 1.5, 1],
                }}
                transition={{
                  delay: 0.3,
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1],
                  times: [0, 0.6, 1],
                }}
              />

              {/* Central glow */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-5"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.4, 0.2],
                  scale: [0, 1.2, 0.8],
                }}
                transition={{
                  delay: 0.3,
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1],
                  times: [0, 0.6, 1],
                }}
              />

              {/* Lens flares */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-transparent via-white/2 to-transparent blur-sm"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  delay: 1.8, // After beam completes
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-white/2 to-transparent blur-sm"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                  delay: 1.8, // After beam completes
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>

          <motion.p
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto leading-relaxed px-2 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            A revolutionary encryption algorithm engineered for unparalleled
            security, entropy optimization, and computational efficiency. Built
            on cutting-edge cryptographic principles to deliver absolute data
            protection
          </motion.p>
        </motion.div>

        {/* Indicator shown only when at top */}
        <IndicatorWrapper>
          {isMobile ? <TouchIndicator /> : <MouseIndicator />}
        </IndicatorWrapper>
      </section>

      {/* Design Philosophy Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl pb-[10px] font-light mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Design Philosophy
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Addressing the fundamental limitations of existing cryptographic
              systems through innovative multi-layered architecture
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  The Entropy Challenge
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Traditional encryption algorithms like AES and ChaCha20
                  exhibit suboptimal entropy characteristics when processing
                  short plaintexts. Our research revealed that AES achieves only
                  4.00000 bits/byte for short texts, while ChaCha20 drops to
                  2.58496 bits/byte. This entropy deficit creates potential
                  vulnerabilities to statistical attacks and frequency analysis.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Cryptanalytic Resistance
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Deimos Cipher's multi-layered architecture provides robust
                  defense against differential cryptanalysis, linear
                  cryptanalysis, and brute-force attacks. The integration of
                  XChaCha20's stream encryption with BLAKE2b-based key
                  derivation creates a cryptographic fortress that maintains
                  security even under sophisticated attack vectors.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Breakthrough Innovation
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Deimos Cipher achieves an unprecedented 6.24066 bits/byte
                  entropy for short plaintexts – a revolutionary improvement
                  that closes the security gap where traditional ciphers are
                  most vulnerable. This breakthrough ensures consistent
                  cryptographic strength regardless of message length.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Perfect Diffusion
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Our avalanche effect analysis demonstrates superior diffusion
                  with 50.18% bit change ratio, approaching theoretical
                  perfection. This ensures that even microscopic changes in
                  plaintext or key result in completely unpredictable ciphertext
                  transformations, making cryptanalytic pattern recognition
                  impossible.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Technical Architecture Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl pb-[10px] font-light mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Cryptographic Architecture
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xll mx-auto">
              A sophisticated multi-component system engineered for maximum
              security and performance efficiency
            </p>
          </motion.div>

          <motion.div
            className="space-y-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Key Derivation */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex flex-col lg:flex-row items-start gap-12">
                <div className="lg:w-1/3">
                  <div className="sticky top-24">
                    <h4 className="text-3xl font-medium text-white mb-4">
                      HKDF-BLAKE2b Key Expansion
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-white to-gray-400 rounded mb-6"></div>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Deimos Cipher employs the HMAC-based Key Derivation Function
                    (HKDF) with BLAKE2b-512 cryptographic hash function to
                    transform user passwords into cryptographically secure keys.
                    This process generates three distinct 256-bit keys from a
                    single master password, each serving specialized
                    cryptographic functions.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                      <h5 className="text-lg font-medium text-white mb-2">
                        K₁ - Encryption Key
                      </h5>
                      <p className="text-gray-400 text-sm">
                        Primary key for XChaCha20 stream encryption operations
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                      <h5 className="text-lg font-medium text-white mb-2">
                        K₂ - Reserved Key
                      </h5>
                      <p className="text-gray-400 text-sm">
                        Reserved for future security enhancements and extensions
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                      <h5 className="text-lg font-medium text-white mb-2">
                        K₃ - Authentication Key
                      </h5>
                      <p className="text-gray-400 text-sm">
                        Dedicated key for HMAC-SHA256 integrity verification
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Encryption Process */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex flex-col lg:flex-row items-start gap-12">
                <div className="lg:w-1/3">
                  <div className="sticky top-24">
                    <h4 className="text-3xl font-medium text-white mb-4">
                      XChaCha20 Stream Encryption
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-white to-gray-400 rounded mb-6"></div>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    The core encryption mechanism utilizes XChaCha20, an
                    extended variant of the ChaCha20 stream cipher with enhanced
                    nonce-misuse resistance. The 192-bit extended nonce provides
                    superior security margins compared to traditional 96-bit
                    implementations, virtually eliminating nonce collision
                    vulnerabilities.
                  </p>
                  <div className="p-8 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                    <h5 className="text-xl font-medium text-white mb-4">
                      Encryption Formula
                    </h5>
                    <div className="font-mono text-lg text-white bg-black/40 p-4 rounded-lg">
                      C = P ⊕ XChaCha20(K₁, nonce)
                    </div>
                    <p className="text-gray-400 mt-4 text-sm">
                      Where C is ciphertext, P is plaintext, and ⊕ represents
                      XOR operation with the XChaCha20 keystream
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Authentication */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex flex-col lg:flex-row items-start gap-12">
                <div className="lg:w-1/3">
                  <div className="sticky top-24">
                    <h4 className="text-3xl font-medium text-white mb-4">
                      HMAC-SHA256 Authentication
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-white to-gray-400 rounded mb-6"></div>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Cryptographic integrity is ensured through HMAC-SHA256
                    authentication tags, computed using the dedicated K₃ key.
                    This mechanism provides robust tamper detection and prevents
                    unauthorized modifications to encrypted data. The
                    authentication-first decryption process aborts immediately
                    upon integrity verification failure.
                  </p>
                  <div className="p-8 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                    <h5 className="text-xl font-medium text-white mb-4">
                      Ciphertext Structure
                    </h5>
                    <div className="font-mono text-sm text-white bg-black/40 p-4 rounded-lg">
                      [32-byte Salt] + [24-byte Nonce] + [Encrypted Data] +
                      [32-byte HMAC]
                    </div>
                    <p className="text-gray-400 mt-4 text-sm">
                      Total overhead: 88 bytes per encrypted message, ensuring
                      predictable ciphertext expansion
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Security Analysis Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl pb-[10px] font-light mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Security Analysis
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Comprehensive cryptanalytic testing validates Deimos Cipher's
              resistance to modern attack vectors
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-6">
                  Entropy Superiority
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">AES (Short Text)</span>
                    <span className="text-white font-mono">
                      4.00000 bits/byte
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ChaCha20 (Short Text)</span>
                    <span className="text-white font-mono">
                      2.58496 bits/byte
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/30 pt-4">
                    <span className="text-white font-medium">
                      Deimos Cipher (Short Text)
                    </span>
                    <span className="text-white font-mono font-bold">
                      6.24066 bits/byte
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-6 text-sm">
                  Deimos Cipher achieves 56% higher entropy than AES and 142%
                  higher than ChaCha20 for short plaintexts, closing critical
                  security vulnerabilities in constrained data environments.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-6">
                  Key Sensitivity Analysis
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">AES</span>
                    <span className="text-white font-mono">50.12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ChaCha20</span>
                    <span className="text-white font-mono">49.97%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/30 pt-4">
                    <span className="text-white font-medium">
                      Deimos Cipher
                    </span>
                    <span className="text-white font-mono font-bold">
                      50.54%
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-6 text-sm">
                  Single-bit key modifications result in over 50% ciphertext
                  alteration, ensuring maximum resistance to key-related
                  cryptanalytic attacks and differential analysis techniques.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-6">
                  Attack Resistance Profile
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">
                      Brute Force Resistance
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">
                      2²⁵⁶ keyspace
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">
                      Differential Cryptanalysis
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">
                      Resistant
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Linear Cryptanalysis</span>
                    <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">
                      Resistant
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Side-Channel Attacks</span>
                    <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">
                      Mitigated
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Timing Attacks</span>
                    <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">
                      Resistant
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-6 text-sm">
                  Multi-layered cryptographic architecture provides
                  comprehensive protection against contemporary and emerging
                  attack methodologies, ensuring long-term security resilience.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-6">
                  Avalanche Effect Analysis
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">AES</span>
                    <span className="text-white font-mono">49.85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ChaCha20</span>
                    <span className="text-white font-mono">49.92%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/30 pt-4">
                    <span className="text-white font-medium">
                      Deimos Cipher
                    </span>
                    <span className="text-white font-mono font-bold">
                      50.18%
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-6 text-sm">
                  Approaching theoretical perfection in diffusion properties,
                  single-bit plaintext changes cascade through the entire
                  ciphertext with optimal unpredictability.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Performance Metrics Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl pb-[10px] font-light mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Performance Analysis
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Benchmarking demonstrates competitive efficiency while maintaining
              superior security characteristics
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-6">
                  Encryption Performance (1MB File)
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">AES-256 (CBC)</span>
                    <span className="text-white font-mono">0.125214s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ChaCha20</span>
                    <span className="text-white font-mono">0.098574s</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/30 pt-4">
                    <span className="text-white font-medium">
                      Deimos Cipher
                    </span>
                    <span className="text-white font-mono font-bold">
                      0.230857s
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-6 text-sm">
                  While slightly slower due to enhanced security layers, Deimos
                  Cipher maintains practical performance for security-critical
                  applications requiring maximum cryptographic strength.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-6">
                  Decryption Performance (1MB File)
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">AES-256 (CBC)</span>
                    <span className="text-white font-mono">0.132789s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ChaCha20</span>
                    <span className="text-white font-mono">0.105823s</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/30 pt-4">
                    <span className="text-white font-medium">
                      Deimos Cipher
                    </span>
                    <span className="text-white font-mono font-bold">
                      0.256726s
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-6 text-sm">
                  The authentication-first decryption process ensures integrity
                  verification before data processing, providing additional
                  security at minimal performance cost.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
              <h4 className="text-2xl font-medium text-white mb-6">
                Ciphertext Length Consistency
              </h4>
              <p className="text-gray-300 mb-6">
                Deimos Cipher maintains predictable ciphertext expansion
                following the formula:{" "}
                <span className="font-mono text-white">C = P + 88 bytes</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-black/20 rounded-xl">
                  <div className="text-lg font-mono text-white">16B</div>
                  <div className="text-sm text-gray-400">→ 104B</div>
                </div>
                <div className="text-center p-4 bg-black/20 rounded-xl">
                  <div className="text-lg font-mono text-white">64B</div>
                  <div className="text-sm text-gray-400">→ 152B</div>
                </div>
                <div className="text-center p-4 bg-black/20 rounded-xl">
                  <div className="text-lg font-mono text-white">128B</div>
                  <div className="text-sm text-gray-400">→ 216B</div>
                </div>
                <div className="text-center p-4 bg-black/20 rounded-xl">
                  <div className="text-lg font-mono text-white">1KB</div>
                  <div className="text-sm text-gray-400">→ 1.1KB</div>
                </div>
                <div className="text-center p-4 bg-black/20 rounded-xl">
                  <div className="text-lg font-mono text-white">1MB</div>
                  <div className="text-sm text-gray-400">→ 1MB+88B</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Applications Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl pb-[10px] font-light mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Real-World Applications
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Deimos Cipher's advanced security properties enable deployment
              across diverse high-security environments
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Secure Messaging
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                End-to-end encrypted messaging applications leveraging Deimos
                Cipher's superior entropy characteristics for unbreakable
                communication security, especially critical for short message
                encryption where traditional ciphers exhibit vulnerabilities.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Cloud Storage Encryption
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Protecting sensitive files in cloud environments with Deimos
                Cipher's robust diffusion properties ensuring that even minor
                file modifications result in completely different encrypted
                representations, preventing unauthorized access and tampering
                detection.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                IoT & Embedded Systems
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Securing communication between IoT devices with efficient
                encryption while maintaining strong cryptographic properties.
                Deimos Cipher's balanced performance profile makes it suitable
                for resource-constrained environments requiring robust security.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Blockchain & DeFi
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Integration into blockchain protocols and decentralized finance
                applications for securing smart contract communications,
                transaction encryption, and cryptographic wallet implementations
                with enhanced entropy characteristics for maximum security.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Enterprise Security
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Deployment in high-security enterprise environments requiring
                maximum data protection with formal cryptanalytic validation.
                Suitable for government, defense, and financial institutions
                where traditional encryption standards may be insufficient.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Quantum-Resistant Research
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Foundation for post-quantum cryptographic research and
                development. While currently a classical symmetric cipher,
                Deimos Cipher's architecture provides a platform for exploring
                quantum-resistant enhancements and hybrid cryptographic systems.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Future Research Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl pb-[10px] font-light mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Future Research Directions
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Expanding Deimos Cipher's capabilities through advanced
              cryptographic research and optimization
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Formal Cryptanalysis
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Conducting comprehensive mathematical cryptanalysis including
                  provable security bounds, formal verification of security
                  properties, and resistance analysis against advanced
                  cryptanalytic techniques.
                </p>
                <div className="flex items-center text-gray-400">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  Mathematical proof development
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Hardware Optimization
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Implementation on specialized hardware platforms including
                  FPGA and ASIC designs for enhanced performance in
                  high-throughput cryptographic applications and embedded
                  systems.
                </p>
                <div className="flex items-center text-gray-400">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  FPGA/ASIC implementation
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Post-Quantum Security
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Investigating modifications and enhancements to achieve
                  quantum resistance, including integration with post-quantum
                  key exchange mechanisms and lattice-based cryptographic
                  primitives.
                </p>
                <div className="flex items-center text-gray-400">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  Quantum-resistant adaptations
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Real-World Deployment
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Large-scale implementation and testing in production
                  environments to validate practical security and performance
                  characteristics across diverse application domains.
                </p>
                <div className="flex items-center text-gray-400">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  Production testing & validation
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-5xl md:text-6xl pb-[10px] font-light mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Advancing Cryptographic Science
            </h3>
            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              Deimos Cipher represents a significant advancement in symmetric
              encryption technology, addressing critical vulnerabilities in
              existing standards while maintaining practical efficiency. Through
              rigorous cryptanalytic validation and comprehensive security
              analysis, it demonstrates superior entropy characteristics,
              optimal diffusion properties, and robust resistance to modern
              attack vectors.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="https://github.com/MohsinCell/Deimos-Cipher"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-transparent border-2 border-gray-600 hover:border-gray-400 hover:bg-gray-800/30 rounded-full text-white font-medium flex items-center justify-center transition-all duration-300"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View Source Code
              </a>

              <a
                href="https://www.opastpublishers.com/open-access-articles/deimos-cipher-a-highentropy-secure-encryption-algorithm-with-strong-diffusion-and-key-sensitivity.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-transparent border-2 border-gray-600 hover:border-gray-400 hover:bg-gray-800/30 rounded-full text-white font-medium flex items-center justify-center transition-all duration-300"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  ></path>
                </svg>
                View Research Paper
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default About;
