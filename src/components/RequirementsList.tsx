import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import styles from "../styles/Requirements.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import {
  RequirementDto,
  RequirementService,
} from "../services/RequirementService";
import { formatTimeAgo } from "../helpers/dateUtils";
import { showGlobalToast } from "../helpers/toastUtils";
import {
  ChevronLeft,
  ChevronRight,
  PDFIcon,
  TextIcon,
  RequirementEditIcon,
  RequirementDeleteIcon,
  CancelIcon,
  SaveIcon,
} from "../helpers/icons";
import { useNavigate } from "react-router-dom";

interface RequirementsListProps {
  projectId: string;
  onRequirementSelect?: (requirement: RequirementDto | null) => void;
}

const RequirementsList: React.FC<RequirementsListProps> = ({
  projectId,
  onRequirementSelect,
}): React.ReactElement | null => {
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
  const [showAddRequirementModal, setShowAddRequirementModal] = useState(false);
  const [requirementType, setRequirementType] = useState<"TEXT" | "PDF">(
    "TEXT"
  );
  const [newRequirementData, setNewRequirementData] = useState({
    title: "",
    description: "",
    sourceContent: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >(null);

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
    if (isSelectMode) {
      handleSelectRequirement(requirement);
      return;
    }
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

      if (selectedRequirementId === requirementToDelete.id) {
        setSelectedRequirementId(null);
        if (onRequirementSelect) {
          onRequirementSelect(null);
        }
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

  const handleAddRequirementClick = () => {
    setShowAddRequirementModal(true);
    setRequirementType("TEXT");
    setNewRequirementData({
      title: "",
      description: "",
      sourceContent: "",
    });
    setSelectedFile(null);
    setFileUploadError(null);
  };

  const handleRequirementTypeChange = (type: "TEXT" | "PDF") => {
    setRequirementType(type);
    setFileUploadError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      if (file.type !== "application/pdf") {
        setFileUploadError("Only PDF files are supported");
        setSelectedFile(null);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setFileUploadError("File too large (max 10MB)");
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setFileUploadError(null);
    }
  };

  const handleAddRequirementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRequirementData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (requirementType === "PDF" && !selectedFile) {
      setFileUploadError("Please select a PDF file");
      return;
    }

    try {
      setIsSaving(true);
      setLoading(true);
      setError(null);

      const api = await createAuthenticatedRequest(currentUser);
      const requirementService = new RequirementService(api);

      if (requirementType === "TEXT") {
        await requirementService.createTextRequirement(projectId, {
          title: newRequirementData.title.trim(),
          description: newRequirementData.description,
          sourceType: "TEXT",
          sourceContent: newRequirementData.sourceContent,
        });
      } else if (requirementType === "PDF" && selectedFile) {
        const metadata = {
          title: newRequirementData.title.trim(),
          description: newRequirementData.description,
          sourceType: "PDF" as const,
          sourceContent: "",
          sourceFileUrl: "",
        };

        try {
          await requirementService.createPdfRequirement(
            projectId,
            metadata,
            selectedFile
          );
        } catch (err) {
          console.error("Error uploading PDF file via service:", err);
          throw new Error("Failed to upload PDF file");
        }
      }

      setShowAddRequirementModal(false);
      await fetchRequirements();
      showGlobalToast("success", "Requirement added successfully");
    } catch (err) {
      console.error("Failed to add requirement:", err);
      setError("Failed to add requirement");
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  const cancelAddRequirement = () => {
    setShowAddRequirementModal(false);
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedRequirementId(null);
      if (onRequirementSelect) {
        onRequirementSelect(null);
      }
    } else {
      setIsSelectMode(true);
    }
  };

  const handleSelectRequirement = (requirement: RequirementDto) => {
    if (selectedRequirementId === requirement.id) {
      setSelectedRequirementId(null);
      if (onRequirementSelect) {
        onRequirementSelect(null);
      }
    } else {
      setSelectedRequirementId(requirement.id);
      if (onRequirementSelect) {
        onRequirementSelect(requirement);
      }
    }
  };

  const handleCreateDomainObject = () => {
    const reqId =
      viewMode === "detail" ? selectedRequirement?.id : selectedRequirementId;

    if (reqId && projectId) {
      navigate(`/projects/${projectId}/domain-objects`, {
        state: { selectedRequirementId: reqId },
      });
    } else {
      console.warn(
        "Create domain object clicked without a selected requirement ID or project ID"
      );
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
        <div className={styles.detailHeaderActions}>
          <button className={styles.actionButton} onClick={handleBackToList}>
            <ChevronLeft /> Back to Requirements
          </button>
          <button
            className={styles.actionButton}
            onClick={handleCreateDomainObject}
          >
            Create Domain Objects <ChevronRight />
          </button>
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
                <SaveIcon isLoading={isSaving} onClick={handleSaveDetailEdit} />
                <CancelIcon onClick={handleCancelClick} />
              </>
            )}
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
          <p>No requirements exist for this project.</p>
          <p>Add your first requirement to get started.</p>
          <button
            className={styles.addRequirementButton}
            onClick={handleAddRequirementClick}
          >
            <span>+</span> Add Requirement
          </button>
        </div>
      );
    }

    return (
      <>
        <div className={styles.requirementsList}>
          {requirements.map((requirement) => (
            <div
              key={requirement.id}
              className={`${styles.requirementCard} ${
                isSelectMode && selectedRequirementId === requirement.id
                  ? styles.selectedRequirementCard
                  : ""
              }`}
              onClick={() => handleViewRequirement(requirement)}
              data-selectable={isSelectMode}
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
                <span className={styles.requirementDateCard}>
                  <span className={styles.footerLabel}>Updated: </span>
                  {formatTimeAgo(requirement.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {renderPagination()}
      </>
    );
  };

  return (
    <div
      className={styles.requirementsContainer}
      data-select-mode={isSelectMode}
      data-requirement-selected={
        isSelectMode && selectedRequirementId ? true : false
      }
    >
      <h2 className={styles.requirementsTitle}>
        Project Requirements
        {viewMode === "list" && requirements.length > 0 && (
          <div className={styles.headerButtons}>
            {!isSelectMode ? (
              <button
                className={styles.addRequirementButton}
                onClick={toggleSelectMode}
              >
                Select
              </button>
            ) : (
              <>
                <button
                  className={styles.selectCancelButton}
                  onClick={toggleSelectMode}
                >
                  Cancel
                </button>
                {selectedRequirementId && (
                  <button
                    className={styles.createDomainButton}
                    onClick={handleCreateDomainObject}
                  >
                    Create
                  </button>
                )}
              </>
            )}
            <button
              className={styles.addRequirementButton}
              onClick={handleAddRequirementClick}
              disabled={isSelectMode}
            >
              <span>+</span> Add Requirement
            </button>
          </div>
        )}
      </h2>

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
                  {loading ? (
                    <span className={styles.buttonSpinner}></span>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showAddRequirementModal &&
        ReactDOM.createPortal(
          <div className={styles.modalOverlay}>
            <form
              className={styles.formDialog}
              onSubmit={handleAddRequirementSubmit}
            >
              <h3>Add New Requirement</h3>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.requirementTypeSelector}>
                <button
                  type="button"
                  className={`${styles.typeOption} ${
                    requirementType === "TEXT" ? styles.activeType : ""
                  }`}
                  onClick={() => handleRequirementTypeChange("TEXT")}
                >
                  <TextIcon /> Text
                </button>
                <button
                  type="button"
                  className={`${styles.typeOption} ${
                    requirementType === "PDF" ? styles.activeType : ""
                  }`}
                  onClick={() => handleRequirementTypeChange("PDF")}
                >
                  <PDFIcon /> PDF
                </button>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  value={newRequirementData.title}
                  onChange={(e) =>
                    setNewRequirementData({
                      ...newRequirementData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter requirement title"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={newRequirementData.description}
                  onChange={(e) =>
                    setNewRequirementData({
                      ...newRequirementData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter requirement description"
                />
              </div>

              {requirementType === "TEXT" ? (
                <div className={styles.formGroup}>
                  <label htmlFor="content">Content</label>
                  <textarea
                    id="content"
                    className={styles.contentInput}
                    value={newRequirementData.sourceContent}
                    onChange={(e) =>
                      setNewRequirementData({
                        ...newRequirementData,
                        sourceContent: e.target.value,
                      })
                    }
                    placeholder="Enter requirement content"
                  />
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label htmlFor="file">PDF File *</label>
                  <div className={styles.fileUploadContainer}>
                    <input
                      type="file"
                      id="file"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                      disabled={isSaving}
                    />
                    <div
                      className={`${styles.fileUploadBox} ${
                        isSaving ? styles.fileUploadBoxDisabled : ""
                      }`}
                    >
                      {selectedFile ? (
                        <div className={styles.selectedFile}>
                          <PDFIcon /> {selectedFile.name}
                        </div>
                      ) : (
                        <div className={styles.fileUploadPrompt}>
                          <span>Click to select or drop a PDF file here</span>
                          <span className={styles.fileLimit}>(Max 10MB)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {fileUploadError && (
                    <div className={styles.fileError}>{fileUploadError}</div>
                  )}
                </div>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelAddRequirement}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={
                    isSaving || (requirementType === "PDF" && !selectedFile)
                  }
                >
                  {isSaving ? (
                    <span className={styles.buttonSpinner}></span>
                  ) : (
                    "Add Requirement"
                  )}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
};

export default RequirementsList;
