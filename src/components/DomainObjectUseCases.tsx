import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/DomainObjectUseCases.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { DomainObjectAttributeDto } from "../services/DomainObjectService";
import { UseCaseCreateResDto } from "../services/UseCaseService";
import { ChevronLeft, ChevronRight } from "../helpers/icons";
import { showGlobalToast } from "../helpers/toastUtils";

interface DomainObjectUseCasesProps {
  projectId: string;
  requirementId: string;
  requirementTitle?: string;
}

const DomainObjectUseCases: React.FC<DomainObjectUseCasesProps> = ({
  projectId,
  requirementId,
  requirementTitle,
}) => {
  const [domainObjects, setDomainObjects] = useState<
    Record<string, DomainObjectAttributeDto[]>
  >({});
  const [domainObjectNames, setDomainObjectNames] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatingUseCases, setGeneratingUseCases] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUseCases, setGeneratedUseCases] = useState<
    Record<string, UseCaseCreateResDto[]>
  >({});

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId && requirementId) {
      fetchDomainObjects();
    }
    setGeneratedUseCases({});
    setCurrentPage(0);
  }, [projectId, requirementId]);

  const fetchDomainObjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = await createAuthenticatedRequest(currentUser);
      const response =
        await api.domainObjectService.getDomainObjectsWithAttributesByRequirement(
          projectId,
          requirementId
        );

      const fetchedDomainObjects = response.domainObjectsWithAttributes || {};
      setDomainObjects(fetchedDomainObjects);
      setDomainObjectNames(Object.keys(fetchedDomainObjects));
    } catch (err) {
      console.error("Error fetching domain objects:", err);
      setError("Failed to fetch domain objects for this requirement");
      showGlobalToast("error", "Failed to fetch domain objects");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < domainObjectNames.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleGenerateUseCases = async () => {
    if (
      domainObjectNames.length === 0 ||
      currentPage >= domainObjectNames.length ||
      generatingUseCases
    ) {
      return;
    }

    const domainObjectName = domainObjectNames[currentPage];
    const attributes = domainObjects[domainObjectName].map((attr) => attr.name);

    try {
      setGeneratingUseCases(true);
      setError(null);
      setGeneratedUseCases((prev) => ({ ...prev, [domainObjectName]: [] }));

      const api = await createAuthenticatedRequest(currentUser);
      const response = await api.useCaseService.generateUseCases(
        projectId,
        requirementId,
        {
          domainObject: domainObjectName,
          attributes: attributes,
        }
      );

      setGeneratedUseCases((prev) => ({
        ...prev,
        [domainObjectName]: response,
      }));

      if (response.length > 0) {
        showGlobalToast(
          "success",
          `Use cases for ${domainObjectName} generated successfully!`
        );
      } else {
        showGlobalToast(
          "warning",
          `No use cases were generated for ${domainObjectName}.`
        );
      }
    } catch (err) {
      console.error("Error generating use cases:", err);
      setError(`Failed to generate use cases for ${domainObjectName}`);
      showGlobalToast(
        "error",
        `Failed to generate use cases for ${domainObjectName}`
      );
    } finally {
      setGeneratingUseCases(false);
    }
  };

  const handleBackToList = () => {
    navigate(`/projects/${projectId}/use-cases`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading domain objects...</p>
      </div>
    );
  }

  if (error && domainObjectNames.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  if (domainObjectNames.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No domain objects found for this requirement.</p>
        <button className={styles.backButton} onClick={handleBackToList}>
          <ChevronLeft /> Back to Requirements List
        </button>
      </div>
    );
  }

  const currentDomainObjectName = domainObjectNames[currentPage];
  const currentAttributes = domainObjects[currentDomainObjectName] || [];
  const currentUseCases = generatedUseCases[currentDomainObjectName] || [];

  return (
    <div className={styles.domainObjectsUseCasesContainer}>
      <div className={styles.topActions}>
        <button className={styles.backButton} onClick={handleBackToList}>
          <ChevronLeft /> Back to Requirements List
        </button>
      </div>

      {requirementTitle && (
        <div className={styles.requirementContext}>
          Requirement: {requirementTitle}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.domainObjectTable}>
          <thead>
            <tr>
              <th>Domain Object</th>
              <th>Attributes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.domainNameCell}>
                {currentDomainObjectName}
              </td>
              <td className={styles.attributesCell}>
                <div className={styles.attributesList}>
                  {currentAttributes.length > 0 ? (
                    currentAttributes.map((attribute) => (
                      <span key={attribute.id} className={styles.attributeTag}>
                        {attribute.name}
                      </span>
                    ))
                  ) : (
                    <span className={styles.noAttributes}>
                      No attributes found
                    </span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.generateButtonContainer}>
        <button
          className={styles.generateButton}
          onClick={handleGenerateUseCases}
          disabled={generatingUseCases || currentAttributes.length === 0}
        >
          {generatingUseCases ? (
            <span className={styles.buttonSpinner}></span>
          ) : (
            "Generate Use Cases"
          )}
        </button>
        {currentAttributes.length === 0 && (
          <p className={styles.generateDisabledReason}>
            Cannot generate use cases without attributes.
          </p>
        )}
      </div>

      {error && domainObjectNames.length > 0 && (
        <div className={`${styles.error} ${styles.generationError}`}>
          {error}
        </div>
      )}

      {currentUseCases.length > 0 && (
        <div className={styles.useCasesSection}>
          <h3>Generated Use Cases for {currentDomainObjectName}</h3>
          <div className={styles.useCasesList}>
            {currentUseCases.map((useCase) => (
              <div key={useCase.id} className={styles.useCaseItem}>
                <h4>{useCase.name}</h4>
                <pre className={styles.useCaseContent}>{useCase.content}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {domainObjectNames.length > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft />
          </button>
          <span className={styles.pageIndicator}>
            {currentPage + 1} of {domainObjectNames.length}
          </span>
          <button
            className={styles.paginationButton}
            onClick={handleNextPage}
            disabled={currentPage === domainObjectNames.length - 1}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default DomainObjectUseCases;
