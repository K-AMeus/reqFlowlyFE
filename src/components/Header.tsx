import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../styles/Header.module.css";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logoLink}>
          <div className={styles.logo}>ReqFlowly</div>
        </Link>
        <div className={styles.actions}>
          {isLoggedIn ? (
            <>
              <div className={styles.userInfo}>{currentUser?.email}</div>
              <Link to="/app" className={styles.navLink}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className={styles.loginButton}>
                Log Out
              </button>
            </>
          ) : isLoginPage ? (
            <Link to="/" className={styles.loginButton}>
              Home
            </Link>
          ) : (
            <Link to="/login" className={styles.loginButton}>
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
