import { NavLink, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  easeInOut,
} from "framer-motion";

// Simple type for nav refs
interface NavRefs {
  [key: string]: HTMLElement | null;
}

const Navbar = () => {
  const location = useLocation();
  const [activeUnderline, setActiveUnderline] = useState({ left: 0, width: 0 });
  const [hoverUnderline, setHoverUnderline] = useState({
    left: 0,
    width: 0,
    isVisible: false,
  });
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<NavRefs>({});

  // Track scroll position for nav style
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 50], [0.95, 1]);
  const navBlur = useTransform(scrollY, [0, 50], [8, 16]);

  // Check if desktop (hover support + width)
  useEffect(() => {
    const checkIsDesktop = () => {
      const hasHover = window.matchMedia("(hover: hover)").matches;
      const hasWidth = window.innerWidth >= 768;
      setIsDesktop(hasHover && hasWidth);
    };
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  // Change nav style on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Update underline when route or device changes
  useEffect(() => {
    const timer = setTimeout(updateActiveUnderline, 50);
    return () => clearTimeout(timer);
  }, [location.pathname, isDesktop]);

  // Set underline position for active nav item
  const updateActiveUnderline = () => {
    if (window.innerWidth < 768) return;
    const navItems = ["Home", "About", "Encrypt", "Decrypt", "Contact"];
    const currentPath = location.pathname;
    for (const item of navItems) {
      const path = item === "Home" ? "/" : `/${item.toLowerCase()}`;
      if (currentPath === path && navRefs.current[item]) {
        const element = navRefs.current[item];
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (navContainerRef.current) {
          const containerRect = navContainerRef.current.getBoundingClientRect();
          const originalWidth = rect.width;
          const newWidth = originalWidth * 0.9;
          const widthDiff = originalWidth - newWidth;
          setActiveUnderline({
            left: rect.left - containerRect.left + widthDiff / 2,
            width: newWidth,
          });
          if (!hoverUnderline.isVisible && isDesktop) {
            setHoverUnderline({
              left: rect.left - containerRect.left + widthDiff / 2,
              width: newWidth,
              isVisible: false,
            });
          }
        }
        break;
      }
    }
  };

  // Show hover underline on nav item
  const handleMouseEnter = (item: string) => {
    if (!isDesktop) return;
    const element = navRefs.current[item];
    if (element && navContainerRef.current) {
      const rect = element.getBoundingClientRect();
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const originalWidth = rect.width;
      const newWidth = originalWidth * 0.9;
      const widthDiff = originalWidth - newWidth;
      setHoverUnderline({
        left: rect.left - containerRect.left + widthDiff / 2,
        width: newWidth,
        isVisible: true,
      });
    }
  };

  // Hide hover underline
  const handleMouseLeave = () => {
    if (!isDesktop) return;
    setHoverUnderline((prev) => ({ ...prev, isVisible: false }));
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Animation configs
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 25,
        mass: 1,
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: -30, opacity: 0, scale: 0.8 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20,
        mass: 0.8,
      },
    },
  };

  const brandVariants = {
    hidden: { opacity: 0, x: -50, scale: 0.3 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 150,
        damping: 20,
        delay: 0.1,
      },
    },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.9,
      transition: {
        duration: 0.2,
        ease: easeInOut,
      },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 25,
      },
    },
  };

  const hamburgerVariants = {
    closed: { rotate: 0 },
    open: {
      rotate: 180,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
  };

  const lineVariants = {
    closed: { rotate: 0, y: 0, opacity: 1 },
    open: (custom: number) => ({
      rotate: custom === 1 ? 45 : custom === 3 ? -45 : 0,
      y: custom === 1 ? 8 : custom === 3 ? -8 : 0,
      opacity: custom === 2 ? 0 : 1,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    }),
  };

  return (
    <>
      <motion.nav
        className={`fixed w-full top-0 z-50 transition-all duration-700 ease-out ${
          scrolled
            ? "bg-black/50 backdrop-blur-xl shadow-2xl shadow-black/25"
            : "bg-transparent"
        }`}
        variants={navVariants}
        initial="hidden"
        animate="visible"
        style={{
          backdropFilter: `blur(${navBlur}px)`,
          opacity: navOpacity,
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-6 flex justify-between items-center w-full">
          {/* Logo on the left */}
          <motion.div
            className="relative z-10 flex items-center w-48 sm:w-56 md:w-64 lg:w-72"
            variants={brandVariants}
          >
            <NavLink to="/" className="flex items-center">
              {/* Desktop/tablet: icon + text */}
              <div className="hidden sm:flex items-center">
                <img
                  src="/logo-short.svg"
                  alt="Deimos Cipher Icon"
                  className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0"
                />
                <img
                  src="/logo-long.svg"
                  alt="Deimos Cipher"
                  className="h-10 mt-1 md:h-14 lg:h-16 w-auto ml-2 md:ml-3 flex-shrink-0"
                />
              </div>
              {/* Mobile: icon only */}
              <img
                src="/logo-short.svg"
                alt="Deimos Cipher"
                className="block sm:hidden h-8 w-8 flex-shrink-0"
              />
            </NavLink>
          </motion.div>

          {/* Desktop nav links */}
          <motion.div
            ref={navContainerRef}
            className="hidden md:flex space-x-1 lg:space-x-2 relative"
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 120,
              damping: 20,
            }}
          >
            {/* Underline for active page */}
            <motion.div
              className="absolute -bottom-2 h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full"
              animate={{
                left: activeUnderline.left,
                width: activeUnderline.width,
                opacity: hoverUnderline.isVisible && isDesktop ? 0 : 1,
              }}
              transition={{
                left: {
                  type: "spring",
                  stiffness: 600,
                  damping: 50,
                  mass: 0.5,
                  velocity: 0,
                },
                width: {
                  type: "spring",
                  stiffness: 600,
                  damping: 50,
                  mass: 0.5,
                  velocity: 0,
                },
                opacity: {
                  duration: 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                },
              }}
            />

            {/* Hover underline */}
            {isDesktop && (
              <motion.div
                className="absolute -bottom-2 h-[2px] bg-gradient-to-r from-white via-gray-200 to-gray-300 rounded-full"
                animate={{
                  left: hoverUnderline.left,
                  width: hoverUnderline.width,
                  opacity: hoverUnderline.isVisible ? 1 : 0,
                }}
                transition={{
                  left: {
                    type: "spring",
                    stiffness: 800,
                    damping: 60,
                    mass: 0.3,
                    velocity: 0,
                    restDelta: 0.001,
                  },
                  width: {
                    type: "spring",
                    stiffness: 800,
                    damping: 60,
                    mass: 0.3,
                    velocity: 0,
                    restDelta: 0.001,
                  },
                  opacity: {
                    duration: 0.12,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  },
                }}
                style={{
                  willChange: "transform, opacity",
                }}
              />
            )}

            {["Home", "About", "Encrypt", "Decrypt", "Contact"].map((item) => {
              const path = item === "Home" ? "/" : `/${item.toLowerCase()}`;
              const isActive = location.pathname === path;
              return (
                <motion.div
                  key={item}
                  variants={itemVariants}
                  whileHover={
                    isDesktop
                      ? {
                          y: -2,
                          transition: {
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 0.5,
                          },
                        }
                      : {}
                  }
                >
                  <NavLink
                    to={path}
                    end
                    ref={(el) => {
                      navRefs.current[item] = el as HTMLElement | null;
                    }}
                    className={`relative text-white px-2 md:px-3 lg:px-4 py-2 text-sm md:text-base lg:text-lg font-light tracking-wide transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] rounded-full ${
                      isActive
                        ? "text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text font-normal"
                        : "hover:text-gray-200"
                    }`}
                    onMouseEnter={() => handleMouseEnter(item)}
                    style={{
                      willChange: "transform",
                    }}
                  >
                    <motion.span
                      whileHover={
                        isDesktop
                          ? {
                              scale: 1.05,
                              transition: {
                                type: "spring",
                                stiffness: 500,
                                damping: 20,
                                mass: 0.4,
                              },
                            }
                          : {}
                      }
                      whileTap={{ scale: 0.9 }}
                      className="inline-block"
                    >
                      {item}
                    </motion.span>
                  </NavLink>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Mobile hamburger button */}
          <motion.button
            className="md:hidden relative z-10 w-10 h-10 flex flex-col justify-center items-center space-y-1.5 !bg-transparent focus:!border-transparent touch-manipulation"
            onClick={toggleMobileMenu}
            variants={hamburgerVariants}
            animate={isMobileMenuOpen ? "open" : "closed"}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle mobile menu"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-6 h-0.5 bg-white rounded-full origin-center"
                variants={lineVariants}
                custom={i}
                animate={isMobileMenuOpen ? "open" : "closed"}
              />
            ))}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/20 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
            />

            {/* Mobile menu content */}
            <motion.div
              className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-20"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex flex-col items-center space-y-6 sm:space-y-8">
                {["Home", "About", "Encrypt", "Decrypt", "Contact"].map(
                  (item) => {
                    const path =
                      item === "Home" ? "/" : `/${item.toLowerCase()}`;
                    const isActive = location.pathname === path;
                    return (
                      <motion.div key={item} variants={mobileItemVariants}>
                        <NavLink
                          to={path}
                          end
                          className={`text-xl sm:text-2xl md:text-3xl font-light tracking-wide transition-all duration-300 touch-manipulation ${
                            isActive
                              ? "text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text font-normal"
                              : "text-white hover:text-gray-200 active:text-gray-300"
                          }`}
                          onClick={toggleMobileMenu}
                        >
                          <motion.span
                            whileTap={{ scale: 0.9 }}
                            className="inline-block"
                          >
                            {item}
                          </motion.span>
                        </NavLink>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
