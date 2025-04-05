import React from "react";
import { Link } from "react-router-dom";
import styles from "../styles/LandingPage.module.css";

const LandingPage: React.FC = () => {
  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Transform Requirements into Use Cases & Test Cases
          </h1>
          <p className={styles.heroDescription}>
            Flowreq uses advanced AI to generate comprehensive use cases and
            test cases from your written specifications, saving time and
            improving overall quality.
          </p>
          <div className={styles.heroCta}>
            <Link to="/login" className={styles.primaryButton}>
              Get Started
            </Link>
            <button
              onClick={() => scrollToSection("features")}
              className={styles.secondaryButton}
            >
              Learn More
            </button>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.imageContainer}>
            <div className={styles.browserMockup}>
              <div className={styles.browserHeader}>
                <div className={styles.browserButtons}>
                  <span className={styles.browserButton}></span>
                  <span className={styles.browserButton}></span>
                  <span className={styles.browserButton}></span>
                </div>
                <div className={styles.browserAddressBar}>
                  <span className={styles.browserUrl}>flowreq.io/app</span>
                </div>
              </div>
              <div className={styles.browserContent}>
                <div className={styles.mockupDashboard}>
                  <div className={styles.mockupTitle}>
                    Use Case & Test Case Generator
                  </div>
                  <div className={styles.mockupTabs}>
                    <div
                      className={`${styles.mockupTab} ${styles.mockupActiveTab}`}
                    >
                      Text Input
                    </div>
                    <div className={styles.mockupTab}>PDF Upload</div>
                  </div>
                  <div className={styles.mockupTextarea}></div>
                  <div className={styles.mockupButton}>Generate Cases</div>
                  <div className={styles.mockupResultsSection}>
                    <div className={styles.mockupResultsHeader}>
                      Domain Objects
                    </div>
                    <div className={styles.mockupResultsTable}>
                      <div className={styles.mockupTableRow}></div>
                      <div className={styles.mockupTableRow}></div>
                      <div className={styles.mockupTableRow}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Key Features</h2>
          <p className={styles.sectionDescription}>
            Our platform streamlines both use case and test case generation with
            powerful AI technology
          </p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" className={styles.icon}>
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"></path>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Natural Language Processing</h3>
            <p className={styles.featureDescription}>
              Upload your requirements document or paste text directly and our
              AI will extract use cases and test scenarios automatically.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" className={styles.icon}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z"></path>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Domain Object Detection</h3>
            <p className={styles.featureDescription}>
              Our AI identifies key domain objects and their attributes to
              create more comprehensive use cases and test scenarios.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" className={styles.icon}>
                <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"></path>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Customizable Output</h3>
            <p className={styles.featureDescription}>
              Fine-tune the generated use cases and test cases with custom
              prompts and refine the domain objects to match your specific
              needs.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" className={styles.icon}>
                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Complete Coverage</h3>
            <p className={styles.featureDescription}>
              Get end-to-end coverage with automatically generated use cases
              followed by comprehensive test cases including positive, negative,
              and edge scenarios.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionDescription}>
            Three simple steps to transform your specifications into
            comprehensive use cases and test cases
          </p>
        </div>

        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Input Your Requirements</h3>
            <p className={styles.stepDescription}>
              Upload a PDF document or paste your requirements as text directly
              into the platform.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>AI Analysis</h3>
            <p className={styles.stepDescription}>
              Our AI analyzes your requirements, identifies domain objects, and
              extracts use cases and test scenarios.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Generate & Export</h3>
            <p className={styles.stepDescription}>
              Review the generated use cases and test cases, make adjustments if
              needed, and export them for your development and testing workflow.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>
          Ready to Transform Your Requirements Process?
        </h2>
        <p className={styles.ctaDescription}>
          Join thousands of developers and QA professionals who are saving time
          and improving quality with automated use case and test case
          generation.
        </p>
        <Link to="/login" className={styles.ctaButton}>
          Get Started Now
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
