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
  RequirementEditIcon,
  RequirementDeleteIcon,
  SaveIcon,
  CancelIcon,
} from "../helpers/icons";
import { useNavigate, useParams } from "react-router-dom";
import DomainObjectsDetail from "./DomainObjectsDetail";
import { UseCaseCreateResDto, UseCaseDto } from "../services/UseCaseService";
import { TestCaseCreateResDto, TestCaseDto } from "../services/TestCaseService";
import { showGlobalToast } from "../helpers/toastUtils";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileWord } from "@fortawesome/free-solid-svg-icons";

interface UsedRequirementsListProps {
  projectId: string;
  onPageChange: (page: string, requirementId?: string) => void;
}

const UsedRequirementsList: React.FC<UsedRequirementsListProps> = ({
  projectId,
  onPageChange,
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

  const [activeUseCaseTabs, setActiveUseCaseTabs] = useState<
    Record<string, "details" | "testCases">
  >({});

  const [fetchedTestCases, setFetchedTestCases] = useState<
    Record<string, TestCaseCreateResDto[]>
  >({});
  const [loadingTestCases, setLoadingTestCases] = useState<
    Record<string, boolean>
  >({});
  const [errorTestCases, setErrorTestCases] = useState<
    Record<string, string | null>
  >({});

  const [testCaseTargetedForDeletion, setTestCaseTargetedForDeletion] =
    useState<(TestCaseCreateResDto & { parentUseCaseId: string }) | null>(null);

  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(
    null
  );
  const [
    currentEditingUseCaseIdForTestCase,
    setCurrentEditingUseCaseIdForTestCase,
  ] = useState<string | null>(null);
  const [editTestCaseData, setEditTestCaseData] = useState<TestCaseDto>({
    name: "",
    content: "",
  });
  const [isSavingTestCase, setIsSavingTestCase] = useState(false);
  const [editTestCaseError, setEditTestCaseError] = useState<string | null>(
    null
  );

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
          await api.domainObjectService?.getDomainObjectsWithAttributesByRequirement(
            projectId,
            requirementId
          );
        const fetchedNames = Object.keys(
          response?.domainObjectsWithAttributes || {}
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
        if (!api.useCaseService) {
          throw new Error("Use Case Service not available");
        }
        const response = await api.useCaseService?.getUseCases(
          projectId,
          requirementId
        );
        setFetchedUseCases(response || []);
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
      const response = await api.requirementService?.getUsedRequirements(
        projectId,
        currentPage
      );

      setRequirements(response?.content || []);
      setTotalPages(response?.totalPages || 0);

      if (
        requirementId &&
        !(response?.content || []).find((req) => req.id === requirementId) &&
        (response?.totalPages || 0) > 1
      ) {
        for (let page = 0; page < (response?.totalPages || 0); page++) {
          if (page === currentPage) continue;

          const pageResponse =
            await api.requirementService?.getUsedRequirements(projectId, page);

          const foundReq = (pageResponse?.content || []).find(
            (req) => req.id === requirementId
          );
          if (foundReq) {
            setCurrentPage(page);
            setRequirements(pageResponse?.content || []);
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
    } else if (!requirementId) {
      setViewMode("list");
      setSelectedRequirement(null);
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

  useEffect(() => {
    if (viewMode === "detail" && fetchedUseCases.length > 0) {
      const newTabsState = { ...activeUseCaseTabs };
      let changed = false;
      fetchedUseCases.forEach((uc) => {
        if (newTabsState[uc.id] === undefined) {
          newTabsState[uc.id] = "details";
          changed = true;
        }
      });
      if (changed) {
        setActiveUseCaseTabs(newTabsState);
      }
    }
  }, [viewMode, fetchedUseCases, activeUseCaseTabs]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRequirementClick = (requirement: RequirementDto) => {
    navigate(`/projects/${projectId}/use-cases/${requirement.id}`);
  };

  const handleBackToList = () => {
    navigate(`/projects/${projectId}/use-cases`);
  };

  const handleEditExistingUseCaseClick = (useCase: UseCaseCreateResDto) => {
    setEditingUseCaseId(useCase.id);
    setEditUseCaseData({ name: useCase.name, content: useCase.content });
    setEditError(null);
    handleCancelEditExistingTestCase();
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
      if (!api.useCaseService) {
        throw new Error("Use Case Service not available");
      }
      const updatedUseCase = await api.useCaseService?.updateUseCase(
        projectId,
        selectedRequirement.id,
        editingUseCaseId,
        editUseCaseData
      );

      setFetchedUseCases((prev) =>
        prev.map((uc) =>
          uc.id === editingUseCaseId && updatedUseCase ? updatedUseCase : uc
        )
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
      if (!api.useCaseService) {
        throw new Error("Use Case Service not available");
      }
      await api.useCaseService?.deleteUseCase(
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
    } catch (err: unknown) {
      console.error("Error deleting use case:", err);

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "status" in err.response &&
        err.response.status === 403
      ) {
        showGlobalToast(
          "error",
          `Cannot delete use case "${useCaseToDelete.name}" because it has associated test cases. Please delete test cases first.`
        );
      } else {
        showGlobalToast(
          "error",
          `Failed to delete use case "${useCaseToDelete.name}".`
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchTestCasesForUseCase = useCallback(
    async (useCaseId: string) => {
      if (!selectedRequirement) return;

      setLoadingTestCases((prev) => ({ ...prev, [useCaseId]: true }));
      setErrorTestCases((prev) => ({ ...prev, [useCaseId]: null }));

      try {
        const api = await createAuthenticatedRequest(currentUser);
        if (!api.testCaseService) {
          throw new Error("Test Case Service not available");
        }
        const response = await api.testCaseService?.getTestCases(
          projectId,
          selectedRequirement.id,
          useCaseId
        );
        setFetchedTestCases((prev) => ({
          ...prev,
          [useCaseId]: response || [],
        }));
      } catch (err) {
        console.error(
          `Error fetching test cases for use case ${useCaseId}:`,
          err
        );
        setErrorTestCases((prev) => ({
          ...prev,
          [useCaseId]: "Failed to fetch test cases",
        }));
      } finally {
        setLoadingTestCases((prev) => ({ ...prev, [useCaseId]: false }));
      }
    },
    [currentUser, projectId, selectedRequirement]
  );

  const handleTabChange = (useCaseId: string, tab: "details" | "testCases") => {
    setActiveUseCaseTabs((prev) => ({ ...prev, [useCaseId]: tab }));
    setTestCaseTargetedForDeletion(null);
    if (editingTestCaseId && currentEditingUseCaseIdForTestCase === useCaseId) {
      handleCancelEditExistingTestCase();
    }
    if (tab === "details") {
      setEditingTestCaseId(null);
    }
    if (
      tab === "testCases" &&
      !fetchedTestCases[useCaseId] &&
      !loadingTestCases[useCaseId] &&
      !errorTestCases[useCaseId]
    ) {
      fetchTestCasesForUseCase(useCaseId);
    }
  };

  const handleEditExistingTestCaseClick = (
    useCaseId: string,
    testCase: TestCaseCreateResDto
  ) => {
    setEditingTestCaseId(testCase.id);
    setCurrentEditingUseCaseIdForTestCase(useCaseId);
    setEditTestCaseData({ name: testCase.name, content: testCase.content });
    setEditTestCaseError(null);
    setEditingUseCaseId(null);
  };

  const handleCancelEditExistingTestCase = () => {
    setEditingTestCaseId(null);
    setCurrentEditingUseCaseIdForTestCase(null);
    setEditTestCaseData({ name: "", content: "" });
    setEditTestCaseError(null);
  };

  const handleSaveExistingTestCase = async () => {
    if (
      !editingTestCaseId ||
      !currentEditingUseCaseIdForTestCase ||
      !selectedRequirement
    ) {
      setEditTestCaseError("Failed to save: Missing critical data.");
      return;
    }

    setIsSavingTestCase(true);
    setEditTestCaseError(null);

    try {
      const api = await createAuthenticatedRequest(currentUser);
      if (!api.testCaseService) {
        throw new Error("Test Case Service not available");
      }
      const updatedTestCase = await api.testCaseService?.updateTestCase(
        projectId,
        selectedRequirement.id,
        currentEditingUseCaseIdForTestCase,
        editingTestCaseId,
        editTestCaseData
      );

      if (updatedTestCase) {
        setFetchedTestCases((prev) => ({
          ...prev,
          [currentEditingUseCaseIdForTestCase]: prev[
            currentEditingUseCaseIdForTestCase!
          ]
            ? prev[currentEditingUseCaseIdForTestCase!].map((tc) =>
                tc.id === updatedTestCase.id ? updatedTestCase : tc
              )
            : [updatedTestCase],
        }));
      }
      showGlobalToast(
        "success",
        `Test case "${editTestCaseData.name}" updated.`
      );
      handleCancelEditExistingTestCase();
    } catch (err) {
      console.error("Error updating test case:", err);
      const errorMsg = `Failed to update test case "${editTestCaseData.name}".`;
      setEditTestCaseError(errorMsg);
      showGlobalToast("error", errorMsg);
    } finally {
      setIsSavingTestCase(false);
    }
  };

  const handleCancelDeleteExistingTestCase = () => {
    setShowDeleteConfirm(false);
    setTestCaseTargetedForDeletion(null);
  };

  const handleConfirmDeleteExistingTestCase = async () => {
    if (!testCaseTargetedForDeletion || !selectedRequirement) return;

    setDeleteLoading(true);
    const {
      parentUseCaseId,
      id: testCaseId,
      name,
    } = testCaseTargetedForDeletion;

    try {
      const api = await createAuthenticatedRequest(currentUser);
      if (!api.testCaseService) {
        throw new Error("Test Case Service not available");
      }
      await api.testCaseService?.deleteTestCase(
        projectId,
        selectedRequirement.id,
        parentUseCaseId,
        testCaseId
      );

      setFetchedTestCases((prev) => ({
        ...prev,
        [parentUseCaseId]:
          prev[parentUseCaseId]?.filter((tc) => tc.id !== testCaseId) || [],
      }));

      showGlobalToast("success", `Test case "${name}" deleted successfully.`);
      handleCancelDeleteExistingTestCase();
    } catch (err) {
      console.error(`Failed to delete test case ${testCaseId}:`, err);
      showGlobalToast("error", `Failed to delete test case "${name}".`);
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
        <>
          <div className={styles.detailHeaderActions}>
            <button className={styles.actionButton} onClick={handleBackToList}>
              <ChevronLeft /> Back to Requirements
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                console.log(
                  "Navigating to Export Page from UsedRequirementsList:"
                );
                console.log("Project ID:", projectId);
                console.log("Requirement ID:", selectedRequirement.id);
                onPageChange("export", selectedRequirement.id);
              }}
            >
              Export Document <ChevronRight />
            </button>
          </div>

          <div className={styles.useCasesContent}>
            <h3 className={styles.useCasesSectionTitle}>Requirement Info</h3>
            <div className={styles.requirementDetailHeader}>
              <div className={styles.requirementDetailMainContent}>
                <h2 className={styles.requirementDetailTitle}>
                  {selectedRequirement.title}
                </h2>
                {selectedRequirement.description ? (
                  <p className={styles.requirementDescription}>
                    {selectedRequirement.description}
                  </p>
                ) : (
                  <p
                    className={`${styles.requirementDescription} ${styles.noDescriptionAvailable}`}
                  >
                    <em>No description provided for this requirement</em>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.useCasesSectionContainer}>
            <h3 className={styles.useCasesSectionTitle}>
              Domain objects & attributes
            </h3>
            <DomainObjectsDetail
              projectId={projectId}
              requirementId={selectedRequirement.id}
            />
          </div>

          <div className={styles.useCasesSectionContainer}>
            <h3 className={styles.useCasesSectionTitle}>
              Use cases & test cases
            </h3>
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
                {fetchedUseCases.map((useCase) => {
                  const isActiveTabDetails =
                    activeUseCaseTabs[useCase.id] === "details" ||
                    activeUseCaseTabs[useCase.id] === undefined;
                  const isActiveTabTestCases =
                    activeUseCaseTabs[useCase.id] === "testCases";

                  return (
                    <div
                      key={useCase.id}
                      className={styles.useCaseEntryWrapper}
                      style={{ marginBottom: "30px" }}
                    >
                      <div className={styles.useCaseEntryHeader}>
                        <h4 className={styles.useCaseNameTitle}>
                          {useCase.name}
                        </h4>
                        <div className={styles.topActionsBar}>
                          <button
                            className={styles.actionButton}
                            style={{ marginRight: "8px" }}
                            onClick={() => {
                              navigate(
                                `/projects/${projectId}/requirements/${selectedRequirement.id}/use-cases/${useCase.id}/generate-test-cases`
                              );
                            }}
                          >
                            Create Test Cases
                          </button>
                          <RequirementEditIcon
                            onClick={() => {
                              if (isActiveTabDetails) {
                                handleEditExistingUseCaseClick(useCase);
                              } else if (isActiveTabTestCases) {
                                const singleTestCase =
                                  fetchedTestCases[useCase.id]?.[0];
                                if (singleTestCase) {
                                  if (editingTestCaseId === singleTestCase.id) {
                                    handleCancelEditExistingTestCase();
                                  } else {
                                    handleEditExistingTestCaseClick(
                                      useCase.id,
                                      singleTestCase
                                    );
                                  }
                                } else {
                                  showGlobalToast(
                                    "info",
                                    "No test case found to edit."
                                  );
                                }
                              }
                            }}
                          />
                          <RequirementDeleteIcon
                            onClick={() => {
                              if (isActiveTabDetails) {
                                setUseCaseToDelete(useCase);
                                setShowDeleteConfirm(true);
                                setTestCaseTargetedForDeletion(null);
                              } else if (isActiveTabTestCases) {
                                const singleTestCase =
                                  fetchedTestCases[useCase.id]?.[0];
                                if (singleTestCase) {
                                  setTestCaseTargetedForDeletion({
                                    ...singleTestCase,
                                    parentUseCaseId: useCase.id,
                                  });
                                  setShowDeleteConfirm(true);
                                  setUseCaseToDelete(null);
                                } else {
                                  showGlobalToast(
                                    "info",
                                    "No test case found to delete."
                                  );
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.tabsNav}>
                        <button
                          className={`${styles.tabButton} ${
                            isActiveTabDetails ? styles.tabButtonActive : ""
                          }`}
                          onClick={() => handleTabChange(useCase.id, "details")}
                        >
                          Use Cases
                        </button>
                        <button
                          className={`${styles.tabButton} ${
                            isActiveTabTestCases ? styles.tabButtonActive : ""
                          }`}
                          onClick={() =>
                            handleTabChange(useCase.id, "testCases")
                          }
                        >
                          Test Cases
                        </button>
                      </div>

                      <div className={styles.tabContent}>
                        {isActiveTabDetails && (
                          <>
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
                              <div className={styles.useCaseContent}>
                                <ReactMarkdown>{useCase.content}</ReactMarkdown>
                              </div>
                            )}
                          </>
                        )}

                        {isActiveTabTestCases && (
                          <div className={styles.testCasesContainerFluid}>
                            {loadingTestCases[useCase.id] && (
                              <div className={styles.useCasesLoading}>
                                <div className={styles.spinner}></div>
                                <p>Loading test cases...</p>
                              </div>
                            )}
                            {errorTestCases[useCase.id] && (
                              <div
                                className={`${styles.error} ${styles.useCasesError}`}
                              >
                                {errorTestCases[useCase.id]}
                              </div>
                            )}
                            {!loadingTestCases[useCase.id] &&
                              !errorTestCases[useCase.id] &&
                              fetchedTestCases[useCase.id] && (
                                <>
                                  {fetchedTestCases[useCase.id]?.length ===
                                    0 && (
                                    <p className={styles.noUseCasesMessage}>
                                      No test cases exists for this use case.
                                      Click the "Create Test Cases" button above
                                      to get started.
                                    </p>
                                  )}
                                  {fetchedTestCases[useCase.id]
                                    ?.slice(0, 1)
                                    .map((testCase) => (
                                      <div
                                        key={testCase.id}
                                        className={
                                          styles.individualTestCaseEntry
                                        }
                                      >
                                        {editingTestCaseId === testCase.id &&
                                        currentEditingUseCaseIdForTestCase ===
                                          useCase.id ? (
                                          <div
                                            className={styles.useCaseEditForm}
                                          >
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
                                              <div
                                                className={styles.editActions}
                                              >
                                                <SaveIcon
                                                  isLoading={isSavingTestCase}
                                                  onClick={
                                                    handleSaveExistingTestCase
                                                  }
                                                />
                                                <CancelIcon
                                                  onClick={
                                                    handleCancelEditExistingTestCase
                                                  }
                                                />
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
                                              className={
                                                styles.editInputContent
                                              }
                                              placeholder="Test Case Content"
                                              rows={6}
                                            />
                                            {editTestCaseError && (
                                              <div
                                                className={
                                                  styles.editErrorMessage
                                                }
                                              >
                                                {editTestCaseError}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <>
                                            <div
                                              className={styles.testCaseHeader}
                                            >
                                              <h4>{testCase.name}</h4>
                                            </div>
                                            <div
                                              className={styles.testCaseContent}
                                            >
                                              <ReactMarkdown>
                                                {testCase.content}
                                              </ReactMarkdown>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                </>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyStateContainer}>
                <p className={styles.noUseCasesMessage}>
                  No use cases exist for this requirement. You can generate them
                  using the "Create Use Cases" button below.
                </p>
                <button
                  className={styles.actionButton}
                  onClick={() =>
                    navigate(
                      `/projects/${projectId}/requirements/${selectedRequirement.id}/generate-use-cases`
                    )
                  }
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  Create Use Cases
                </button>
              </div>
            )}
          </div>

          {selectedRequirement && fetchedUseCases.length > 0 && (
            <div
              className={`${styles.detailBottomActions} ${styles.centeredActions}`}
            >
              <button
                className={styles.actionButton}
                onClick={() =>
                  navigate(
                    `/projects/${projectId}/requirements/${selectedRequirement.id}/generate-use-cases`
                  )
                }
                style={{
                  marginLeft: "auto",
                  marginRight: "auto",
                  display: "flex",
                  marginTop: "0.5rem",
                }}
              >
                Create Use Cases
              </button>
            </div>
          )}
        </>
        {showDeleteConfirm &&
          ReactDOM.createPortal(
            <div className={styles.modalOverlay}>
              <div className={styles.confirmDialog}>
                <h3>Delete {useCaseToDelete ? "Use Case" : "Test Case"}?</h3>
                <p>
                  Are you sure you wish to delete the{" "}
                  {useCaseToDelete ? "use case" : "test case"} "
                  <strong>
                    {useCaseToDelete?.name || testCaseTargetedForDeletion?.name}
                  </strong>
                  "? This action cannot be undone.
                </p>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={
                      useCaseToDelete
                        ? handleCancelDeleteExistingUseCase
                        : handleCancelDeleteExistingTestCase
                    }
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={
                      useCaseToDelete
                        ? handleConfirmDeleteExistingUseCase
                        : handleConfirmDeleteExistingTestCase
                    }
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
            const displayLimit = 5;

            return (
              <div
                key={requirement.id}
                className={styles.requirementCardUsed}
                onClick={() => handleRequirementClick(requirement)}
              >
                <div className={styles.requirementCardHeader}>
                  <FontAwesomeIcon
                    icon={
                      requirement.sourceType === "PDF" ? faFilePdf : faFileWord
                    }
                    className={styles.requirementTypeIcon}
                  />
                  <h3>{requirement.title}</h3>
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
            <h2>Use Cases & Test Cases</h2>
            <p className={styles.requirementsSubtitle}>
              List of requirements that have domain objects associated with
              them. Select a requirement to generate corresponding use cases and
              test cases.
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
