import React, { useState, useEffect } from "react";
import styles from "../styles/Projects.module.css";
import sidebarStyles from "../styles/ProjectSidebar.module.css";
import UseCaseUploader from "./UseCaseUploader";
import ProjectSidebar from "./ProjectSidebar";
import RequirementsList from "./RequirementsList";
import UsedRequirementsList from "./UsedRequirementsList";
import ProjectProgressBar from "./ProjectProgressBar";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { EditIcon, DeleteIcon } from "../helpers/icons";
import { formatTimeAgo } from "../helpers/dateUtils";
import { navigateTo } from "../helpers/navigationUtils";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import axios from "axios";
import { showGlobalToast } from "../helpers/toastUtils";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectComponentProps {
  initialView?: string;
}

const Project: React.FC<ProjectComponentProps> = ({
  initialView = "metadata",
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });
  const [activePage, setActivePage] = useState(initialView);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { currentUser } = useAuth();
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    setActivePage(initialView);
  }, [initialView]);

  const fetchProjectById = async (id: string) => {
    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      const response = await api.get<Project>(
        `/project-service/v1/projects/${id}`
      );

      setSelectedProject(response.data);
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Failed to fetch project details");
      navigateTo(navigate, "/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedProject) {
      setEditFormData({
        name: selectedProject.name,
        description: selectedProject.description || "",
      });
      setIsInlineEditing(true);
    }
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!selectedProject || !selectedProject.id) {
      console.error("Cannot edit: project ID is missing");
      setError("Failed to edit project: Missing project ID");
      setIsInlineEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      const api = await createAuthenticatedRequest(currentUser);
      await api.put(
        `/project-service/v1/projects/${selectedProject.id}`,
        editFormData
      );

      setIsInlineEditing(false);
      fetchProjectById(selectedProject.id);
    } catch (err) {
      console.error("Failed to edit project:", err);
      setError("Failed to edit project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProject || !selectedProject.id) {
      console.error("Cannot delete: project ID is missing");
      showGlobalToast("error", "Failed to delete project: Missing project ID");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      await api.delete(`/project-service/v1/projects/${selectedProject.id}`);

      setShowDeleteConfirm(false);
      navigateTo(navigate, "/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.status === 403
            ? "ERROR: The project may have dependencies that need to be deleted first"
            : "ERROR: Failed to delete project";

        showGlobalToast("error", errorMessage, 7000);
      } else {
        showGlobalToast("error", "Failed to delete project", 7000);
      }
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const cancelInlineEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInlineEditing(false);
    if (selectedProject) {
      setEditFormData({
        name: selectedProject.name,
        description: selectedProject.description || "",
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);

    if (projectId) {
      if (page === "metadata") {
        navigate(`/projects/${projectId}`);
      } else {
        navigate(`/projects/${projectId}/${page}`);
      }
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  };

  const getStepNumber = (page: string): number => {
    const stepMap: Record<string, number> = {
      metadata: 1,
      "domain-objects": 2,
      "use-cases": 3,
      "test-cases": 4,
    };
    return stepMap[page] || 1;
  };

  const renderPageContent = () => {
    if (loading || !selectedProject) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading project...</p>
        </div>
      );
    }

    switch (activePage) {
      case "metadata":
        return (
          <div className={styles.metadataContent}>
            <div className={styles.unifiedContentContainer}>
              <div className={styles.metadataCard}>
                <div className={styles.metadataHeader}>
                  {!isInlineEditing ? (
                    <>
                      <h1>{selectedProject.name}</h1>
                      <div className={styles.headerDates}>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>Created:</span>
                          <span className={styles.metadataValue}>
                            {selectedProject.createdAt
                              ? formatTimeAgo(selectedProject.createdAt)
                              : "N/A"}
                          </span>
                        </div>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>Updated:</span>
                          <span className={styles.metadataValue}>
                            {selectedProject.updatedAt
                              ? formatTimeAgo(selectedProject.updatedAt)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.projectActions}>
                        <EditIcon onClick={handleEditClick} />
                        <DeleteIcon onClick={handleDeleteClick} />
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className={styles.titleInput}
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter project name"
                        required
                      />
                      <div className={styles.projectActions}>
                        <div
                          className={`${styles.saveIcon} ${
                            isSaving ? styles.saveIconDisabled : ""
                          }`}
                          onClick={!isSaving ? handleSaveEdit : undefined}
                          title="Save changes"
                        >
                          {isSaving ? (
                            <div className={styles.saveIconSpinner}></div>
                          ) : (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                                fill="#ffffff"
                              />
                            </svg>
                          )}
                        </div>
                        <div
                          className={styles.cancelIcon}
                          onClick={cancelInlineEdit}
                          title="Cancel editing"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                              fill="#ffffff"
                            />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.metadataSection}>
                  <h3>Description</h3>
                  {!isInlineEditing ? (
                    <p>
                      {selectedProject.description || (
                        <em>No description provided.</em>
                      )}
                    </p>
                  ) : (
                    <textarea
                      className={styles.descriptionTextarea}
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter project description"
                    />
                  )}
                </div>

                <div className={styles.requirementsWrapper}>
                  <RequirementsList projectId={selectedProject.id} />
                </div>
              </div>
            </div>
          </div>
        );
      case "domain-objects":
        return (
          <div className={styles.domainObjectsContent}>
            <div className={styles.domainObjectWrapper}>
              <UseCaseUploader />
            </div>
          </div>
        );
      case "use-cases":
        return (
          <div className={styles.useCasesContent}>
            <div className={styles.unifiedContentContainer}>
              <div className={styles.metadataCard}>
                <div className={styles.useCasesHeader}>
                  <h1>Domain Objects</h1>
                  <p className={styles.useCasesDescription}>
                    View and manage domain objects that have been generated from
                    requirements
                  </p>
                </div>
                <UsedRequirementsList projectId={selectedProject.id} />
              </div>
            </div>
          </div>
        );
      case "test-cases":
        return (
          <div className={styles.testCasesContent}>
            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🚧</div>
              <h3>Coming Soon</h3>
              <p>Test case generation is under development.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!selectedProject) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading project...</p>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    );
  }

  return (
    <div className={styles.projectDetailContainer}>
      <ProjectSidebar
        activePage={activePage}
        onPageChange={handlePageChange}
        projectName={selectedProject.name}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div
        className={`${sidebarStyles.mainContent} ${
          !sidebarOpen ? sidebarStyles.mainContentFull : ""
        }`}
      >
        <ProjectProgressBar currentStep={getStepNumber(activePage)} />

        <div className={styles.projectDetail}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.pageContentWrapper}>{renderPageContent()}</div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmDialog}>
            <h3>Delete Project?</h3>
            <p>
              Are you sure you wish to delete the project "
              {selectedProject.name}"? This action cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={cancelDelete}
                disabled={loading}
              >
                No, Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Project;
