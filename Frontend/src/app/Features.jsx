import '../styles/features.css';
import { useAuth0 } from "@auth0/auth0-react";

function Features() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  
  const mainFeatures = [
    {
      icon: "🛡️",
      title: "Official DoD Data",
      description: "We source our satellite data directly from the U.S. Department of Defense's official API, ensuring the highest accuracy and reliability for tracking orbital objects.",
      highlight: "Trusted Source"
    },
    {
      icon: "🎨",
      title: "Advanced Visualization",
      description: "Our cutting-edge 3D rendered model transforms raw orbital data into stunning, interactive visualizations that make understanding satellite positions intuitive and engaging.",
      highlight: "Immersive Experience"
    },
    
    {
      icon: "🌐",
      title: "Global Coverage",
      description: "Our data tracks ksatellites all across the globe.",
      highlight: "Comprehensive"
    }
  ];

  return (
    <div className="features-container">
      {/* Header Section */}
      <section className="features-header-section">
        <div className="features-header-content">
          <h1 className="features-header-title">
            LiteView <span className="highlight">Features</span>
          </h1>
          <p className="features-header-subtitle">
            Experience satellite tracking backed by official data and cutting-edge visualization technology
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="main-features-section">
        <div className="main-features-grid">
          {mainFeatures.map((feature, index) => (
            <div key={index} className="main-feature-card">
              <div className="feature-icon-large">{feature.icon}</div>
              <div className="feature-badge">{feature.highlight}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="features-cta-section">
          <h2>Ready to Explore?</h2>
          <p>Start tracking satellites with our powerful visualization platform</p>
          <button className="cta-button" onClick={() => loginWithRedirect()}>
            Get Started
          </button>
        </section>
      )}
    </div>
  );
}

export default Features;