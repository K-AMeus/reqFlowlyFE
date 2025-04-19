import React from "react";
import styles from "../styles/ProjectSidebar.module.css";

interface ProjectSidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  projectName: string;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  activePage,
  onPageChange,
  projectName,
  isOpen,
  toggleSidebar,
}) => {
  const navItems = [
    {
      id: "metadata",
      name: "Project Metadata",
      icon: "📋",
    },
    {
      id: "domain-objects",
      name: "Domain Objects",
      icon: "🔍",
    },
    {
      id: "use-cases",
      name: "Use Cases",
      icon: "📝",
    },
    {
      id: "test-cases",
      name: "Test Cases",
      icon: "🧪",
    },
  ];

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSidebar();
  };

  return (
    <>
      <div
        className={`${styles.sidebarContainer} ${
          !isOpen ? styles.sidebarContainerClosed : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <h3>{projectName}</h3>
        </div>
        <div className={styles.sidebarContent}>
          <ul className={styles.sidebarNav}>
            {navItems.map((item) => (
              <li key={item.id} className={styles.navItem}>
                <a
                  href="#"
                  className={`${styles.navLink} ${
                    activePage === item.id ? styles.navLinkActive : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(item.id);
                  }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        className={`${styles.toggleButton} ${
          !isOpen ? styles.toggleButtonClosed : ""
        }`}
        onClick={handleToggle}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <span
          className={`${styles.toggleIcon} ${
            !isOpen ? styles.toggleIconClosed : ""
          }`}
        >
          ◀
        </span>
      </button>
    </>
  );
};

export default ProjectSidebar;
