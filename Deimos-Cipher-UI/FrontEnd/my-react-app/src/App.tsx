import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "@/pages/LandingPage";
import About from "@/pages/About";
import Contacts from "@/pages/Contacts";
import { EncryptPage } from "@/pages/Encrypt";
import { DecryptPage } from "@/pages/Decrypt";
import PrivacyPolicy from "@/pages/Privacy";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Scrolls to top whenever the route changes or on initial mount
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}

function App() {
  // Make sure page starts at the top on first load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Router>
      <div className="min-h-screen max-w-full w-[100vw] bg-black overflow-x-hidden absolute">
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/encrypt" element={<EncryptPage />} />
          <Route path="/decrypt" element={<DecryptPage />} />
          <Route path="/contact" element={<Contacts />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;
