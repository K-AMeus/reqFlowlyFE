import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/Header.module.css";
import { useAuth } from "../context/AuthContext";
import { navigateTo } from "../helpers";

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
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
        <div
          className={styles.logo}
          onClick={() => navigateTo(navigate, "/")}
          style={{ cursor: "pointer" }}
        >
          ReqFlowly
        </div>
        <div className={styles.actions}>
          {isLoggedIn ? (
            <>
              <div className={styles.userInfo}>{currentUser?.email}</div>
              <button
                onClick={() => navigateTo(navigate, "/projects")}
                className={styles.navLink}
              >
                Projects
              </button>
              <button onClick={handleLogout} className={styles.loginButton}>
                Log Out
              </button>
            </>
          ) : isLoginPage ? (
            <button
              onClick={() => navigateTo(navigate, "/")}
              className={styles.loginButton}
            >
              Home
            </button>
          ) : (
            <button
              onClick={() => navigateTo(navigate, "/login")}
              className={styles.loginButton}
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
