import React, { useState, useEffect } from "react";
import styles from "../styles/Requirements.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { RequirementDto } from "../services/RequirementService";
import { formatTimeAgo } from "../helpers/dateUtils";
import { ChevronLeft, ChevronRight, PDFIcon, TextIcon } from "../helpers/icons";
import { useNavigate } from "react-router-dom";
import DomainObjectsDetail from "./DomainObjectsDetail";
import { UseCaseCreateResDto } from "../services/UseCaseService";

interface UsedRequirementsListProps {
  projectId: string;
}

const UsedRequirementsList: React.FC<UsedRequirementsListProps> = ({
  projectId,
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

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsedRequirements();
  }, [projectId, currentPage]);

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
  }, [requirements]);

  const fetchAndCacheNames = async (requirementId: string) => {
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
  };

  const fetchUsedRequirements = async () => {
    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      const response = await api.requirementService.getUsedRequirements(
        projectId,
        currentPage
      );

      setRequirements(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching used requirements:", err);
      setError("Failed to fetch requirements with domain objects");
    } finally {
      setLoading(false);
    }
  };

  const fetchUseCases = async (requirementId: string) => {
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
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRequirementClick = (requirement: RequirementDto) => {
    setSelectedRequirement(requirement);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedRequirement(null);
  };

  const handleNavigateToGenerateUseCases = () => {
    if (selectedRequirement) {
      navigate(
        `/projects/${projectId}/requirements/${selectedRequirement.id}/use-cases`
      );
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
        <div className={styles.detailHeaderActions}>
          <button className={styles.actionButton} onClick={handleBackToList}>
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

        <div className={styles.domainObjectsWrapper}>
          <DomainObjectsDetail
            projectId={projectId}
            requirementId={selectedRequirement.id}
            requirementTitle={selectedRequirement.title}
          />
        </div>

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
                  <h4>{useCase.name}</h4>
                  <pre className={styles.useCaseContent}>{useCase.content}</pre>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noUseCasesMessage}>
              No existing use cases found for this requirement.
            </p>
          )}
        </div>
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
                  <p className={styles.requirementDescription}>
                    {requirement.description ||
                      "No description provided for this requirement."}
                  </p>
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
            <h2>Domain Objects and Attributes</h2>
            <p className={styles.requirementsSubtitle}>
              List of requirements that have domain objects generated. Click on
              a requirement to view its details.
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
