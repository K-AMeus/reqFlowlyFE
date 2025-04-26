import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Requirements.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { RequirementDto } from "../services/RequirementService";
import { formatDate, formatTimeAgo } from "../helpers/dateUtils";
import { navigateToDomainObjects } from "../helpers/navigationUtils";
import { showGlobalToast } from "../helpers/toastUtils";
import {
  ChevronLeft,
  ChevronRight,
  PDFIcon,
  TextIcon,
  RequirementEditIcon,
  RequirementDeleteIcon,
  CancelIcon,
} from "../helpers/icons";

interface RequirementsListProps {
  projectId: string;
}

const RequirementsList: React.FC<RequirementsListProps> = ({ projectId }) => {
  const [requirements, setRequirements] = useState<RequirementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRequirement, setSelectedRequirement] =
    useState<RequirementDto | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requirementToDelete, setRequirementToDelete] =
    useState<RequirementDto | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailEditData, setDetailEditData] = useState({
    title: "",
    description: "",
    sourceContent: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequirements();
  }, [projectId, currentPage]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      const response = await api.requirementService.getAllRequirements(
        projectId,
        currentPage
      );

      setRequirements(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching requirements:", err);
      setError("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequirement = (requirement: RequirementDto) => {
    setSelectedRequirement(requirement);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedRequirement(null);
    setIsEditingDetail(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    requirement: RequirementDto
  ) => {
    e.stopPropagation();
    setRequirementToDelete(requirement);
    setShowDeleteConfirm(true);
  };

  const handleDetailEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedRequirement) return;

    setDetailEditData({
      title: selectedRequirement.title,
      description: selectedRequirement.description || "",
      sourceContent: selectedRequirement.sourceContent || "",
    });
    setIsEditingDetail(true);
  };

  const handleSaveDetailEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedRequirement || !selectedRequirement.id) {
      console.error("Cannot edit: requirement ID is missing");
      setError("Failed to edit requirement: Missing requirement ID");
      setIsEditingDetail(false);
      return;
    }

    try {
      setIsSaving(true);
      setLoading(true);
      setError(null);
      const api = await createAuthenticatedRequest(currentUser);

      const updateData = {
        title: detailEditData.title.trim(),
        description: detailEditData.description,
        sourceType: selectedRequirement.sourceType,
        sourceContent: detailEditData.sourceContent,
        sourceFileUrl: selectedRequirement.sourceFileUrl,
      };

      await api.requirementService.updateRequirement(
        projectId,
        selectedRequirement.id,
        updateData
      );

      let updatedRequirementData;
      try {
        updatedRequirementData = await api.requirementService.getRequirement(
          projectId,
          selectedRequirement.id
        );
      } catch {
        console.log("Could not fetch updated requirement, will update locally");
      }

      setIsEditingDetail(false);

      if (updatedRequirementData) {
        setSelectedRequirement(updatedRequirementData);

        setRequirements(
          requirements.map((req) =>
            req.id === selectedRequirement.id ? updatedRequirementData : req
          )
        );
      } else {
        const updatedRequirement = {
          ...selectedRequirement,
          title: detailEditData.title.trim(),
          description: detailEditData.description,
          sourceContent: detailEditData.sourceContent,
        };
        setSelectedRequirement(updatedRequirement);

        setRequirements(
          requirements.map((req) =>
            req.id === selectedRequirement.id ? updatedRequirement : req
          )
        );
      }

      if (selectedRequirement.sourceContent !== detailEditData.sourceContent) {
        showGlobalToast(
          "warning",
          "Requirement content changed. You may want to recreate domain objects."
        );
      }
    } catch (err) {
      console.error("Failed to edit requirement:", err);
      setError("Failed to edit requirement");
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  const cancelDetailEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingDetail(false);
    setDetailEditData({
      title: "",
      description: "",
      sourceContent: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (!requirementToDelete || !requirementToDelete.id) {
      console.error("Cannot delete: requirement ID is missing");
      setError("Failed to delete requirement: Missing requirement ID");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      await api.requirementService.deleteRequirement(
        projectId,
        requirementToDelete.id
      );

      setShowDeleteConfirm(false);
      setRequirementToDelete(null);

      if (
        selectedRequirement &&
        selectedRequirement.id === requirementToDelete.id
      ) {
        setViewMode("list");
        setSelectedRequirement(null);
      }

      await fetchRequirements();
    } catch (err) {
      console.error("Failed to delete requirement:", err);
      setError("Failed to delete requirement");
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setRequirementToDelete(null);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    if (!isSaving) {
      cancelDetailEdit(e);
    }
  };

  const goToDomainObjects = () => {
    navigateToDomainObjects(navigate, projectId);
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
          onClick={() => handlePageChange(i)}
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
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>

          {showEllipsis && startPage > 0 && (
            <>
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(0)}
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
                onClick={() => handlePageChange(totalPages - 1)}
                aria-label="Last page"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            className={styles.pageNavButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    );
  };

  const renderRequirementDetail = () => {
    if (!selectedRequirement) return null;

    return (
      <div className={styles.requirementDetail}>
        <div className={styles.requirementActions}>
          <button className={styles.backButton} onClick={handleBackToList}>
            ← Back to Requirements
          </button>
          <div className={styles.actionIcons}>
            {!isEditingDetail ? (
              <>
                <RequirementEditIcon onClick={handleDetailEditClick} />
                <RequirementDeleteIcon
                  onClick={(e) => handleDeleteClick(e, selectedRequirement)}
                />
              </>
            ) : (
              <>
                <div
                  className={`${styles.saveIcon} ${
                    isSaving ? styles.saveIconDisabled : ""
                  }`}
                  onClick={!isSaving ? handleSaveDetailEdit : undefined}
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
                <CancelIcon onClick={handleCancelClick} />
              </>
            )}
          </div>
        </div>

        {error && isEditingDetail && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <div className={styles.requirementHeader}>
          {!isEditingDetail ? (
            <h3>{selectedRequirement.title}</h3>
          ) : (
            <input
              type="text"
              className={styles.titleInput}
              value={detailEditData.title}
              onChange={(e) =>
                setDetailEditData({
                  ...detailEditData,
                  title: e.target.value,
                })
              }
              placeholder="Enter requirement title"
              required
            />
          )}
          <div className={styles.requirementMeta}>
            <span>Created: {formatDate(selectedRequirement.createdAt)}</span>
            <span>Updated: {formatTimeAgo(selectedRequirement.updatedAt)}</span>
          </div>
        </div>

        <div className={styles.requirementSection}>
          <h4>Description</h4>
          {!isEditingDetail ? (
            <p>
              {selectedRequirement.description || (
                <em>No description provided.</em>
              )}
            </p>
          ) : (
            <textarea
              className={styles.descriptionTextarea}
              value={detailEditData.description}
              onChange={(e) =>
                setDetailEditData({
                  ...detailEditData,
                  description: e.target.value,
                })
              }
              placeholder="Enter requirement description"
            />
          )}
        </div>

        {selectedRequirement.sourceType === "TEXT" && (
          <div className={styles.requirementSection}>
            <h4>Content</h4>
            <div className={styles.sourceContent}>
              {!isEditingDetail ? (
                <pre>
                  {selectedRequirement.sourceContent || (
                    <em>No content provided.</em>
                  )}
                </pre>
              ) : (
                <textarea
                  className={styles.contentTextarea}
                  value={detailEditData.sourceContent}
                  onChange={(e) =>
                    setDetailEditData({
                      ...detailEditData,
                      sourceContent: e.target.value,
                    })
                  }
                />
              )}
            </div>
          </div>
        )}

        {selectedRequirement.sourceType === "PDF" && (
          <div className={styles.requirementSection}>
            <h4>Content</h4>
            {selectedRequirement.sourceFileUrl && (
              <a
                href={selectedRequirement.sourceFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fileLink}
              >
                View Original PDF
              </a>
            )}
            {selectedRequirement.sourceContent && (
              <div className={styles.sourceContent}>
                {selectedRequirement.sourceContent.startsWith("PDF:") ? (
                  <p className={styles.pdfPlaceholder}>
                    Text extraction not available for this PDF:{" "}
                    {selectedRequirement.sourceContent.substring(4).trim()}
                  </p>
                ) : !isEditingDetail ? (
                  <pre>{selectedRequirement.sourceContent}</pre>
                ) : (
                  <textarea
                    className={styles.contentTextarea}
                    value={detailEditData.sourceContent}
                    onChange={(e) =>
                      setDetailEditData({
                        ...detailEditData,
                        sourceContent: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            )}
            {!selectedRequirement.sourceContent &&
              !selectedRequirement.sourceFileUrl && (
                <div className={styles.sourceContent}>
                  <pre>
                    <em>No content provided.</em>
                  </pre>
                </div>
              )}
          </div>
        )}
      </div>
    );
  };

  const renderRequirementsList = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading requirements...</p>
        </div>
      );
    }

    if (error) {
      return <div className={styles.error}>{error}</div>;
    }

    if (requirements.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No requirements found for this project.</p>
          <p>
            Go to the{" "}
            <button
              onClick={goToDomainObjects}
              className={styles.domainObjectsButton}
            >
              Domain Objects
            </button>{" "}
            page to add requirements.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.requirementsList}>
          {requirements.map((requirement) => (
            <div
              key={requirement.id}
              className={styles.requirementCard}
              onClick={() => handleViewRequirement(requirement)}
            >
              <div className={styles.requirementCardHeader}>
                <h3>{requirement.title}</h3>
                <span
                  className={`${styles.requirementType} ${
                    requirement.sourceType === "PDF"
                      ? styles.pdfType
                      : styles.txtType
                  }`}
                >
                  {requirement.sourceType === "PDF" && <PDFIcon />}
                  {requirement.sourceType === "TEXT" && <TextIcon />}
                  {requirement.sourceType === "TEXT" ? "TXT" : "PDF"}
                </span>
              </div>

              {requirement.description && (
                <p className={styles.requirementDescription}>
                  {requirement.description.length > 100
                    ? `${requirement.description.substring(0, 100)}...`
                    : requirement.description}
                </p>
              )}

              <div className={styles.requirementCardFooter}>
                <span>Created: {formatDate(requirement.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {renderPagination()}
      </>
    );
  };

  return (
    <div className={styles.requirementsContainer}>
      <h2 className={styles.requirementsTitle}>Project Requirements</h2>

      {viewMode === "list" && renderRequirementsList()}
      {viewMode === "detail" && renderRequirementDetail()}

      {showDeleteConfirm &&
        requirementToDelete &&
        ReactDOM.createPortal(
          <div className={styles.modalOverlay}>
            <div className={styles.confirmDialog}>
              <h3>Delete Requirement?</h3>
              <p>
                Are you sure you wish to delete the requirement "
                {requirementToDelete.title}"? This action cannot be undone.
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
          </div>,
          document.body
        )}
    </div>
  );
};

export default RequirementsList;
