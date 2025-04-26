import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/Toast.module.css";
import { ToastConfig, registerToastHandler } from "../helpers/toastUtils";

interface Toast extends ToastConfig {
  id: string;
  progress: number;
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutsRef = useRef<{ [id: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const cleanup = registerToastHandler((config) => {
      const id = Date.now().toString();
      const newToast: Toast = {
        ...config,
        id,
        progress: 100,
      };

      setToasts((prev) => [...prev, newToast]);

      const duration = config.duration || 5000;
      const updateInterval = 50;
      const steps = duration / updateInterval;
      let currentStep = 0;

      const intervalId = setInterval(() => {
        currentStep++;
        const progress = 100 - (currentStep / steps) * 100;

        if (progress <= 0) {
          clearInterval(intervalId);
          removeToast(id);
        } else {
          setToasts((prev) =>
            prev.map((toast) =>
              toast.id === id ? { ...toast, progress } : toast
            )
          );
        }
      }, updateInterval);

      toastTimeoutsRef.current[id] = setTimeout(() => {
        clearInterval(intervalId);
        removeToast(id);
      }, duration);
    });

    return () => {
      cleanup();
      Object.values(toastTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (toastTimeoutsRef.current[id]) {
      clearTimeout(toastTimeoutsRef.current[id]);
      delete toastTimeoutsRef.current[id];
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <div className={styles.toastContent}>
            <div className={styles.toastIcon}>
              {toast.type === "success" && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {toast.type === "error" && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {toast.type === "info" && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {toast.type === "warning" && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            <div className={styles.toastMessage}>{toast.message}</div>
            <button
              className={styles.toastClose}
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          <div
            className={styles.toastProgress}
            style={{ width: `${toast.progress}%` }}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
