import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Login.module.css";
import { useAuth } from "../context/AuthContext";
import { FirebaseError } from "firebase/app";
import { GoogleLogo } from "../helpers/icons";

const Login: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "login" | "register" | "forgotPassword"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } =
    useAuth();

  const clearFormFields = (clearEmail = false) => {
    if (clearEmail) setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleViewChange = (
    newView: "login" | "register" | "forgotPassword"
  ) => {
    setViewMode(newView);
    setError("");
    if (newView !== "forgotPassword") {
      clearFormFields(newView === "register");
    } else {
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (viewMode === "register" && password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      if (viewMode === "login") {
        await signInWithEmail(email, password);
        navigate("/app");
      } else if (viewMode === "register") {
        await signUpWithEmail(email, password);
        handleViewChange("login");
        clearFormFields(true);
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        let errorMessage = "Failed to process request";
        switch (err.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMessage = "Invalid email or password";
            break;
          case "auth/email-already-in-use":
            errorMessage = "Email already in use";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address";
            break;
          default:
            errorMessage = err.message || "An unexpected error occurred.";
        }
        setError(errorMessage);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      navigate("/app");
    } catch (error) {
      console.error(error);
      setError("Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!email) {
      return setError("Please enter your email address");
    }

    try {
      setError("");
      setLoading(true);
      await resetPassword(email);
      setError("Password reset email sent. Check your inbox.");
    } catch (err) {
      console.error(err);
      if (err instanceof FirebaseError) {
        setError(err.message || "Failed to send password reset email");
      } else {
        setError("Failed to send password reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (viewMode === "login") return "Sign In";
    if (viewMode === "register") return "Create Account";
    return "Reset Password";
  };

  const getSubtitle = () => {
    if (viewMode === "login") return "Sign in to access your account";
    if (viewMode === "register") return "Create a new account to get started";
    return "Enter your email to reset your password";
  };

  return (
    <div className={styles.container}>
      <div className={styles.diagonalLine}></div>
      <div className={styles.diagonalLine}></div>
      <div className={styles.diagonalLine}></div>
      <div className={styles.diagonalLine}></div>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>{getTitle()}</h1>
          <p className={styles.subtitle}>{getSubtitle()}</p>
        </div>

        {viewMode !== "forgotPassword" && (
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${
                viewMode === "login" ? styles.activeTab : ""
              }`}
              onClick={() => handleViewChange("login")}
            >
              Sign In
            </button>
            <button
              className={`${styles.tab} ${
                viewMode === "register" ? styles.activeTab : ""
              }`}
              onClick={() => handleViewChange("register")}
            >
              Register
            </button>
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}

        {viewMode === "login" || viewMode === "register" ? (
          <>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {viewMode === "register" && (
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required={viewMode === "register"}
                  />
                </div>
              )}

              {viewMode === "login" && (
                <div className={styles.resetPassword}>
                  <button
                    type="button"
                    onClick={() => handleViewChange("forgotPassword")}
                    className={styles.link}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : viewMode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            <div className={styles.divider}>
              <span className={styles.dividerText}>OR</span>
            </div>

            <div className={styles.socialButtons}>
              <button
                className={`${styles.socialButton} ${styles.google}`}
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <GoogleLogo />
                Continue with Google
              </button>
            </div>

            <div className={styles.footer}>
              <p className={styles.footerText}>
                {viewMode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  className={styles.switchButton}
                  onClick={() =>
                    handleViewChange(
                      viewMode === "login" ? "register" : "login"
                    )
                  }
                >
                  {viewMode === "login" ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleForgotPasswordSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Sending..." : "Reset Password"}
              </button>
            </form>
            <div className={styles.footer} style={{ marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className={styles.link}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
