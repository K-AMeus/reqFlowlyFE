import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import styles from "../styles/DomainObjectUseCases.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { DomainObjectAttributeDto } from "../services/DomainObjectService";
import { UseCaseCreateResDto, UseCaseDto } from "../services/UseCaseService";
import {
  ChevronLeft,
  ChevronRight,
  RequirementEditIcon,
  RequirementDeleteIcon,
  SaveIcon,
  CancelIcon,
} from "../helpers/icons";
import { showGlobalToast } from "../helpers/toastUtils";

interface DomainObjectUseCasesProps {
  projectId: string;
  requirementId: string;
}

const DomainObjectUseCases: React.FC<DomainObjectUseCasesProps> = ({
  projectId,
  requirementId,
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
        await api.domainObjectService?.getDomainObjectsWithAttributesByRequirement(
          projectId,
          requirementId
        );

      const fetchedDomainObjects = response?.domainObjectsWithAttributes || {};
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
      if (!api.useCaseService) {
        throw new Error("Use Case Service not available.");
      }
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
        [domainObjectName]: response || [],
      }));

      if (response && response.length > 0) {
        showGlobalToast(
          "success",
          `Use cases for ${domainObjectName} generated and saved successfully!`
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

  const handleEditUseCaseClick = (useCase: UseCaseCreateResDto) => {
    setEditingUseCaseId(useCase.id);
    setEditUseCaseData({ name: useCase.name, content: useCase.content });
    setError(null);
  };

  const handleCancelEditUseCase = () => {
    setEditingUseCaseId(null);
    setEditUseCaseData({ name: "", content: "" });
  };

  const handleSaveUseCase = async () => {
    if (!editingUseCaseId || !currentDomainObjectName) return;

    setIsSavingUseCase(true);
    setError(null);
    try {
      const api = await createAuthenticatedRequest(currentUser);
      if (!api.useCaseService) {
        throw new Error("Use Case Service not available.");
      }
      const updatedUseCase = await api.useCaseService.updateUseCase(
        projectId,
        requirementId,
        editingUseCaseId,
        editUseCaseData
      );

      if (updatedUseCase) {
        setGeneratedUseCases((prev) => ({
          ...prev,
          [currentDomainObjectName]: (prev[currentDomainObjectName] || []).map(
            (uc) => (uc.id === editingUseCaseId ? updatedUseCase : uc)
          ),
        }));
      } else {
        console.warn("Update operation did not return a use case object.");
      }

      setEditingUseCaseId(null);
      showGlobalToast("success", "Use case updated successfully.");
    } catch (err) {
      console.error("Error updating use case:", err);
      setError(`Failed to update use case "${editUseCaseData.name}".`);
      showGlobalToast("error", "Failed to update use case.");
    } finally {
      setIsSavingUseCase(false);
    }
  };

  const handleDeleteUseCaseClick = (useCase: UseCaseCreateResDto) => {
    setUseCaseToDelete(useCase);
    setShowDeleteConfirm(true);
    setError(null);
  };

  const handleCancelDeleteUseCase = () => {
    setShowDeleteConfirm(false);
    setUseCaseToDelete(null);
  };

  const handleConfirmDeleteUseCase = async () => {
    if (!useCaseToDelete || !currentDomainObjectName) return;

    setDeleteLoading(true);
    setError(null);
    try {
      const api = await createAuthenticatedRequest(currentUser);
      if (!api.useCaseService) {
        throw new Error("Use Case Service not available.");
      }
      await api.useCaseService.deleteUseCase(
        projectId,
        requirementId,
        useCaseToDelete.id
      );

      setGeneratedUseCases((prev) => ({
        ...prev,
        [currentDomainObjectName]: (prev[currentDomainObjectName] || []).filter(
          (uc) => uc.id !== useCaseToDelete.id
        ),
      }));

      setShowDeleteConfirm(false);
      setUseCaseToDelete(null);
      showGlobalToast("success", "Use case deleted successfully.");
    } catch (err) {
      console.error("Error deleting use case:", err);
      setError(`Failed to delete use case "${useCaseToDelete.name}".`);
      showGlobalToast("error", "Failed to delete use case.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate(`/projects/${projectId}/use-cases/${requirementId}`);
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
          <ChevronLeft /> Back to Requirement Details
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
          <ChevronLeft /> Back
        </button>
      </div>

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
                          onClick={handleSaveUseCase}
                        />
                        <CancelIcon onClick={handleCancelEditUseCase} />
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
                  </div>
                ) : (
                  <>
                    <div className={styles.useCaseHeader}>
                      <h4>{useCase.name}</h4>
                      <div className={styles.useCaseActions}>
                        <RequirementEditIcon
                          onClick={() => handleEditUseCaseClick(useCase)}
                        />
                        <RequirementDeleteIcon
                          onClick={() => handleDeleteUseCaseClick(useCase)}
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

      {showDeleteConfirm &&
        useCaseToDelete &&
        ReactDOM.createPortal(
          <div className={styles.modalOverlay}>
            <div className={styles.confirmDialog}>
              <h3>Delete Use Case?</h3>
              <p>
                Are you sure you wish to delete the use case "
                <strong>{useCaseToDelete.name}</strong>"? This action cannot be
                undone.
              </p>
              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancelDeleteUseCase}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleConfirmDeleteUseCase}
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

export default DomainObjectUseCases;
