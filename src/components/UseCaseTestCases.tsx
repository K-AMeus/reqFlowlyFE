import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styles from "../styles/DomainObjectUseCases.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { UseCaseCreateResDto } from "../services/UseCaseService";
import {
  TestCaseCreateReqDto,
  TestCaseCreateResDto,
  TestCaseDto,
} from "../services/TestCaseService";
import {
  ChevronLeft,
  ChevronRight,
  RequirementEditIcon,
  RequirementDeleteIcon,
  SaveIcon,
  CancelIcon,
} from "../helpers/icons";
import { showGlobalToast } from "../helpers/toastUtils";

interface UseCaseTestCasesProps {
  projectId: string;
  requirementId: string;
  initialUseCaseId: string;
  onClose: () => void;
}

const UseCaseTestCases: React.FC<UseCaseTestCasesProps> = ({
  projectId,
  requirementId,
  initialUseCaseId,
  onClose,
}) => {
  const [allUseCases, setAllUseCases] = useState<UseCaseCreateResDto[]>([]);
  const [currentUseCasePage, setCurrentUseCasePage] = useState(0);
  const [loadingUseCases, setLoadingUseCases] = useState(true);
  const [generatingTestCases, setGeneratingTestCases] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedTestCases, setGeneratedTestCases] = useState<
    Record<string, TestCaseCreateResDto[]>
  >({});
  const [loadingGeneratedTestCases, setLoadingGeneratedTestCases] =
    useState(false);
  const [errorGeneratedTestCases, setErrorGeneratedTestCases] = useState<
    string | null
  >(null);

  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(
    null
  );
  const [editTestCaseData, setEditTestCaseData] = useState<TestCaseDto>({
    name: "",
    content: "",
  });
  const [isSavingTestCase, setIsSavingTestCase] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] =
    useState<TestCaseCreateResDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { currentUser } = useAuth();

  const fetchAllUseCasesForRequirement = useCallback(async () => {
    setLoadingUseCases(true);
    setError(null);
    try {
      const services = await createAuthenticatedRequest(currentUser);
      if (!services?.useCaseService)
        throw new Error("Use Case Service not available");
      const response = await services.useCaseService.getUseCases(
        projectId,
        requirementId
      );
      setAllUseCases(response);
      const initialIndex = response.findIndex(
        (uc) => uc.id === initialUseCaseId
      );
      if (initialIndex !== -1) {
        setCurrentUseCasePage(initialIndex);
      } else if (response.length > 0) {
        setCurrentUseCasePage(0);
      }
      if (response.length > 0) {
        const currentUcId =
          initialIndex !== -1 ? response[initialIndex].id : response[0].id;
        fetchGeneratedTestCasesForUseCase(currentUcId);
      }
    } catch (err) {
      console.error("Error fetching use cases for requirement:", err);
      setError("Failed to fetch use cases.");
      showGlobalToast("error", "Failed to load use cases for the requirement.");
    } finally {
      setLoadingUseCases(false);
    }
  }, [currentUser, projectId, requirementId, initialUseCaseId]);

  const fetchGeneratedTestCasesForUseCase = useCallback(
    async (useCaseId: string) => {
      if (!useCaseId) return;
      setLoadingGeneratedTestCases(true);
      setErrorGeneratedTestCases(null);
      try {
        const services = await createAuthenticatedRequest(currentUser);
        if (!services?.testCaseService)
          throw new Error("Test Case Service not available");
        const response = await services.testCaseService.getTestCases(
          projectId,
          requirementId,
          useCaseId
        );
        setGeneratedTestCases((prev) => ({ ...prev, [useCaseId]: response }));
      } catch (err) {
        console.error(
          `Error fetching test cases for use case ${useCaseId}:`,
          err
        );
        setErrorGeneratedTestCases(
          "Failed to load test cases for this use case."
        );
      } finally {
        setLoadingGeneratedTestCases(false);
      }
    },
    [currentUser, projectId, requirementId]
  );

  useEffect(() => {
    fetchAllUseCasesForRequirement();
  }, [fetchAllUseCasesForRequirement]);

  useEffect(() => {
    if (allUseCases.length > 0 && allUseCases[currentUseCasePage]) {
      const currentUcId = allUseCases[currentUseCasePage].id;
      if (generatedTestCases[currentUcId] === undefined) {
        fetchGeneratedTestCasesForUseCase(currentUcId);
      }
    }
  }, [currentUseCasePage, allUseCases, fetchGeneratedTestCasesForUseCase]);

  const handleNextPage = () => {
    if (currentUseCasePage < allUseCases.length - 1) {
      setCurrentUseCasePage(currentUseCasePage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentUseCasePage > 0) {
      setCurrentUseCasePage(currentUseCasePage - 1);
    }
  };

  const currentSelectedUseCase =
    allUseCases.length > 0 ? allUseCases[currentUseCasePage] : null;
  const currentDisplayedTestCases = currentSelectedUseCase
    ? generatedTestCases[currentSelectedUseCase.id] || []
    : [];

  const handleGenerateTestCases = async () => {
    if (!currentSelectedUseCase || generatingTestCases) return;

    setGeneratingTestCases(true);
    setError(null);
    try {
      const services = await createAuthenticatedRequest(currentUser);
      if (!services?.testCaseService)
        throw new Error("Test Case Service not available");
      const reqDto: TestCaseCreateReqDto = {
        useCaseName: currentSelectedUseCase.name,
        useCaseContent: currentSelectedUseCase.content,
      };

      await services.testCaseService.createTestCases(
        projectId,
        requirementId,
        currentSelectedUseCase.id,
        reqDto
      );
      showGlobalToast(
        "success",
        `Test case generation initiated for ${currentSelectedUseCase.name}.`
      );
      fetchGeneratedTestCasesForUseCase(currentSelectedUseCase.id); // Re-fetch to get the new one + existing
    } catch (err) {
      console.error("Error generating test cases:", err);
      setError(
        `Failed to generate test cases for ${currentSelectedUseCase.name}`
      );
      showGlobalToast("error", `Failed to generate test cases.`);
    } finally {
      setGeneratingTestCases(false);
    }
  };

  const handleEditTestCaseClick = (testCase: TestCaseCreateResDto) => {
    setEditingTestCaseId(testCase.id);
    setEditTestCaseData({ name: testCase.name, content: testCase.content });
    setError(null);
  };

  const handleCancelEditTestCase = () => {
    setEditingTestCaseId(null);
    setEditTestCaseData({ name: "", content: "" });
  };

  const handleSaveTestCase = async () => {
    if (!editingTestCaseId || !currentSelectedUseCase) return;

    setIsSavingTestCase(true);
    setError(null);
    try {
      const services = await createAuthenticatedRequest(currentUser);
      if (!services?.testCaseService)
        throw new Error("Test Case Service not available");
      const updatedTestCase = await services.testCaseService.updateTestCase(
        projectId,
        requirementId,
        currentSelectedUseCase.id,
        editingTestCaseId,
        editTestCaseData
      );
      setGeneratedTestCases((prev) => ({
        ...prev,
        [currentSelectedUseCase.id]: (
          prev[currentSelectedUseCase.id] || []
        ).map((tc) => (tc.id === editingTestCaseId ? updatedTestCase : tc)),
      }));
      setEditingTestCaseId(null);
      showGlobalToast("success", "Test case updated successfully.");
    } catch (err) {
      console.error("Error updating test case:", err);
      setError(`Failed to update test case "${editTestCaseData.name}".`);
      showGlobalToast("error", "Failed to update test case.");
    } finally {
      setIsSavingTestCase(false);
    }
  };

  const handleDeleteTestCaseClick = (testCase: TestCaseCreateResDto) => {
    setTestCaseToDelete(testCase);
    setShowDeleteConfirm(true);
    setError(null);
  };

  const handleCancelDeleteTestCase = () => {
    setShowDeleteConfirm(false);
    setTestCaseToDelete(null);
  };

  const handleConfirmDeleteTestCase = async () => {
    if (!testCaseToDelete || !currentSelectedUseCase) return;

    setDeleteLoading(true);
    setError(null);
    try {
      const services = await createAuthenticatedRequest(currentUser);
      if (!services?.testCaseService)
        throw new Error("Test Case Service not available");
      await services.testCaseService.deleteTestCase(
        projectId,
        requirementId,
        currentSelectedUseCase.id,
        testCaseToDelete.id
      );
      setGeneratedTestCases((prev) => ({
        ...prev,
        [currentSelectedUseCase.id]: (
          prev[currentSelectedUseCase.id] || []
        ).filter((tc) => tc.id !== testCaseToDelete.id),
      }));
      setShowDeleteConfirm(false);
      setTestCaseToDelete(null);
      showGlobalToast("success", "Test case deleted successfully.");
    } catch (err) {
      console.error("Error deleting test case:", err);
      setError(`Failed to delete test case "${testCaseToDelete.name}".`);
      showGlobalToast("error", "Failed to delete test case.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loadingUseCases) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading use cases...</p>
      </div>
    );
  }

  if (!loadingUseCases && allUseCases.length === 0) {
    return (
      <div className={styles.domainObjectsUseCasesContainer}>
        <div className={styles.topActions}>
          <button className={styles.backButton} onClick={onClose}>
            <ChevronLeft /> Back
          </button>
        </div>
        <div className={styles.emptyState}>
          <p>
            No use cases found for this requirement to generate test cases from.
          </p>
        </div>
      </div>
    );
  }

  if (!currentSelectedUseCase) {
    return (
      <div className={styles.domainObjectsUseCasesContainer}>
        <div className={styles.topActions}>
          <button className={styles.backButton} onClick={onClose}>
            <ChevronLeft /> Back
          </button>
        </div>
        <div className={styles.error}>
          Could not determine the selected use case. Please go back.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.domainObjectsUseCasesContainer}>
      <div className={styles.topActions}>
        <button className={styles.backButton} onClick={onClose}>
          <ChevronLeft /> Back
        </button>
      </div>

      {currentSelectedUseCase && (
        <div className={styles.useCaseItem} style={{ marginBottom: "20px" }}>
          <div className={styles.useCaseHeader}>
            <h4>{currentSelectedUseCase.name}</h4>
          </div>
          <pre className={styles.useCaseContent}>
            {currentSelectedUseCase.content}
          </pre>
        </div>
      )}

      {allUseCases.length > 1 && (
        <div className={styles.pagination} style={{ marginBottom: "20px" }}>
          <button
            className={styles.paginationButton}
            onClick={handlePrevPage}
            disabled={currentUseCasePage === 0}
          >
            <ChevronLeft />
          </button>
          <span className={styles.pageIndicator}>
            Use Case {currentUseCasePage + 1} of {allUseCases.length}
          </span>
          <button
            className={styles.paginationButton}
            onClick={handleNextPage}
            disabled={currentUseCasePage === allUseCases.length - 1}
          >
            <ChevronRight />
          </button>
        </div>
      )}

      <div className={styles.generateButtonContainer}>
        <button
          className={styles.generateButton}
          onClick={handleGenerateTestCases}
          disabled={generatingTestCases || loadingGeneratedTestCases}
        >
          {generatingTestCases ? (
            <span className={styles.buttonSpinner}></span>
          ) : (
            "Generate Test Cases"
          )}
        </button>
      </div>

      {error && (
        <div className={`${styles.error} ${styles.generationError}`}>
          {error}
        </div>
      )}

      {loadingGeneratedTestCases && currentDisplayedTestCases.length === 0 && (
        <div className={styles.useCasesLoading}>
          <div className={styles.spinner}></div>
          <p>Loading test cases...</p>
        </div>
      )}
      {errorGeneratedTestCases && (
        <div className={`${styles.error} ${styles.useCasesError}`}>
          {errorGeneratedTestCases}
        </div>
      )}

      {!loadingGeneratedTestCases &&
        !errorGeneratedTestCases &&
        currentDisplayedTestCases.length > 0 && (
          <div className={styles.useCasesSection}>
            <h3>Generated Test Cases for {currentSelectedUseCase.name}</h3>
            <div className={styles.useCasesList}>
              {currentDisplayedTestCases.map((testCase) => (
                <div key={testCase.id} className={styles.useCaseItem}>
                  {editingTestCaseId === testCase.id ? (
                    <div className={styles.useCaseEditForm}>
                      <div className={styles.editHeader}>
                        <input
                          type="text"
                          value={editTestCaseData.name}
                          onChange={(e) =>
                            setEditTestCaseData({
                              ...editTestCaseData,
                              name: e.target.value,
                            })
                          }
                          className={styles.editInputName}
                          placeholder="Test Case Name"
                        />
                        <div className={styles.editActions}>
                          <SaveIcon
                            isLoading={isSavingTestCase}
                            onClick={handleSaveTestCase}
                          />
                          <CancelIcon onClick={handleCancelEditTestCase} />
                        </div>
                      </div>
                      <textarea
                        value={editTestCaseData.content}
                        onChange={(e) =>
                          setEditTestCaseData({
                            ...editTestCaseData,
                            content: e.target.value,
                          })
                        }
                        className={styles.editInputContent}
                        placeholder="Test Case Content"
                        rows={6}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={styles.useCaseHeader}>
                        <h4>{testCase.name}</h4>
                        <div className={styles.useCaseActions}>
                          <RequirementEditIcon
                            onClick={() => handleEditTestCaseClick(testCase)}
                          />
                          <RequirementDeleteIcon
                            onClick={() => handleDeleteTestCaseClick(testCase)}
                          />
                        </div>
                      </div>
                      <pre className={styles.useCaseContent}>
                        {testCase.content}
                      </pre>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      {!loadingGeneratedTestCases &&
        !errorGeneratedTestCases &&
        currentDisplayedTestCases.length === 0 &&
        !generatingTestCases && (
          <div
            className={styles.noUseCasesMessage}
            style={{ marginTop: "20px" }}
          >
            No test cases exist for this use case. Click "Generate Test Cases"
            to start.
          </div>
        )}

      {showDeleteConfirm &&
        testCaseToDelete &&
        ReactDOM.createPortal(
          <div className={styles.modalOverlay}>
            <div className={styles.confirmDialog}>
              <h3>Delete Test Case?</h3>
              <p>
                Are you sure you wish to delete the test case "
                <strong>{testCaseToDelete.name}</strong>"? This action cannot be
                undone.
              </p>
              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancelDeleteTestCase}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleConfirmDeleteTestCase}
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

export default UseCaseTestCases;
