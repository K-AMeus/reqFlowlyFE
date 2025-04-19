import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/Projects.module.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  RequirementsLogo,
  BackIcon,
  ChevronLeft,
  ChevronRight,
} from "../helpers/icons";
import { CardCalendarIcon, CardTimeIcon } from "../helpers/icons";
import { formatTimeAgo, formatShortDate } from "../helpers/dateUtils";
import {
  createRefCallback,
  processTruncatedElements,
} from "../helpers/domUtils";
import { navigateToProject } from "../helpers/navigationUtils";
import { createAuthenticatedRequest } from "../helpers/apiUtils";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PageResponse {
  content: Project[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [, setTotalProjects] = useState(0);
  const projectsPerPage = 9;

  type SortField = "name" | "createdAt" | "updatedAt";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { currentUser } = useAuth();
  const descriptionRefs = useRef<{
    [key: string]: HTMLParagraphElement | null;
  }>({});
  const navigate = useNavigate();

  const setDescriptionRef =
    createRefCallback<HTMLParagraphElement>(descriptionRefs);

  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const checkTruncation = () => {
      processTruncatedElements(descriptionRefs.current, styles.truncated);
    };

    checkTruncation();
    const timer = setTimeout(checkTruncation, 100);

    return () => clearTimeout(timer);
  }, [projects]);

  const fetchProjects = async (page: number) => {
    setLoading(true);
    setError("");

    try {
      const api = await createAuthenticatedRequest(currentUser);
      const response = await api.get<PageResponse>(
        `/project-service/v1/projects`,
        {
          params: {
            page,
            size: projectsPerPage,
          },
        }
      );

      if (response.data && response.data.content) {
        setProjects(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalProjects(response.data.totalElements);
        setCurrentPage(page);
      } else {
        console.error("Invalid response format from API");
        setProjects([]);
        setTotalPages(0);
        setTotalProjects(0);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again later.");
      setProjects([]);
      setTotalPages(0);
      setTotalProjects(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      await api.post(`/project-service/v1/projects`, newProject);
      setShowCreateForm(false);
      setNewProject({ name: "", description: "" });
      fetchProjects(0);
    } catch (err) {
      setError("Failed to create project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigateToProject(navigate, project.id);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) {
      console.error("Cannot delete: projectToDelete is null");
      return;
    }

    if (!projectToDelete.id) {
      console.error("Cannot delete: project ID is undefined or null");
      setError("Failed to delete project: Missing project ID");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      await api.delete(`/project-service/v1/projects/${projectToDelete.id}`);

      setShowDeleteConfirm(false);
      setProjectToDelete(null);

      await fetchProjects(
        projects.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage
      );
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError("Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const showEllipsis = totalPages > 5;
    const startPage = showEllipsis
      ? Math.max(0, Math.min(currentPage - 1, totalPages - 4))
      : 0;
    const endPage = showEllipsis
      ? Math.min(startPage + 3, totalPages - 1)
      : totalPages - 1;

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`${styles.pageButton} ${
            currentPage === i ? styles.activePage : ""
          }`}
          onClick={() => goToPage(i)}
          aria-label={`Page ${i + 1}`}
        >
          {i + 1}
        </button>
      );
    }

    return (
      <div className={styles.pagination}>
        <div className={styles.paginationControls}>
          <button
            className={styles.pageNavButton}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>

          {showEllipsis && startPage > 0 && (
            <>
              <button
                className={styles.pageButton}
                onClick={() => goToPage(0)}
                aria-label="First page"
              >
                1
              </button>
              {startPage > 1 && <span className={styles.ellipsis}>...</span>}
            </>
          )}

          {pageNumbers}

          {showEllipsis && endPage < totalPages - 1 && (
            <>
              {endPage < totalPages - 2 && (
                <span className={styles.ellipsis}>...</span>
              )}
              <button
                className={styles.pageButton}
                onClick={() => goToPage(totalPages - 1)}
                aria-label="Last page"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            className={styles.pageNavButton}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    );
  };

  const sortProjects = (projects: Project[]): Project[] => {
    return [...projects].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const dateA = a[sortField]
          ? new Date(a[sortField] as string).getTime()
          : 0;
        const dateB = b[sortField]
          ? new Date(b[sortField] as string).getTime()
          : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
    });
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{showCreateForm ? "Project Creation" : "My Projects"}</h1>
        {!showCreateForm && (
          <button
            className={styles.createButton}
            onClick={() => setShowCreateForm(true)}
          >
            Create New Project
          </button>
        )}
        {showCreateForm && (
          <button
            className={styles.backButton}
            onClick={() => setShowCreateForm(false)}
          >
            <BackIcon /> Back to Projects
          </button>
        )}
      </div>

      {showCreateForm ? (
        <div className={styles.createForm}>
          <div className={styles.diagonalLine}></div>
          <div className={styles.diagonalLine}></div>
          <div className={styles.diagonalLine}></div>
          <div className={styles.diagonalLine}></div>

          <h2>Create New Project</h2>
          <form onSubmit={handleCreateProject}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Project Name</label>
              <input
                type="text"
                id="name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="Enter project name"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Enter project description"
              />
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {error && <div className={styles.error}>{error}</div>}

          {loading && projects.length === 0 ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                No projects found. Create your first project to get started.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.projectListHeader}>
                <div className={styles.sortOptions}>
                  <span className={styles.sortLabel}>Sort by:</span>
                  <button
                    className={`${styles.sortButton} ${
                      sortField === "name" ? styles.sortActive : ""
                    }`}
                    onClick={() => handleSortChange("name")}
                  >
                    Name
                    {sortField === "name" && (
                      <span className={styles.sortDirection}>
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                  <button
                    className={`${styles.sortButton} ${
                      sortField === "createdAt" ? styles.sortActive : ""
                    }`}
                    onClick={() => handleSortChange("createdAt")}
                  >
                    Creation Date
                    {sortField === "createdAt" && (
                      <span className={styles.sortDirection}>
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                  <button
                    className={`${styles.sortButton} ${
                      sortField === "updatedAt" ? styles.sortActive : ""
                    }`}
                    onClick={() => handleSortChange("updatedAt")}
                  >
                    Last Updated
                    {sortField === "updatedAt" && (
                      <span className={styles.sortDirection}>
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <div className={styles.projectList}>
                {sortProjects(projects).map((project) => (
                  <div
                    key={project.id}
                    className={styles.projectCard}
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className={styles.projectCardHeader}>
                      <RequirementsLogo />
                      <h3>{project.name}</h3>
                    </div>
                    {project.description && (
                      <p ref={setDescriptionRef(project.id)}>
                        {project.description}
                      </p>
                    )}
                    <div className={styles.projectFooter}>
                      <div className={styles.projectDates}>
                        {project.createdAt && (
                          <div className={styles.dateItem}>
                            <div className={styles.dateLabel}>
                              <CardCalendarIcon />
                              <span>Created</span>
                            </div>
                            <span className={styles.dateValue}>
                              {formatShortDate(project.createdAt)}
                            </span>
                          </div>
                        )}
                        {project.updatedAt && (
                          <div className={styles.dateItem}>
                            <div className={styles.dateLabel}>
                              <CardTimeIcon />
                              <span>Modified</span>
                            </div>
                            <span className={styles.dateValue}>
                              {formatTimeAgo(project.updatedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {renderPagination()}
            </>
          )}
        </>
      )}

      {showDeleteConfirm && projectToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmDialog}>
            <h3>Delete Project?</h3>
            <p>
              Are you sure you wish to delete the project "
              {projectToDelete.name}"? This action cannot be undone.
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

export default ProjectList;
