import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Privacy Policy Page
const PrivacyPolicy = () => {
  // Track mouse position for background effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Scroll progress for parallax animation
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);

  // Track screen size for responsive effects
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Show scroll/touch indicator only at top
  const [isAtTop, setIsAtTop] = useState(true);

  // Detect mobile devices
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

  // Animation configs
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
      {/* Animated touch icon */}
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
      {/* Animated mouse icon */}
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
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden relative">
      {/* Cosmic background */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ y: backgroundY }}
      >
        {/* Starfield */}
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
              window.innerWidth >= 1024
                ? 50
                : window.innerWidth >= 768
                ? 35
                : 25
            ),
          ].map((_, i) => (
            <motion.div
              key={`twinkle-${i}`}
              className="absolute bg-white rounded-full"
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

        {/* Energy orbs */}
        {[
          ...Array(
            window.innerWidth >= 1024 ? 6 : window.innerWidth >= 768 ? 4 : 3
          ),
        ].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full opacity-20 blur-lg"
            style={{
              width: `${
                window.innerWidth >= 1024
                  ? 12
                  : window.innerWidth >= 768
                  ? 8
                  : 6
              }px`,
              height: `${
                window.innerWidth >= 1024
                  ? 12
                  : window.innerWidth >= 768
                  ? 8
                  : 6
              }px`,
              background: `radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(59, 130, 246, 0.6) 50%, transparent 100%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 3, 1],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Aurora flares */}
        {[
          ...Array(
            window.innerWidth >= 1024 ? 2 : window.innerWidth >= 768 ? 1 : 1
          ),
        ].map((_, i) => (
          <motion.div
            key={`aurora-${i}`}
            className="absolute opacity-10 blur-xl"
            style={{
              width: `${
                window.innerWidth >= 1024
                  ? 300
                  : window.innerWidth >= 768
                  ? 200
                  : 150
              }px`,
              height: `${
                window.innerWidth >= 1024
                  ? 60
                  : window.innerWidth >= 768
                  ? 40
                  : 30
              }vh`,
              background: `linear-gradient(135deg, rgba(147, 51, 234, 0.6) 0%, rgba(59, 130, 246, 0.4) 30%, rgba(236, 72, 153, 0.6) 60%, transparent 100%)`,
              left: `${Math.random() * 70}%`,
              top: `${Math.random() * 30}%`,
              transformOrigin: "bottom center",
              borderRadius: "50px",
            }}
            animate={{
              scaleX: [0.8, 1.2, 0.8],
              scaleY: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05],
              skewX: [0, 10, -10, 0],
            }}
            transition={{
              duration: Math.random() * 12 + 8,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Sparks */}
        {[
          ...Array(
            window.innerWidth >= 1024 ? 15 : window.innerWidth >= 768 ? 10 : 7
          ),
        ].map((_, i) => (
          <motion.div
            key={`spark-${i}`}
            className="absolute bg-white rounded-full opacity-40"
            style={{
              width: `${
                Math.random() * (window.innerWidth >= 768 ? 3 : 2) + 1
              }px`,
              height: `${
                Math.random() * (window.innerWidth >= 768 ? 3 : 2) + 1
              }px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 2, 0],
              opacity: [0, 0.8, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 3 + 1,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Nebula clouds */}
        <motion.div
          className="absolute rounded-full opacity-5 blur-3xl"
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
          className="absolute rounded-full opacity-4 blur-3xl"
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

        {/* Dust particles */}
        {[
          ...Array(
            window.innerWidth >= 1024 ? 100 : window.innerWidth >= 768 ? 75 : 50
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

      {/* Hero section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.h1
            className="text-7xl md:text-9xl font-extralight tracking-tight mb-8"
            style={{ y: textY }}
          >
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Privacy{" "}
            </span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Policy
            </span>
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto leading-relaxed px-2 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            Comprehensive data protection protocols ensuring absolute privacy
            through cryptographic excellence and zero-knowledge architecture
          </motion.p>
        </motion.div>
        {/* Show indicator at top */}
        <IndicatorWrapper>
          {isMobile ? <TouchIndicator /> : <MouseIndicator />}
        </IndicatorWrapper>
      </section>

      {/* Data Collection */}
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
              Data Collection & Processing
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Zero-knowledge architecture ensures that your cryptographic
              operations remain completely private and secure
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
                  Cryptographic Operations
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  All encryption and decryption operations are performed locally
                  on your device. Deimos Cipher processes your data exclusively
                  in local memory without transmitting plaintext, keys, or
                  cryptographic materials to external servers. Your sensitive
                  information never leaves your secure environment.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Website Analytics
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  We collect minimal, anonymized usage statistics to improve
                  Deimos Cipher's performance and user experience. This includes
                  basic metrics such as page views, session duration, and
                  feature utilization patterns. No personally identifiable
                  information or cryptographic data is included in these
                  analytics.
                </p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  Local Storage Only
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  User preferences and application settings are stored
                  exclusively in your browser's local storage. This data remains
                  on your device and is never synchronized or transmitted to
                  external services. You maintain complete control over this
                  information and can clear it at any time.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-4">
                  No Third-Party Tracking
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Deimos Cipher does not integrate third-party tracking scripts,
                  advertising networks, or external analytics services that
                  compromise user privacy. Our commitment to cryptographic
                  excellence extends to maintaining the highest standards of
                  data protection and user anonymity.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Security Measures */}
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
              Security Architecture
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Multi-layered security protocols protecting your data through
              advanced cryptographic mechanisms
            </p>
          </motion.div>
          <motion.div
            className="space-y-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Client-Side Encryption */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex flex-col lg:flex-row items-start gap-12">
                <div className="lg:w-1/3">
                  <div className="sticky top-24">
                    <h4 className="text-3xl font-medium text-white mb-4">
                      Client-Side Encryption
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-white to-gray-400 rounded mb-6"></div>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    All cryptographic operations are executed within your
                    browser environment using Deimos Cipher's advanced
                    encryption algorithms. This client-side architecture ensures
                    that plaintext data never traverses network connections or
                    external systems, maintaining absolute data confidentiality.
                  </p>
                  <div className="p-8 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                    <h5 className="text-xl font-medium text-white mb-4">
                      Security Benefits
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-300">
                        <svg
                          className="w-5 h-5 mr-3 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Zero server-side exposure
                      </div>
                      <div className="flex items-center text-gray-300">
                        <svg
                          className="w-5 h-5 mr-3 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Complete user control
                      </div>
                      <div className="flex items-center text-gray-300">
                        <svg
                          className="w-5 h-5 mr-3 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Network isolation
                      </div>
                      <div className="flex items-center text-gray-300">
                        <svg
                          className="w-5 h-5 mr-3 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Memory-only processing
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Data Transmission */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex flex-col lg:flex-row items-start gap-12">
                <div className="lg:w-1/3">
                  <div className="sticky top-24">
                    <h4 className="text-3xl font-medium text-white mb-4">
                      Secure Transmission Protocols
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-white to-gray-400 rounded mb-6"></div>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    All network communications utilize TLS 1.3 encryption with
                    perfect forward secrecy and certificate pinning. Web
                    application resources are served over HTTPS with strict
                    transport security headers, content security policies, and
                    integrity verification mechanisms to prevent tampering or
                    interception.
                  </p>
                  <div className="p-8 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                    <h5 className="text-xl font-medium text-white mb-4">
                      Transport Security
                    </h5>
                    <div className="font-mono text-sm text-white bg-black/40 p-4 rounded-lg">
                      TLS 1.3 + HSTS + CSP + Certificate Pinning
                    </div>
                    <p className="text-gray-400 mt-4 text-sm">
                      Military-grade transport encryption ensures application
                      integrity during delivery
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Memory Management */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex flex-col lg:flex-row items-start gap-12">
                <div className="lg:w-1/3">
                  <div className="sticky top-24">
                    <h4 className="text-3xl font-medium text-white mb-4">
                      Secure Memory Management
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-white to-gray-400 rounded mb-6"></div>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Deimos Cipher implements secure memory management practices
                    including explicit key material clearing, ephemeral
                    cryptographic states, and garbage collection optimization.
                    Sensitive data structures are zeroed immediately after use
                    to prevent memory-based attacks and forensic recovery.
                  </p>
                  <div className="p-8 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10">
                    <h5 className="text-xl font-medium text-white mb-4">
                      Memory Protection
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-300">
                        <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                        Automatic key material destruction
                      </div>
                      <div className="flex items-center text-gray-300">
                        <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                        Ephemeral cryptographic contexts
                      </div>
                      <div className="flex items-center text-gray-300">
                        <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                        Memory forensics resistance
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* User Rights */}
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
              User Rights & Control
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Complete sovereignty over your cryptographic data with
              comprehensive privacy controls
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
                Data Visibility
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Complete transparency regarding data processing. All
                cryptographic operations are performed locally with full source
                code availability, ensuring you understand exactly how your
                information is handled.
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Data Deletion
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Immediate and complete data erasure capabilities. Clear browser
                storage, delete encrypted files, and remove all traces of your
                cryptographic operations with a single action.
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Access Control
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Comprehensive control over your cryptographic environment.
                Manage encryption keys, configure security settings, and
                customize privacy preferences according to your specific
                requirements.
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Data Portability
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Export your encrypted data and configurations at any time. All
                cryptographic outputs and user preferences can be saved,
                transferred, or backed up in standard formats.
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Opt-Out Rights
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Disable analytics, tracking, or any data collection features.
                Use Deimos Cipher in completely offline mode with zero external
                communications or telemetry.
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h4 className="text-xl font-medium text-white mb-4">
                Information Rights
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Request detailed information about data processing activities.
                Access comprehensive documentation about cryptographic
                algorithms, security measures, and privacy implementations.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact & Legal */}
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
              Contact & Commitment
            </h3>
            <p className="text-xl text-gray-400 sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-w-3xl mx-auto">
              Dedicated to transparent communication, responsible data
              practices, and meaningful connection.
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
                  Contact Information
                </h4>
                <div className="space-y-6">
                  <div>
                    <h5 className="text-white font-medium text-base mb-4">
                      Get in Touch
                    </h5>
                    <a
                      href="mailto:deimoscipher@gmail.com"
                      className="text-gray-300 hover:text-white transition-colors text-sm mb-1 block"
                    >
                      deimoscipher@gmail.com
                    </a>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      For all inquiries including privacy, security, legal
                      matters, and general support
                    </p>
                  </div>
                  <div>
                    <h5 className="text-white font-medium text-base mb-2">
                      Connect & Follow
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm w-16">
                          GitHub:
                        </span>
                        <a
                          href="https://github.com/MohsinCell"
                          className="text-white hover:text-gray-300 transition-colors text-sm"
                        >
                          MohsinCell
                        </a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm w-16">
                          LinkedIn:
                        </span>
                        <a
                          href="https://www.linkedin.com/in/mohsin-belam-b82abb279/"
                          className="text-white hover:text-gray-300 transition-colors text-sm"
                        >
                          Mohsin Belam
                        </a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm w-16">
                          Twitter:
                        </span>
                        <a
                          href="https://x.com/MohsinBelam"
                          className="text-white hover:text-gray-300 transition-colors text-sm"
                        >
                          @MohsinBelam
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      A solo developer passionate about creating innovative
                      tools. Open to collaboration, feedback, and connecting
                      with fellow developers.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="p-8 rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10">
                <h4 className="text-2xl font-medium text-white mb-6">
                  Response Commitment
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-sm font-medium">
                        24h
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Initial Response</p>
                      <p className="text-gray-400 text-sm">
                        Acknowledgment of privacy inquiries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-sm font-medium">7d</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Data Requests</p>
                      <p className="text-gray-400 text-sm">
                        Processing of access and deletion requests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-sm font-medium">1h</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Security Issues</p>
                      <p className="text-gray-400 text-sm">
                        Critical security vulnerability reports
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/10 mt-6">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Every inquiry is treated with urgency, professionalism, and
                    respect. I’m committed to clear communication, strong data
                    integrity, and timely resolution of concerns. Whether it’s a
                    privacy question, legal matter, or security issue, the goal
                    is to ensure a reliable, trustworthy experience across all
                    platforms and interactions.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
