import React, { useState, useEffect } from "react";
import styles from "../styles/Projects.module.css";
import sidebarStyles from "../styles/ProjectSidebar.module.css";
import UseCaseUploader from "./UseCaseUploader";
import ProjectSidebar from "./ProjectSidebar";
import RequirementsList from "./RequirementsList";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { EditIcon, DeleteIcon, BackIcon } from "../helpers/icons";
import { formatDate, formatTimeAgo } from "../helpers/dateUtils";
import { navigateTo } from "../helpers/navigationUtils";
import { createAuthenticatedRequest } from "../helpers/apiUtils";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

const Project: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });
  const [activePage, setActivePage] = useState("metadata");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { currentUser } = useAuth();
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
    }
  }, [projectId]);

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
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject || !selectedProject.id) {
      console.error("Cannot edit: project ID is missing");
      setError("Failed to edit project: Missing project ID");
      setShowEditModal(false);
      return;
    }

    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      await api.put(
        `/project-service/v1/projects/${selectedProject.id}`,
        editFormData
      );

      setShowEditModal(false);
      fetchProjectById(selectedProject.id);
    } catch (err) {
      console.error("Failed to edit project:", err);
      setError("Failed to edit project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProject || !selectedProject.id) {
      console.error("Cannot delete: project ID is missing");
      setError("Failed to delete project: Missing project ID");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      await api.delete(`/project-service/v1/projects/${selectedProject.id}`);

      setShowDeleteConfirm(false);
      navigateTo(navigate, "/projects");
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError("Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditFormData({ name: "", description: "" });
  };

  const handleBackToProjects = () => {
    navigateTo(navigate, "/projects");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  };

  const renderPageNavigation = () => {
    const pages = [
      { id: "metadata", label: "Project Metadata" },
      { id: "domain-objects", label: "Domain Objects" },
      { id: "use-cases", label: "Use Cases" },
      { id: "test-cases", label: "Test Cases" },
    ];

    const currentIndex = pages.findIndex((page) => page.id === activePage);
    const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
    const nextPage =
      currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

    return (
      <div className={styles.pagination}>
        <div className={styles.paginationControls}>
          <button
            className={styles.pageNavButton}
            onClick={() => handlePageChange(prevPage?.id || "")}
            disabled={!prevPage}
          >
            &lt;
          </button>

          {pages.map((page) => (
            <button
              key={page.id}
              className={`${styles.pageButton} ${
                activePage === page.id ? styles.activePage : ""
              }`}
              onClick={() => handlePageChange(page.id)}
            >
              {pages.indexOf(page) + 1}
            </button>
          ))}

          <button
            className={styles.pageNavButton}
            onClick={() => handlePageChange(nextPage?.id || "")}
            disabled={!nextPage}
          >
            &gt;
          </button>
        </div>
      </div>
    );
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
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Project Metadata</h2>
              <button
                className={styles.backButton}
                onClick={handleBackToProjects}
              >
                <BackIcon /> Back to Projects
              </button>
            </div>

            <div className={styles.metadataCard}>
              <div className={styles.metadataHeader}>
                <h1>{selectedProject.name}</h1>
                <div className={styles.projectActions}>
                  <EditIcon onClick={handleEditClick} />
                  <DeleteIcon onClick={handleDeleteClick} />
                </div>
              </div>
              <div className={styles.metadataSection}>
                <h3>Description</h3>
                <p>
                  {selectedProject.description || "No description provided."}
                </p>
              </div>
              <div className={styles.metadataSection}>
                <h3>Details</h3>
                <div className={styles.metadataGrid}>
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Created</span>
                    <span className={styles.metadataValue}>
                      {formatDate(selectedProject.createdAt)}
                    </span>
                  </div>
                  <div
                    className={styles.metadataItem}
                    style={{ marginLeft: "auto" }}
                  >
                    <span className={styles.metadataLabel}>Last Updated</span>
                    <span className={styles.metadataValue}>
                      {selectedProject.updatedAt
                        ? formatTimeAgo(selectedProject.updatedAt)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements section */}
            <div className={styles.requirementsSection}>
              <RequirementsList projectId={selectedProject.id} />
            </div>

            {renderPageNavigation()}
          </div>
        );
      case "domain-objects":
        return (
          <div className={styles.domainObjectsContent}>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Domain Objects</h2>
              <button
                className={styles.backButton}
                onClick={handleBackToProjects}
              >
                <BackIcon /> Back to Projects
              </button>
            </div>

            <div className={styles.domainObjectWrapper}>
              <UseCaseUploader />
            </div>

            {renderPageNavigation()}
          </div>
        );
      case "use-cases":
        return (
          <div className={styles.useCasesContent}>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Use Cases</h2>
              <button
                className={styles.backButton}
                onClick={handleBackToProjects}
              >
                <BackIcon /> Back to Projects
              </button>
            </div>

            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🚧</div>
              <h3>Coming Soon</h3>
              <p>Use case generation is under development.</p>
            </div>

            {renderPageNavigation()}
          </div>
        );
      case "test-cases":
        return (
          <div className={styles.testCasesContent}>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Test Cases</h2>
              <button
                className={styles.backButton}
                onClick={handleBackToProjects}
              >
                <BackIcon /> Back to Projects
              </button>
            </div>

            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIcon}>🚧</div>
              <h3>Coming Soon</h3>
              <p>Test case generation is under development.</p>
            </div>

            {renderPageNavigation()}
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
        <div className={styles.projectDetail}>
          {error && <div className={styles.error}>{error}</div>}
          {renderPageContent()}
        </div>
      </div>

      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.formDialog}>
            <h3>Edit Project</h3>
            <form onSubmit={handleSaveEdit}>
              <div className={styles.formGroup}>
                <label htmlFor="editName">Project Name</label>
                <input
                  type="text"
                  id="editName"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editDescription">Description (Optional)</label>
                <textarea
                  id="editDescription"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter project description"
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
