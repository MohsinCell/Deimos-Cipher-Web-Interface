import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Main landing page component
export default function LandingPage() {
  // Track mouse position for interactive background
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Track screen size for responsive effects
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  // Show scroll/touch indicator only at top
  const [isAtTop, setIsAtTop] = useState(true);
  const isMobile = screenSize.width < 1025;

  useEffect(() => {
    // Update screen size on resize
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Track mouse movement for background
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    // Check if user is at top of page
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

  // Animation variants for hero section
  const heroVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 20,
        duration: 1.2,
      } as any, // Fix for motion-dom type error
    },
  };

  // Animation for subtitle
  const subtitleVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.5,
        duration: 1,
        ease: [0.42, 0, 0.58, 1], // Use cubic-bezier array instead of string
      } as any, // Fix for motion-dom type error
    },
  };

  // Animation for features/applications grid
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      } as any, // Fix for motion-dom type error
    },
  };

  // Animation for each grid item
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
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8,
      } as any, // Fix for motion-dom type error
    },
  };

  // Star count based on screen size
  const getStarCount = () => {
    if (screenSize.width < 768) return 100;
    if (screenSize.width < 1024) return 150;
    return 200;
  };

  // Other effect counts based on screen size
  const getTwinkleCount = () => (screenSize.width < 768 ? 20 : 50);
  const getEnergyRingCount = () => (screenSize.width < 768 ? 3 : 5);
  const getEnergyOrbCount = () => (screenSize.width < 768 ? 4 : 8);
  const getSpiralCount = () => (screenSize.width < 768 ? 2 : 3);
  const getRippleCount = () => (screenSize.width < 768 ? 2 : 4);
  const getParticleCount = () => (screenSize.width < 768 ? 8 : 15);
  const getDustCount = () => (screenSize.width < 768 ? 15 : 30);

  // Wrapper for scroll/touch indicator
  const IndicatorWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isAtTop ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10"
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
      {/* Bouncing touch icon */}
      <motion.div
        className="flex flex-col items-center"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-2 border-gray-400 rounded-full flex items-center justify-center">
          <motion.div
            className="w-1 h-3 sm:h-4 md:h-5 bg-gray-400 rounded-full"
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
      {/* Message below icon */}
      <motion.p className="mt-3 sm:mt-4 md:mt-5 text-sm sm:text-base md:text-lg text-gray-400 font-medium text-center whitespace-nowrap px-4">
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
      {/* Bouncing mouse icon */}
      <motion.div
        className="w-5 h-8 sm:w-6 sm:h-10 md:w-7 md:h-12 border-2 border-gray-400 rounded-full flex justify-center"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className="w-1 h-2 sm:h-3 md:h-4 bg-gray-400 rounded-full mt-1.5 sm:mt-2"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      {/* Message below icon */}
      <motion.p className="mt-3 sm:mt-4 md:mt-5 text-sm sm:text-base md:text-lg text-gray-400 font-medium text-center whitespace-nowrap px-4">
        Scroll down
      </motion.p>
    </motion.div>
  );

  return (
    <>
      {/* Cosmic background */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ y: backgroundY }}
      >
        {/* Starfield */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-black">
          {/* Static stars */}
          {[...Array(getStarCount())].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute rounded-full animate-pulse"
              style={{
                width: screenSize.width < 768 ? "1px" : "1px",
                height: screenSize.width < 768 ? "1px" : "1px",
                backgroundColor: "white",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
          {/* Twinkling stars */}
          {[...Array(getTwinkleCount())].map((_, i) => (
            <motion.div
              key={`twinkle-${i}`}
              className="absolute bg-white rounded-full"
              style={{
                width: `${
                  Math.random() * (screenSize.width < 768 ? 2 : 3) + 1
                }px`,
                height: `${
                  Math.random() * (screenSize.width < 768 ? 2 : 3) + 1
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
        {/* Extra background effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Spotlight behind title */}
          <motion.div
            className="absolute"
            style={{
              width:
                screenSize.width < 768
                  ? "400px"
                  : screenSize.width < 1024
                  ? "600px"
                  : "800px",
              height:
                screenSize.width < 768
                  ? "400px"
                  : screenSize.width < 1024
                  ? "600px"
                  : "800px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, 
                rgba(100,200,255,0.03) 0%,
                rgba(150,100,255,0.02) 30%,
                rgba(255,255,255,0.015) 50%,
                rgba(100,200,255,0.008) 70%,
                transparent 100%)`,
              filter: "blur(20px)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Energy rings */}
          {[...Array(getEnergyRingCount())].map((_, i) => (
            <motion.div
              key={`energy-ring-${i}`}
              className="absolute"
              style={{
                width: `${
                  (screenSize.width < 768 ? 150 : 300) +
                  i * (screenSize.width < 768 ? 100 : 200)
                }px`,
                height: `${
                  (screenSize.width < 768 ? 150 : 300) +
                  i * (screenSize.width < 768 ? 100 : 200)
                }px`,
                left: "50%",
                top: "45%",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `1px solid rgba(100,200,255,${0.03 - i * 0.005})`,
                filter: "blur(2px)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 2,
              }}
            />
          ))}
          {/* Floating orbs */}
          {[...Array(getEnergyOrbCount())].map((_, i) => (
            <motion.div
              key={`energy-orb-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${
                  Math.random() * (screenSize.width < 768 ? 20 : 40) +
                  (screenSize.width < 768 ? 10 : 20)
                }px`,
                height: `${
                  Math.random() * (screenSize.width < 768 ? 20 : 40) +
                  (screenSize.width < 768 ? 10 : 20)
                }px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, 
                  rgba(100,200,255,0.1) 0%,
                  rgba(150,100,255,0.05) 50%,
                  transparent 100%)`,
                filter: "blur(8px)",
              }}
              animate={{
                x: [
                  0,
                  Math.random() * (screenSize.width < 768 ? 150 : 300) -
                    (screenSize.width < 768 ? 75 : 150),
                ],
                y: [
                  0,
                  Math.random() * (screenSize.width < 768 ? 150 : 300) -
                    (screenSize.width < 768 ? 75 : 150),
                ],
                scale: [0.5, 1.5, 0.5],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut",
              }}
            />
          ))}
          {/* Spiral streams */}
          {[...Array(getSpiralCount())].map((_, i) => (
            <motion.div
              key={`spiral-${i}`}
              className="absolute"
              style={{
                width: screenSize.width < 768 ? "300px" : "600px",
                height: screenSize.width < 768 ? "300px" : "600px",
                left: `${30 + i * 20}%`,
                top: `${20 + i * 25}%`,
                borderRadius: "50%",
                background: `conic-gradient(
                  transparent 0deg,
                  rgba(100,200,255,0.02) 90deg,
                  rgba(150,100,255,0.03) 180deg,
                  rgba(255,150,200,0.02) 270deg,
                  transparent 360deg
                )`,
                filter: "blur(15px)",
              }}
              animate={{
                rotate: [0, 360],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 25 + i * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
          {/* Wave ripples */}
          {[...Array(getRippleCount())].map((_, i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute"
              style={{
                width: `${
                  (screenSize.width < 768 ? 100 : 200) +
                  i * (screenSize.width < 768 ? 75 : 150)
                }px`,
                height: `${
                  (screenSize.width < 768 ? 100 : 200) +
                  i * (screenSize.width < 768 ? 75 : 150)
                }px`,
                left: `${20 + i * 15}%`,
                top: `${30 + i * 20}%`,
                borderRadius: "50%",
                border: `2px solid rgba(100,200,255,${0.04 - i * 0.008})`,
                filter: "blur(3px)",
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.08, 0, 0.08],
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "easeOut",
              }}
            />
          ))}
          {/* Particle streams */}
          {[...Array(getParticleCount())].map((_, i) => (
            <motion.div
              key={`particle-stream-${i}`}
              className="absolute"
              style={{
                width: screenSize.width < 768 ? "2px" : "3px",
                height: screenSize.width < 768 ? "2px" : "3px",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: "rgba(255,255,255,0.6)",
                borderRadius: "50%",
                filter: "blur(1px)",
              }}
              animate={{
                x: [
                  0,
                  Math.random() * (screenSize.width < 768 ? 100 : 200) -
                    (screenSize.width < 768 ? 50 : 100),
                ],
                y: [
                  0,
                  Math.random() * (screenSize.width < 768 ? 100 : 200) -
                    (screenSize.width < 768 ? 50 : 100),
                ],
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: Math.random() * 6 + 4,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeOut",
              }}
            />
          ))}
          {/* Nebula clouds, move with mouse */}
          <motion.div
            className="absolute rounded-full opacity-10 blur-3xl"
            style={{
              width:
                screenSize.width < 768
                  ? "500px"
                  : screenSize.width < 1024
                  ? "750px"
                  : "1000px",
              height:
                screenSize.width < 768
                  ? "300px"
                  : screenSize.width < 1024
                  ? "450px"
                  : "600px",
              background: `radial-gradient(ellipse, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 40%, transparent 70%)`,
              left: `${10 + mousePosition.x * 0.03}%`,
              top: `${5 + mousePosition.y * 0.03}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute rounded-full opacity-8 blur-3xl"
            style={{
              width:
                screenSize.width < 768
                  ? "400px"
                  : screenSize.width < 1024
                  ? "600px"
                  : "800px",
              height:
                screenSize.width < 768
                  ? "250px"
                  : screenSize.width < 1024
                  ? "375px"
                  : "500px",
              background: `radial-gradient(ellipse, rgba(147, 51, 234, 0.3) 0%, rgba(236, 72, 153, 0.2) 40%, transparent 70%)`,
              right: `${5 + mousePosition.x * 0.02}%`,
              bottom: `${10 + mousePosition.y * 0.02}%`,
            }}
            animate={{
              scale: [1.1, 1, 1.1],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 45,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* Floating dust */}
          {[...Array(getDustCount())].map((_, i) => (
            <motion.div
              key={`dust-${i}`}
              className="absolute bg-white rounded-full opacity-20"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 8,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear",
              }}
            />
          ))}
          {/* Shooting stars */}
          {[...Array(screenSize.width < 768 ? 1 : 2)].map((_, i) => (
            <motion.div
              key={`shooting-${i}`}
              className="absolute bg-gradient-to-r from-white via-blue-200 to-transparent"
              style={{
                width: screenSize.width < 768 ? "20px" : "30px",
                height: "1px",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
              }}
              animate={{
                x: [0, screenSize.width < 768 ? 200 : 400],
                y: [0, screenSize.width < 768 ? 100 : 200],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 12 + 8,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen w-full px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="text-center z-10 w-full max-w-7xl mx-auto"
        >
          <motion.h1
            className="font-extralight tracking-tight leading-none mb-6 xs:mb-5 sm:mb-4 md:mb-6 lg:mb-8 xl:mb-10 whitespace-nowrap"
            style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)" }}
          >
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Deimos{" "}
            </span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Cipher
            </span>
          </motion.h1>

          <motion.div
            variants={subtitleVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2"
          >
            <p
              className="text-gray-300 font-light leading-relaxed relative z-10
                          text-sm 
                          xs:text-base 
                          sm:text-lg 
                          md:text-xl 
                          lg:text-2xl 
                          xl:text-2xl"
            >
              A Next-Gen Hybrid Cipher for Extreme Security
            </p>

            <p
              className="text-gray-400 font-light italic mt-2 sm:mt-3 md:mt-4 lg:mt-5 block relative z-10
                          text-xs 
                          xs:text-sm 
                          sm:text-base 
                          md:text-lg 
                          lg:text-xl 
                          xl:text-xl"
            >
              Unleashing peak entropy, perfect diffusion, and ironclad key
              sensitivity
            </p>
          </motion.div>
        </motion.div>

        {/* Indicator shown only when at top */}
        <IndicatorWrapper>
          {isMobile ? <TouchIndicator /> : <MouseIndicator />}
        </IndicatorWrapper>
      </section>

      {/* Features Section */}
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
              Core Features
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto px-2">
              Advanced cryptographic technologies that make Deimos Cipher the
              most secure encryption solution available.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Hybrid Architecture
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Combines the strengths of both block and stream ciphers for
                  unmatched security.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Perfect Diffusion
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Avalanche effect achieves a significant bit change in small
                  plaintexts and ~50% in large files.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Extreme Key Sensitivity
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Even a one-bit change in the key alters the entire ciphertext
                  dramatically (~50.5%).
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  High Entropy Ciphertext
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Outperforms AES and ChaCha20 with 6.24 bits/byte entropy (vs
                  4.0 and 2.58).
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Optimized Speed
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Encrypts and decrypts 1MB files in under 0.3 seconds — built
                  for modern performance.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Post-Quantum Ready Design
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Architected with future resistance to quantum-based attacks in
                  mind.
                </p>
              </div>
            </motion.div>
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
              Applications
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto px-2">
              Deimos Cipher, with its high entropy, strong Avalanche Effect, and
              efficient encryption speed, is well-suited for various
              security-critical applications.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Secure Messaging Apps
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Protect conversations with high entropy and instant
                  encryption.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>High entropy protection</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Instant encryption</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Real-time security</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Military-Grade File Security
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Encrypt large data files with fast performance and perfect key
                  integrity.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Large file encryption</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Fast performance</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Perfect key integrity</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Blockchain & Cryptocurrency
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Strengthen blockchain systems with custom encryption for
                  secure token storage and transmission.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Custom encryption</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Secure token storage</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Blockchain integration</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Digital Forensics & Intelligence
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Protect confidential digital evidence and government records.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Evidence protection</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Government records</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Confidential data</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Cloud Storage Providers
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Offer high-speed encryption with unbeatable data protection
                  guarantees.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>High-speed encryption</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Data protection</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Cloud integration</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 h-full">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Multimedia Security
                </h4>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Secure images and videos using Deimos Cipher's binary-level
                  encryption system.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Image encryption</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Video protection</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white mr-3 flex-shrink-0" />
                    <span>Binary-level security</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
