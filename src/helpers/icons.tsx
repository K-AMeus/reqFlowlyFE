import React from "react";
import styles from "../styles/Projects.module.css";
import uploaderStyles from "../styles/UseCaseUploader.module.css";

export const RequirementsLogo = () => (
  <svg
    className={styles.projectLogo}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z" />
  </svg>
);

export const DeleteIcon = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) => (
  <div className={styles.deleteIcon} onClick={onClick} title="Delete project">
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        fill="white"
      />
    </svg>
  </div>
);

export const EditIcon = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) => (
  <div
    className={styles.editIcon}
    onClick={onClick}
    title="Edit project"
    style={{
      backgroundColor: "#1e4976",
      color: "white",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px",
      border: "1px solid rgba(30, 73, 118, 0.5)",
      cursor: "pointer",
    }}
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill="white"
      />
    </svg>
  </div>
);

export const BackIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronLeft = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"
      fill="currentColor"
    />
  </svg>
);

export const ChevronRight = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"
      fill="currentColor"
    />
  </svg>
);

export const CalendarIcon = () => (
  <svg
    className={styles.dateIcon}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const TimeIcon = () => (
  <svg
    className={styles.dateIcon}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
      fill="currentColor"
    />
  </svg>
);

export const CardCalendarIcon = () => (
  <svg
    className={styles.cardDateIcon}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const CardTimeIcon = () => (
  <svg
    className={styles.cardDateIcon}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
      fill="currentColor"
    />
  </svg>
);

export const UploaderDeleteIcon = ({ onClick }: { onClick: () => void }) => (
  <div
    className={uploaderStyles.deleteIcon}
    onClick={onClick}
    title="Remove domain object"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        fill="currentColor"
      />
    </svg>
  </div>
);

export const AddIcon = ({ onClick }: { onClick: () => void }) => (
  <div
    className={uploaderStyles.addIcon}
    onClick={onClick}
    title="Add domain object"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
    </svg>
  </div>
);
