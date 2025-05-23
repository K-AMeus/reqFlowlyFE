import React from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Footer.module.css";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>ReqFlowly</div>
            <p className={styles.footerDescription}>
              Transform requirements into use cases and test cases with our
              AI-powered platform.
            </p>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerHeading}>Quick Links</h3>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/" className={styles.footerLink}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className={styles.footerLink}>
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/projects" className={styles.footerLink}>
                  Projects
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerHeading}>Resources</h3>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#" className={styles.footerLink}>
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Roadmap
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3 className={styles.footerHeading}>Legal</h3>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#" className={styles.footerLink}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            &copy; {currentYear} ReqFlowly. All rights reserved.
          </div>
          <div className={styles.socialLinks}>
            <a href="#" className={styles.socialLink} aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
            <a href="#" className={styles.socialLink} aria-label="Twitter">
              <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
              </svg>
            </a>
            <a href="#" className={styles.socialLink} aria-label="GitHub">
              <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
