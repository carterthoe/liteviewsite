import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import SatelliteVisualizer from './satellite_visualizer.jsx';
import About from './About.jsx';
import Features from './Features.jsx';
import '../styles/home.css';

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

// Layout component to wrap pages with Navbar
function Layout() {
  const location = useLocation();
  const isVisualizerPage = location.pathname === '/visualizer';

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Navbar />
      <div style={{ 
        height: isVisualizerPage ? '100vh' : 'calc(100vh - 60px)', 
        width: '100vw', 
        position: isVisualizerPage ? 'fixed' : 'relative',
        top: isVisualizerPage ? '0' : 'auto'
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route 
            path="/visualizer" 
            element={
              <ProtectedRoute>
                <SatelliteVisualizer />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

// Home component (landing page)
function Home() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  
  if (isAuthenticated) {
    return <Navigate to="/visualizer" replace />;
  }

  return (
    <div className="home-container">
      {/* Main Intro Section */}
      <section className="main-section">
        <div className="main-content">
          <h1 className="main-title">
            Track Satellites in <span className="highlight">Real-Time</span>
          </h1>
          <p className="main-subtitle">
            Explore thousands of satellites orbiting Earth with our immersive 3D visualization platform. 
            From the ISS to space debris, interact with orbital objects like never before.
          </p>
          <button className="explore-button" onClick={() => loginWithRedirect()}>
            Start Exploring
          </button>
        </div>
        <div className="main-image">
          <div className="orbit-animation">
            <div className="satellite"></div>
            <div className="earth"></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const { isLoading } = useAuth0();
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <Router>
      <Layout />
    </Router>
  );
}