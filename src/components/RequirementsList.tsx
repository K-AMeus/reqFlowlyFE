import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "../styles/Requirements.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { RequirementDto } from "../services/RequirementService";
import { formatDate, formatTimeAgo } from "../helpers/dateUtils";
import {
  ChevronLeft,
  ChevronRight,
  PDFIcon,
  TextIcon,
  RequirementEditIcon,
  RequirementDeleteIcon,
  RequirementContentEditIcon,
  SaveIcon,
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requirementToEdit, setRequirementToEdit] =
    useState<RequirementDto | null>(null);
  const [requirementToDelete, setRequirementToDelete] =
    useState<RequirementDto | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
  });
  const [editingContent, setEditingContent] = useState(false);
  const [contentEditData, setContentEditData] = useState("");

  const { currentUser } = useAuth();

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
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditClick = (
    e: React.MouseEvent,
    requirement: RequirementDto
  ) => {
    e.stopPropagation();
    setRequirementToEdit(requirement);
    setEditFormData({
      title: requirement.title,
      description: requirement.description || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    requirement: RequirementDto
  ) => {
    e.stopPropagation();
    setRequirementToDelete(requirement);
    setShowDeleteConfirm(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requirementToEdit || !requirementToEdit.id) {
      console.error("Cannot edit: requirement ID is missing");
      setError("Failed to edit requirement: Missing requirement ID");
      setShowEditModal(false);
      return;
    }

    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);

      const updateData = {
        title: editFormData.title,
        description: editFormData.description,
        sourceType: requirementToEdit.sourceType,
        sourceContent: requirementToEdit.sourceContent,
        sourceFileUrl: requirementToEdit.sourceFileUrl,
      };

      await api.requirementService.updateRequirement(
        projectId,
        requirementToEdit.id,
        updateData
      );

      let updatedRequirementData;
      try {
        updatedRequirementData = await api.requirementService.getRequirement(
          projectId,
          requirementToEdit.id
        );
      } catch {
        console.log(
          "Could not fetch updated requirement, will refresh list instead"
        );
        await fetchRequirements();
      }

      setShowEditModal(false);
      setRequirementToEdit(null);

      if (updatedRequirementData) {
        if (
          selectedRequirement &&
          selectedRequirement.id === requirementToEdit.id
        ) {
          setSelectedRequirement(updatedRequirementData);
        }

        setRequirements(
          requirements.map((req) =>
            req.id === requirementToEdit.id ? updatedRequirementData : req
          )
        );
      } else {
        if (
          selectedRequirement &&
          selectedRequirement.id === requirementToEdit.id
        ) {
          const updatedRequirement = {
            ...selectedRequirement,
            title: editFormData.title,
            description: editFormData.description,
          };
          setSelectedRequirement(updatedRequirement);
        }

        await fetchRequirements();
      }
    } catch (err) {
      console.error("Failed to edit requirement:", err);
      setError("Failed to edit requirement");
    } finally {
      setLoading(false);
    }
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

  const cancelEdit = () => {
    setShowEditModal(false);
    setRequirementToEdit(null);
    setEditFormData({ title: "", description: "" });
  };

  const handleContentEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedRequirement) return;

    setContentEditData(selectedRequirement.sourceContent || "");
    setEditingContent(true);
  };

  const handleSaveContent = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!selectedRequirement || !selectedRequirement.id) {
      console.error("Cannot edit content: requirement ID is missing");
      setError("Failed to edit content: Missing requirement ID");
      setEditingContent(false);
      return;
    }

    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);

      const updateData = {
        title: selectedRequirement.title,
        description: selectedRequirement.description,
        sourceType: selectedRequirement.sourceType,
        sourceContent: contentEditData,
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

      setEditingContent(false);

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
          sourceContent: contentEditData,
        };
        setSelectedRequirement(updatedRequirement);

        setRequirements(
          requirements.map((req) =>
            req.id === selectedRequirement.id ? updatedRequirement : req
          )
        );
      }
    } catch (err) {
      console.error("Failed to edit content:", err);
      setError("Failed to edit content");
    } finally {
      setLoading(false);
    }
  };

  const cancelContentEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContent(false);
    setContentEditData("");
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
            <RequirementEditIcon
              onClick={(e) => handleEditClick(e, selectedRequirement)}
            />
            <RequirementDeleteIcon
              onClick={(e) => handleDeleteClick(e, selectedRequirement)}
            />
          </div>
        </div>

        <div className={styles.requirementHeader}>
          <h3>{selectedRequirement.title}</h3>
          <div className={styles.requirementMeta}>
            <span>Created: {formatDate(selectedRequirement.createdAt)}</span>
            <span>Updated: {formatTimeAgo(selectedRequirement.updatedAt)}</span>
          </div>
        </div>

        {selectedRequirement.description && (
          <div className={styles.requirementSection}>
            <h4>Description</h4>
            <p>{selectedRequirement.description}</p>
          </div>
        )}

        {selectedRequirement.sourceType === "TEXT" &&
          selectedRequirement.sourceContent && (
            <div className={styles.requirementSection}>
              <div className={styles.contentHeading}>
                <h4>Content</h4>
                {!editingContent && (
                  <RequirementContentEditIcon
                    onClick={handleContentEditClick}
                  />
                )}
                {editingContent && (
                  <div className={styles.contentActions}>
                    <SaveIcon onClick={handleSaveContent} />
                    <CancelIcon onClick={cancelContentEdit} />
                  </div>
                )}
              </div>
              <div className={styles.sourceContent}>
                {editingContent ? (
                  <textarea
                    className={styles.contentTextarea}
                    value={contentEditData}
                    onChange={(e) => setContentEditData(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <pre>{selectedRequirement.sourceContent}</pre>
                )}
              </div>
            </div>
          )}

        {selectedRequirement.sourceType === "PDF" && (
          <div className={styles.requirementSection}>
            <div className={styles.contentHeading}>
              <h4>Content</h4>
              {!editingContent &&
                selectedRequirement.sourceContent &&
                !selectedRequirement.sourceContent.startsWith("PDF:") && (
                  <RequirementContentEditIcon
                    onClick={handleContentEditClick}
                  />
                )}
              {editingContent && (
                <div className={styles.contentActions}>
                  <SaveIcon onClick={handleSaveContent} />
                  <CancelIcon onClick={cancelContentEdit} />
                </div>
              )}
            </div>
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
                ) : editingContent ? (
                  <textarea
                    className={styles.contentTextarea}
                    value={contentEditData}
                    onChange={(e) => setContentEditData(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <pre>{selectedRequirement.sourceContent}</pre>
                )}
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
          <p>Go to the Domain Objects page to add requirements.</p>
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

      {showEditModal &&
        requirementToEdit &&
        ReactDOM.createPortal(
          <div className={styles.modalOverlay}>
            <div className={styles.formDialog}>
              <h3>Edit Requirement</h3>
              <form onSubmit={handleSaveEdit}>
                <div className={styles.formGroup}>
                  <label htmlFor="editTitle">Requirement Title</label>
                  <input
                    type="text"
                    id="editTitle"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        title: e.target.value,
                      })
                    }
                    placeholder="Enter requirement title"
                    required
                    maxLength={255}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="editDescription">
                    Description (Optional)
                  </label>
                  <textarea
                    id="editDescription"
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter requirement description"
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
          </div>,
          document.body
        )}

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
