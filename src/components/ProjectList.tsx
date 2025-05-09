import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/Projects.module.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BackIcon, ChevronLeft, ChevronRight } from "../helpers/icons";
import { CardCalendarIcon, CardTimeIcon } from "../helpers/icons";
import { formatTimeAgo } from "../helpers/dateUtils";
import {
  createRefCallback,
  processTruncatedElements,
} from "../helpers/domUtils";
import { navigateToProject } from "../helpers/navigationUtils";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { ProjectService, Project } from "../services/ProjectService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
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

  const [projectServiceInstance, setProjectServiceInstance] =
    useState<ProjectService | null>(null);

  const setDescriptionRef =
    createRefCallback<HTMLParagraphElement>(descriptionRefs);

  useEffect(() => {
    if (currentUser) {
      const initializeService = async () => {
        try {
          const api = await createAuthenticatedRequest(currentUser);
          setProjectServiceInstance(new ProjectService(api));
        } catch (err) {
          console.error("Failed to initialize ProjectService:", err);
          setError(
            "Failed to initialize project service. Please try again later."
          );
        }
      };
      initializeService();
    }
  }, [currentUser]);

  useEffect(() => {
    if (projectServiceInstance) {
      fetchProjects(currentPage, sortField, sortDirection);
    }
  }, [projectServiceInstance, currentPage, sortField, sortDirection]);

  useEffect(() => {
    const checkTruncation = () => {
      processTruncatedElements(descriptionRefs.current, styles.truncated);
    };

    checkTruncation();
    const timer = setTimeout(checkTruncation, 100);

    return () => clearTimeout(timer);
  }, [projects]);

  const fetchProjects = async (
    page: number,
    sf: SortField,
    sd: SortDirection
  ) => {
    if (!projectServiceInstance) return;

    setLoading(true);
    setError("");

    try {
      const responseData = await projectServiceInstance.getAllProjects(
        page,
        projectsPerPage,
        sf,
        sd
      );

      if (responseData && responseData.content) {
        setProjects(responseData.content);
        setTotalPages(responseData.totalPages);
        setTotalProjects(responseData.totalElements);
        setCurrentPage(responseData.number);
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
      setIsSorting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectServiceInstance) {
      setError("Project service is not available.");
      return;
    }
    try {
      setLoading(true);
      await projectServiceInstance.createProject(newProject);
      setShowCreateForm(false);
      setNewProject({ name: "", description: "" });
      fetchProjects(0, sortField, sortDirection);
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
    if (!projectToDelete || !projectServiceInstance) {
      setError(
        "Project service is not available or no project selected for deletion."
      );
      console.error(
        "Cannot delete: projectToDelete is null or service unavailable"
      );
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
      await projectServiceInstance.deleteProject(projectToDelete.id);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);

      const newCurrentPage =
        projects.length === 1 && currentPage > 0
          ? currentPage - 1
          : currentPage;
      fetchProjects(newCurrentPage, sortField, sortDirection);
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
    const maxVisiblePages = 3;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages + 2) {
      startPage = 0;
      endPage = totalPages - 1;
    } else {
      if (currentPage <= Math.floor(maxVisiblePages / 2) + 1) {
        startPage = 0;
        endPage = maxVisiblePages - 1;
      } else if (
        currentPage + Math.floor(maxVisiblePages / 2) >=
        totalPages - 2
      ) {
        startPage = totalPages - maxVisiblePages;
        endPage = totalPages - 1;
      } else {
        startPage = currentPage - Math.floor(maxVisiblePages / 2);
        endPage = currentPage + Math.floor(maxVisiblePages / 2);
      }
    }

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

          {startPage > 0 && (
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

          {endPage < totalPages - 1 && (
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
            disabled={currentPage === totalPages - 1 || totalPages === 0}
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    );
  };

  const handleSortChange = (clickedField: SortField) => {
    let newSortDirection: SortDirection;

    if (clickedField === sortField) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      newSortDirection = clickedField === "name" ? "asc" : "desc";
    }

    if (clickedField !== sortField || newSortDirection !== sortDirection) {
      setIsSorting(true);
      setSortField(clickedField);
      setSortDirection(newSortDirection);
      setCurrentPage(0);
    }
  };

  const getSortButtonText = (
    field: SortField,
    label: string
  ): React.ReactNode => {
    if (sortField === field && isSorting) {
      return (
        <>
          <div className={styles.buttonSpinner}></div>
          Sorting...
        </>
      );
    }
    return label;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{showCreateForm ? "Project Creation" : "My Projects"}</h1>
        {!showCreateForm && projects.length > 0 && (
          <button
            className={styles.createButton}
            onClick={() => setShowCreateForm(true)}
            disabled={isSorting || loading}
          >
            Create New Project
          </button>
        )}
        {showCreateForm && (
          <button
            className={styles.backButton}
            onClick={() => {
              setShowCreateForm(false);
              setError("");
            }}
          >
            <BackIcon /> Back to Projects
          </button>
        )}
      </div>

      {showCreateForm ? (
        <>
          <div className={styles.diagonalLine}></div>
          <div className={styles.diagonalLine}></div>
          <div className={styles.diagonalLine}></div>
          <div className={styles.diagonalLine}></div>
          <div className={styles.diagonalLine}></div>
          <div className={styles.createForm}>
            <h2>Create New Project</h2>
            {error && <div className={styles.error}>{error}</div>}
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
                    setNewProject({
                      ...newProject,
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
                  onClick={() => {
                    setShowCreateForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading || !projectServiceInstance}
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <>
          {error && !loading && <div className={styles.error}>{error}</div>}

          {loading &&
          projects.length === 0 &&
          projectServiceInstance &&
          !isSorting ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading projects...</p>
            </div>
          ) : !projectServiceInstance && !error ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Initializing service...</p>
            </div>
          ) : projects.length === 0 && !error && !loading ? (
            <div className={styles.emptyState}>
              <p>
                No projects found. Create your first project to get started.
              </p>
              <button
                className={styles.createButton}
                onClick={() => setShowCreateForm(true)}
                disabled={!projectServiceInstance || isSorting || loading}
              >
                Create New Project
              </button>
            </div>
          ) : (
            projectServiceInstance &&
            (projects.length > 0 || isSorting) && (
              <>
                <div className={styles.projectListHeader}>
                  <div className={styles.sortOptions}>
                    <span className={styles.sortLabel}>Sort by:</span>
                    {isSorting && (!projects || projects.length === 0) && (
                      <div className={styles.sortingMessageContainer}>
                        <div className={styles.spinner}></div>
                        <span>Sorting projects...</span>
                      </div>
                    )}
                    <button
                      className={`${styles.sortButton} ${
                        sortField === "name" ? styles.sortActive : ""
                      }`}
                      onClick={() => handleSortChange("name")}
                      disabled={isSorting}
                    >
                      {getSortButtonText("name", "Name")}
                      {sortField === "name" && !isSorting && (
                        <FontAwesomeIcon
                          icon={
                            sortDirection === "asc" ? faArrowUp : faArrowDown
                          }
                          className={styles.sortDirectionIcon}
                        />
                      )}
                    </button>
                    <button
                      className={`${styles.sortButton} ${
                        sortField === "createdAt" ? styles.sortActive : ""
                      }`}
                      onClick={() => handleSortChange("createdAt")}
                      disabled={isSorting}
                    >
                      {getSortButtonText("createdAt", "Creation Date")}
                      {sortField === "createdAt" && !isSorting && (
                        <FontAwesomeIcon
                          icon={
                            sortDirection === "asc" ? faArrowUp : faArrowDown
                          }
                          className={styles.sortDirectionIcon}
                        />
                      )}
                    </button>
                    <button
                      className={`${styles.sortButton} ${
                        sortField === "updatedAt" ? styles.sortActive : ""
                      }`}
                      onClick={() => handleSortChange("updatedAt")}
                      disabled={isSorting}
                    >
                      {getSortButtonText("updatedAt", "Last Updated")}
                      {sortField === "updatedAt" && !isSorting && (
                        <FontAwesomeIcon
                          icon={
                            sortDirection === "asc" ? faArrowUp : faArrowDown
                          }
                          className={styles.sortDirectionIcon}
                        />
                      )}
                    </button>
                  </div>
                </div>
                <div
                  className={`${styles.projectList} ${
                    isSorting && projects && projects.length > 0
                      ? styles.dimmedOnSort
                      : ""
                  }`}
                >
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={styles.projectCard}
                      onClick={() => !isSorting && handleProjectClick(project)}
                    >
                      <div className={styles.projectCardHeader}>
                        <FontAwesomeIcon
                          icon={faFolder}
                          className={styles.projectCardIcon}
                        />
                        <h3>{project.name}</h3>
                      </div>
                      <p
                        ref={setDescriptionRef(project.id)}
                        className={styles.projectCardDescription}
                      >
                        {project.description &&
                        project.description.trim() !== "" ? (
                          project.description
                        ) : (
                          <em className={styles.noDescriptionText}>
                            Not description provided for this project
                          </em>
                        )}
                      </p>
                      <div className={styles.projectFooter}>
                        <div className={styles.projectDates}>
                          {project.createdAt && (
                            <div className={styles.dateItem}>
                              <div className={styles.dateLabel}>
                                <CardCalendarIcon />
                                <span>Created</span>
                              </div>
                              <span className={styles.dateValue}>
                                {formatTimeAgo(project.createdAt)}
                              </span>
                            </div>
                          )}
                          {project.updatedAt && (
                            <div className={styles.dateItem}>
                              <div className={styles.dateLabel}>
                                <CardTimeIcon />
                                <span>Updated</span>
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
            )
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
                disabled={loading || !projectServiceInstance}
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
