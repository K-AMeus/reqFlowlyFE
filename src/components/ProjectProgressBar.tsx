import React from "react";
import styles from "../styles/ProjectProgressBar.module.css";

interface ProjectProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const stepsData = [
    { id: 1, label: "Requirements" },
    { id: 2, label: "Domain Obj." },
    { id: 3, label: "Use & Test Cases" },
    { id: 4, label: "Export" },
  ];

  const steps = stepsData.slice(0, totalSteps);

  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.progressBar}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`${styles.step} ${
                step.id <= currentStep ? styles.completed : ""
              } ${step.id === currentStep ? styles.active : ""}`}
            >
              <div className={styles.stepCircle}>
                {step.id < currentStep ? (
                  <svg
                    className={styles.checkmark}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <div className={styles.stepLabel}>{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`${styles.connector} ${
                  step.id < currentStep ? styles.completed : ""
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProjectProgressBar;
