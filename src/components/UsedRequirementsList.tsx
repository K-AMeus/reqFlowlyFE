import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styles from "../styles/Requirements.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { RequirementDto } from "../services/RequirementService";
import { formatTimeAgo } from "../helpers/dateUtils";
import {
  ChevronLeft,
  ChevronRight,
  PDFIcon,
  TextIcon,
  RequirementEditIcon,
  RequirementDeleteIcon,
  SaveIcon,
  CancelIcon,
} from "../helpers/icons";
import { useNavigate, useParams } from "react-router-dom";
import DomainObjectsDetail from "./DomainObjectsDetail";
import { UseCaseCreateResDto, UseCaseDto } from "../services/UseCaseService";
import DomainObjectUseCases from "./DomainObjectUseCases";
import { showGlobalToast } from "../helpers/toastUtils";

interface UsedRequirementsListProps {
  projectId: string;
  onGeneratorStateChange?: (isActive: boolean) => void;
}

const UsedRequirementsList: React.FC<UsedRequirementsListProps> = ({
  projectId,
  onGeneratorStateChange,
}): React.ReactElement | null => {
  const [requirements, setRequirements] = useState<RequirementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRequirement, setSelectedRequirement] =
    useState<RequirementDto | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [fetchedUseCases, setFetchedUseCases] = useState<UseCaseCreateResDto[]>(
    []
  );
  const [loadingUseCases, setLoadingUseCases] = useState(false);
  const [errorUseCases, setErrorUseCases] = useState<string | null>(null);

  const [cachedDomainObjectNames, setCachedDomainObjectNames] = useState<
    Record<string, string[]>
  >({});
  const [cardLoadingStates, setCardLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [cardErrorStates, setCardErrorStates] = useState<
    Record<string, string | null>
  >({});

  const [showUseCaseGenerator, setShowUseCaseGenerator] = useState(false);

  const [editingUseCaseId, setEditingUseCaseId] = useState<string | null>(null);
  const [editUseCaseData, setEditUseCaseData] = useState<UseCaseDto>({
    name: "",
    content: "",
  });
  const [isSavingUseCase, setIsSavingUseCase] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [useCaseToDelete, setUseCaseToDelete] =
    useState<UseCaseCreateResDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { requirementId } = useParams<{ requirementId?: string }>();

  const fetchAndCacheNames = useCallback(
    async (requirementId: string) => {
      setCardLoadingStates((prev) => ({ ...prev, [requirementId]: true }));
      setCardErrorStates((prev) => ({ ...prev, [requirementId]: null }));

      try {
        const api = await createAuthenticatedRequest(currentUser);
        const response =
          await api.domainObjectService.getDomainObjectsWithAttributesByRequirement(
            projectId,
            requirementId
          );
        const fetchedNames = Object.keys(
          response.domainObjectsWithAttributes || {}
        );

        setCachedDomainObjectNames((prev) => ({
          ...prev,
          [requirementId]: fetchedNames,
        }));
      } catch (err) {
        console.error(
          `Error fetching domain objects for card ${requirementId}:`,
          err
        );
        setCardErrorStates((prev) => ({
          ...prev,
          [requirementId]: "Failed to load",
        }));
      } finally {
        setCardLoadingStates((prev) => ({ ...prev, [requirementId]: false }));
      }
    },
    [currentUser, projectId]
  );

  const fetchUseCases = useCallback(
    async (requirementId: string) => {
      setLoadingUseCases(true);
      setErrorUseCases(null);
      try {
        const api = await createAuthenticatedRequest(currentUser);
        const response = await api.useCaseService.getUseCases(
          projectId,
          requirementId
        );
        setFetchedUseCases(response);
      } catch (err) {
        console.error("Error fetching use cases:", err);
        setErrorUseCases("Failed to fetch use cases for this requirement");
      } finally {
        setLoadingUseCases(false);
      }
    },
    [currentUser, projectId]
  );

  const fetchUsedRequirements = useCallback(async () => {
    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      const response = await api.requirementService.getUsedRequirements(
        projectId,
        currentPage
      );

      setRequirements(response.content);
      setTotalPages(response.totalPages);

      if (
        requirementId &&
        !response.content.find((req) => req.id === requirementId) &&
        response.totalPages > 1
      ) {
        for (let page = 0; page < response.totalPages; page++) {
          if (page === currentPage) continue;

          const pageResponse = await api.requirementService.getUsedRequirements(
            projectId,
            page
          );

          const foundReq = pageResponse.content.find(
            (req) => req.id === requirementId
          );
          if (foundReq) {
            setCurrentPage(page);
            setRequirements(pageResponse.content);
            break;
          }
        }
      }
    } catch (err) {
      console.error("Error fetching used requirements:", err);
      setError("Failed to fetch requirements with domain objects");
    } finally {
      setLoading(false);
    }
  }, [projectId, currentPage, currentUser, requirementId]);

  useEffect(() => {
    fetchUsedRequirements();
  }, [fetchUsedRequirements]);

  useEffect(() => {
    if (requirementId && requirements.length > 0) {
      const selectedReq = requirements.find((req) => req.id === requirementId);
      if (selectedReq) {
        setSelectedRequirement(selectedReq);
        setViewMode("detail");
      }
    }
  }, [requirementId, requirements]);

  useEffect(() => {
    if (viewMode === "detail" && selectedRequirement) {
      fetchUseCases(selectedRequirement.id);
    } else {
      setFetchedUseCases([]);
      setErrorUseCases(null);
    }
  }, [viewMode, selectedRequirement]);

  useEffect(() => {
    requirements.forEach((req) => {
      if (!cachedDomainObjectNames[req.id] && !cardLoadingStates[req.id]) {
        fetchAndCacheNames(req.id);
      }
    });
  }, [
    requirements,
    cachedDomainObjectNames,
    cardLoadingStates,
    fetchAndCacheNames,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRequirementClick = (requirement: RequirementDto) => {
    if (showUseCaseGenerator && onGeneratorStateChange) {
      onGeneratorStateChange(false);
    }
    setShowUseCaseGenerator(false);
    setSelectedRequirement(requirement);
    setViewMode("detail");
    navigate(`/projects/${projectId}/use-cases/${requirement.id}`);
  };

  const handleBackToList = () => {
    if (showUseCaseGenerator && onGeneratorStateChange) {
      onGeneratorStateChange(false);
    }
    setShowUseCaseGenerator(false);
    setViewMode("list");
    setSelectedRequirement(null);
    navigate(`/projects/${projectId}/use-cases`);
  };

  const handleNavigateToGenerateUseCases = () => {
    setShowUseCaseGenerator(true);
    if (onGeneratorStateChange) {
      onGeneratorStateChange(true);
    }
  };

  const handleCloseUseCaseGenerator = () => {
    setShowUseCaseGenerator(false);
    if (onGeneratorStateChange) {
      onGeneratorStateChange(false);
    }
  };

  const handleEditExistingUseCaseClick = (useCase: UseCaseCreateResDto) => {
    setEditingUseCaseId(useCase.id);
    setEditUseCaseData({ name: useCase.name, content: useCase.content });
    setEditError(null);
  };

  const handleCancelEditExistingUseCase = () => {
    setEditingUseCaseId(null);
    setEditUseCaseData({ name: "", content: "" });
    setEditError(null);
  };

  const handleSaveExistingUseCase = async () => {
    if (!editingUseCaseId || !selectedRequirement) return;

    setIsSavingUseCase(true);
    setEditError(null);
    try {
      const api = await createAuthenticatedRequest(currentUser);
      const updatedUseCase = await api.useCaseService.updateUseCase(
        projectId,
        selectedRequirement.id,
        editingUseCaseId,
        editUseCaseData
      );

      setFetchedUseCases((prev) =>
        prev.map((uc) => (uc.id === editingUseCaseId ? updatedUseCase : uc))
      );

      setEditingUseCaseId(null);
      showGlobalToast("success", "Use case updated successfully.");
    } catch (err) {
      console.error("Error updating use case:", err);
      const errorMsg = `Failed to update use case "${editUseCaseData.name}".`;
      setEditError(errorMsg);
      showGlobalToast("error", "Failed to update use case.");
    } finally {
      setIsSavingUseCase(false);
    }
  };

  const handleDeleteExistingUseCaseClick = (useCase: UseCaseCreateResDto) => {
    setUseCaseToDelete(useCase);
    setShowDeleteConfirm(true);
    setEditError(null);
  };

  const handleCancelDeleteExistingUseCase = () => {
    setShowDeleteConfirm(false);
    setUseCaseToDelete(null);
  };

  const handleConfirmDeleteExistingUseCase = async () => {
    if (!useCaseToDelete || !selectedRequirement) return;

    setDeleteLoading(true);
    setEditError(null);
    try {
      const api = await createAuthenticatedRequest(currentUser);
      await api.useCaseService.deleteUseCase(
        projectId,
        selectedRequirement.id,
        useCaseToDelete.id
      );

      setFetchedUseCases((prev) =>
        prev.filter((uc) => uc.id !== useCaseToDelete.id)
      );

      setShowDeleteConfirm(false);
      setUseCaseToDelete(null);
      showGlobalToast("success", "Use case deleted successfully.");
    } catch (err) {
      console.error("Error deleting use case:", err);
      showGlobalToast(
        "error",
        `Failed to delete use case "${useCaseToDelete.name}".`
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const paginationItems = [];
    const maxButtonsToShow = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtonsToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxButtonsToShow - 1);

    if (endPage - startPage < maxButtonsToShow - 1) {
      startPage = Math.max(0, endPage - maxButtonsToShow + 1);
    }

    paginationItems.push(
      <button
        key="prev"
        className={`${styles.paginationButton} ${
          currentPage === 0 ? styles.paginationButtonDisabled : ""
        }`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <ChevronLeft />
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <button
          key={i}
          className={`${styles.paginationButton} ${
            i === currentPage ? styles.paginationButtonActive : ""
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i + 1}
        </button>
      );
    }

    paginationItems.push(
      <button
        key="next"
        className={`${styles.paginationButton} ${
          currentPage === totalPages - 1 ? styles.paginationButtonDisabled : ""
        }`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        <ChevronRight />
      </button>
    );

    return <div className={styles.pagination}>{paginationItems}</div>;
  };

  const renderRequirementDetail = () => {
    if (!selectedRequirement) return null;

    return (
      <div className={styles.requirementDetailView}>
        {!showUseCaseGenerator ? (
          <>
            <div className={styles.detailHeaderActions}>
              <button
                className={styles.actionButton}
                onClick={handleBackToList}
              >
                <ChevronLeft /> Back to Requirements
              </button>
              <button
                className={styles.actionButton}
                onClick={handleNavigateToGenerateUseCases}
              >
                Create Use Cases <ChevronRight />
              </button>
            </div>

            <div className={styles.requirementDetailHeader}>
              <div className={styles.requirementDetailMainContent}>
                <h2 className={styles.requirementDetailTitle}>
                  {selectedRequirement.title}
                </h2>
                {selectedRequirement.description && (
                  <p className={styles.requirementDescription}>
                    {selectedRequirement.description}
                  </p>
                )}
              </div>
            </div>

            <DomainObjectsDetail
              projectId={projectId}
              requirementId={selectedRequirement.id}
            />

            <div className={styles.useCasesSectionContainer}>
              <h3 className={styles.useCasesSectionTitle}>Use Cases</h3>
              {loadingUseCases ? (
                <div className={styles.useCasesLoading}>
                  <div className={styles.spinner}></div>
                  <p>Loading use cases...</p>
                </div>
              ) : errorUseCases ? (
                <div className={`${styles.error} ${styles.useCasesError}`}>
                  {errorUseCases}
                </div>
              ) : fetchedUseCases.length > 0 ? (
                <div className={styles.useCasesList}>
                  {fetchedUseCases.map((useCase) => (
                    <div key={useCase.id} className={styles.useCaseItem}>
                      {editingUseCaseId === useCase.id ? (
                        <div className={styles.useCaseEditForm}>
                          <div className={styles.editHeader}>
                            <input
                              type="text"
                              value={editUseCaseData.name}
                              onChange={(e) =>
                                setEditUseCaseData({
                                  ...editUseCaseData,
                                  name: e.target.value,
                                })
                              }
                              className={styles.editInputName}
                              placeholder="Use Case Name"
                            />
                            <div className={styles.editActions}>
                              <SaveIcon
                                isLoading={isSavingUseCase}
                                onClick={handleSaveExistingUseCase}
                              />
                              <CancelIcon
                                onClick={handleCancelEditExistingUseCase}
                              />
                            </div>
                          </div>
                          <textarea
                            value={editUseCaseData.content}
                            onChange={(e) =>
                              setEditUseCaseData({
                                ...editUseCaseData,
                                content: e.target.value,
                              })
                            }
                            className={styles.editInputContent}
                            placeholder="Use Case Content"
                            rows={6}
                          />
                          {editError && (
                            <div className={styles.editErrorMessage}>
                              {editError}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className={styles.useCaseHeader}>
                            <h4>{useCase.name}</h4>
                            <div className={styles.useCaseActions}>
                              <RequirementEditIcon
                                onClick={() =>
                                  handleEditExistingUseCaseClick(useCase)
                                }
                              />
                              <RequirementDeleteIcon
                                onClick={() =>
                                  handleDeleteExistingUseCaseClick(useCase)
                                }
                              />
                            </div>
                          </div>
                          <pre className={styles.useCaseContent}>
                            {useCase.content}
                          </pre>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noUseCasesMessage}>
                  No existing use cases found for this requirement.
                </p>
              )}
            </div>
          </>
        ) : (
          <DomainObjectUseCases
            projectId={projectId}
            requirementId={selectedRequirement.id}
            requirementTitle={selectedRequirement.title}
            onClose={handleCloseUseCaseGenerator}
          />
        )}
        {showDeleteConfirm &&
          useCaseToDelete &&
          ReactDOM.createPortal(
            <div className={styles.modalOverlay}>
              <div className={styles.confirmDialog}>
                <h3>Delete Use Case?</h3>
                <p>
                  Are you sure you wish to delete the use case "
                  <strong>{useCaseToDelete.name}</strong>"? This action cannot
                  be undone.
                </p>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancelDeleteExistingUseCase}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={handleConfirmDeleteExistingUseCase}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <span className={styles.buttonSpinnerSmall}></span>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  };

  const renderRequirementsList = () => {
    if (loading && requirements.length === 0) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading requirements...</p>
        </div>
      );
    }

    if (requirements.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No domain objects exists for use case creation.</p>
          <button
            className={styles.createButton}
            onClick={() => navigate(`/projects/${projectId}/domain-objects`)}
          >
            Create Domain Objects
          </button>
        </div>
      );
    }

    return (
      <>
        <div className={styles.requirementsGrid}>
          {requirements.map((requirement) => {
            const isLoadingNames = cardLoadingStates[requirement.id];
            const errorLoadingNames = cardErrorStates[requirement.id];
            const domainNames = cachedDomainObjectNames[requirement.id];
            const displayLimit = 3;

            return (
              <div
                key={requirement.id}
                className={styles.requirementCard}
                onClick={() => handleRequirementClick(requirement)}
              >
                <div className={styles.requirementCardHeader}>
                  <h3>{requirement.title}</h3>
                  <span
                    className={`${styles.requirementType} ${
                      styles.topRightType
                    } ${
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
                <div className={styles.requirementCardContent}>
                  {requirement.description ? (
                    <p className={styles.requirementDescription}>
                      {requirement.description}
                    </p>
                  ) : (
                    <p
                      className={`${styles.requirementDescription} ${styles.previewEmpty}`}
                    >
                      No description provided for this requirement
                    </p>
                  )}
                </div>

                <div className={styles.domainObjectPreview}>
                  {isLoadingNames && (
                    <div className={styles.previewSpinner}></div>
                  )}
                  {errorLoadingNames && (
                    <span className={styles.previewError}>!</span>
                  )}
                  {!isLoadingNames &&
                    !errorLoadingNames &&
                    domainNames &&
                    domainNames.length > 0 && (
                      <>
                        {domainNames.slice(0, displayLimit).map((name) => (
                          <span key={name} className={styles.previewTag}>
                            {name}
                          </span>
                        ))}
                        {domainNames.length > displayLimit && (
                          <span
                            className={`${styles.previewTag} ${styles.moreTag}`}
                          >
                            +{domainNames.length - displayLimit}
                          </span>
                        )}
                      </>
                    )}
                  {!isLoadingNames &&
                    !errorLoadingNames &&
                    domainNames?.length === 0 && (
                      <span className={styles.previewEmpty}>
                        No domain objects
                      </span>
                    )}
                </div>

                <div className={styles.requirementCardFooter}>
                  <div className={styles.requirementMeta}>
                    <span className={styles.requirementDateCard}>
                      <span className={styles.footerLabel}>Updated: </span>
                      {formatTimeAgo(requirement.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {renderPagination()}
      </>
    );
  };

  return (
    <div className={styles.requirementsContainer}>
      {viewMode === "list" ? (
        <>
          <div className={styles.requirementsHeader}>
            <h2>Use Cases</h2>
            <p className={styles.requirementsSubtitle}>
              List of domain objects that have been generated from requirements.
            </p>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {renderRequirementsList()}
        </>
      ) : (
        renderRequirementDetail()
      )}
    </div>
  );
};

export default UsedRequirementsList;
