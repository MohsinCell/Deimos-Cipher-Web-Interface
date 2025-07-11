import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa6";

// Footer component for the website
function Footer() {
  return (
    <footer className="relative overflow-hidden bg-transparent backdrop-blur-lg text-gray-300 pt-8 sm:pt-10 mt-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6 sm:mb-8">
          {/* About section */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-3 space-x-2">
              <img
                src="/logo-short.svg"
                alt="Deimos Cipher Short Logo"
                className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 object-contain"
              />
              <a
                href="/"
                className="transition-all duration-300 hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent rounded"
                aria-label="Go to Home Page"
              >
                <img
                  src="/logo-long.svg"
                  alt="Deimos Cipher Long Logo"
                  className="h-10 sm:h-12 w-auto flex-shrink-0 object-contain cursor-pointer"
                />
              </a>
            </div>
            <p className="text-sm sm:text-base text-gray-400 font-light leading-relaxed max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm mx-auto lg:mx-0 break-words">
              Advanced cryptographic technologies that make Deimos Cipher the
              most secure encryption solution available for your text, images,
              and videos.
            </p>
          </div>

          {/* Links section */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-6 sm:gap-8 text-center lg:text-left lg:pl-8 xl:pl-20">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 truncate">
                  Quick Links
                </h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li>
                    <a
                      href="/"
                      className="text-sm sm:text-base text-gray-400 font-light hover:bg-gradient-to-r hover:from-white hover:to-gray-300 hover:bg-clip-text hover:text-transparent transition-all duration-300 block py-1 truncate"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="/encrypt"
                      className="text-sm sm:text-base text-gray-400 font-light hover:bg-gradient-to-r hover:from-white hover:to-gray-300 hover:bg-clip-text hover:text-transparent transition-all duration-300 block py-1 truncate"
                    >
                      Encrypt
                    </a>
                  </li>
                  <li>
                    <a
                      href="/decrypt"
                      className="text-sm sm:text-base text-gray-400 font-light hover:bg-gradient-to-r hover:from-white hover:to-gray-300 hover:bg-clip-text hover:text-transparent transition-all duration-300 block py-1 truncate"
                    >
                      Decrypt
                    </a>
                  </li>
                  <li>
                    <a
                      href="/about"
                      className="text-sm sm:text-base text-gray-400 font-light hover:bg-gradient-to-r hover:from-white hover:to-gray-300 hover:bg-clip-text hover:text-transparent transition-all duration-300 block py-1 truncate"
                    >
                      About
                    </a>
                  </li>
                </ul>
              </div>

              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 truncate">
                  Resources
                </h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li>
                    <a
                      href="/contact"
                      className="text-sm sm:text-base text-gray-400 font-light hover:bg-gradient-to-r hover:from-white hover:to-gray-300 hover:bg-clip-text hover:text-transparent transition-all duration-300 block py-1 truncate"
                    >
                      Contact
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-sm sm:text-base text-gray-400 font-light hover:bg-gradient-to-r hover:from-white hover:to-gray-300 hover:bg-clip-text hover:text-transparent transition-all duration-300 block py-1 truncate"
                    >
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact section */}
          <div className="text-center lg:text-right">
            <h3 className="text-base sm:text-lg font-medium text-white mb-4">
              Connect with Me
            </h3>
            <div className="flex justify-center lg:justify-end space-x-3 sm:space-x-4 mb-3 flex-wrap gap-y-2">
              <a
                href="https://github.com/MohsinCell"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-full hover:bg-white/5 flex-shrink-0"
                aria-label="GitHub Profile"
              >
                <FaGithub size={20} className="sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://www.linkedin.com/in/mohsin-belam-b82abb279/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-full hover:bg-white/5 flex-shrink-0"
                aria-label="LinkedIn Profile"
              >
                <FaLinkedin size={20} className="sm:w-6 sm:h-6" />
              </a>
              <a
                href="mailto:mohsinbelam@gmail.com"
                className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-full hover:bg-white/5 flex-shrink-0"
                aria-label="Email Contact"
              >
                <FaEnvelope size={20} className="sm:w-6 sm:h-6" />
              </a>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-light max-w-xs mx-auto lg:mx-0 lg:ml-auto break-words">
              Built with cutting-edge cryptographic excellence
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="text-center pt-6 mt-6 border-t border-gray-700/50">
          <p className="text-sm text-gray-400 italic mb-2">
            "The only way to do great work is to love what you do" — Steve Jobs
          </p>
          <p className="text-xs text-gray-500">Developed by Mohsin Belam</p>
        </div>
      </div>

      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none -z-10" />
    </footer>
  );
}

export default Footer;
