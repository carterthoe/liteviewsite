import '../styles/about.css';

function About() {

  return (
    <div className="about-container">
      {/* Project Info */}
      <section className="project-section">
        <h2 className="section-title">The LiteView Project</h2>
        <p className="project-description">
          Our satellite visualizer tracks thousands of satellites in real-time, providing 
          an immersive 3D experience that helps users understand the complexity of objects 
          orbiting our planet. From the International Space Station to space debris, 
          we bring outer space straight to your screen.
        </p>
      </section>
      {/* Team Info */}
      <section className="about-team-section">
        <div className="about-team-content">
          <h1 className="about-team-title">
            About <span className="highlight">Our Team</span>
          </h1>
          <p className="about-team-subtitle">
            We are a team of 3 students at the University of Missouri: Supreet Aradhya, Ashton Kuhn, 
            and Carter Thoe. Our mission is to make satellite tracking accessible, 
            educational, and visually intriguing for everyone for space enthusiasts around the globe.
          </p>
        </div>
      </section>
    </div>
  );
}

export default About;