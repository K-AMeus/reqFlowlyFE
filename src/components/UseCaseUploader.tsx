import React, { useState, ChangeEvent, useEffect } from "react";
import styles from "../styles/UseCaseUploader.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  UploaderDeleteIcon,
  AddIcon,
  UploaderEditIcon,
  UploaderSaveIcon,
  UploaderCancelIcon,
  PDFIcon,
} from "../helpers/icons";
import { navigateToUseCases } from "../helpers/navigationUtils";
import { showGlobalToast } from "../helpers/toastUtils";
import { RequirementDto } from "../services/RequirementService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileWord } from "@fortawesome/free-solid-svg-icons";

interface UseCaseResponse {
  domainObjects: { [key: string]: string[] };
  suggestedDomainObjects: { [key: string]: string[] };
}

interface AttributeEdit {
  value: string;
  isNew?: boolean;
  toDelete?: boolean;
}

const UseCaseUploader: React.FC = () => {
  const [description, setDescription] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [domainObjects, setDomainObjects] = useState<{
    [key: string]: string[];
  }>({});
  const [removedDomainObjects, setRemovedDomainObjects] = useState<{
    [key: string]: string[];
  }>({});
  const [suggestedDomainObjects, setSuggestedDomainObjects] = useState<{
    [key: string]: string[];
  }>({});
  const [newDomainObject, setNewDomainObject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState<"text" | "file">("text");
  const [activeView, setActiveView] = useState<"input" | "results">("input");
  const [resultsReady, setResultsReady] = useState(false);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingAttributes, setEditingAttributes] = useState<AttributeEdit[]>(
    []
  );
  const [savingDomainObjects, setSavingDomainObjects] = useState(false);
  const [allRequirements, setAllRequirements] = useState<RequirementDto[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [chosenRequirementId, setChosenRequirementId] = useState<
    string | "new"
  >("new");
  const [newRequirementTitle, setNewRequirementTitle] = useState("");
  const [newRequirementDescription, setNewRequirementDescription] =
    useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRequirementLabel, setSelectedRequirementLabel] =
    useState<string>("-- Create New Requirement --");
  const [selectedReqDescription, setSelectedReqDescription] =
    useState<string>("");
  const [createdRequirementId, setCreatedRequirementId] = useState<
    string | null
  >(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { currentUser } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRequirements = async () => {
      if (!projectId) return;
      setIsLoadingRequirements(true);
      try {
        const api = await createAuthenticatedRequest(currentUser);
        if (!api.requirementService) {
          throw new Error("Requirement Service not available");
        }
        const response = await api.requirementService.getAllRequirements(
          projectId,
          0,
          1000
        );
        const fetchedRequirements = response.content || [];
        setAllRequirements(fetchedRequirements);

        if (location.state?.selectedRequirementId) {
          const reqId = location.state.selectedRequirementId as string;
          const preSelectedReq = fetchedRequirements.find(
            (r) => r.id === reqId
          );
          if (preSelectedReq) {
            setChosenRequirementId(reqId);
            setSelectedRequirementLabel(
              `${preSelectedReq.title} (${preSelectedReq.sourceType})`
            );
            setSelectedReqDescription(preSelectedReq.description || "");
          } else {
            setChosenRequirementId("new");
            setSelectedRequirementLabel("-- Create New Requirement --");
            setSelectedReqDescription("");
          }
          window.history.replaceState({}, document.title);
        } else {
          setChosenRequirementId("new");
          setSelectedRequirementLabel("-- Create New Requirement --");
          setSelectedReqDescription("");
        }
      } catch (err) {
        console.error("Error fetching all requirements:", err);
        setError("Failed to load existing requirements.");
        setChosenRequirementId("new");
        setSelectedRequirementLabel("-- Create New Requirement --");
        setSelectedReqDescription("");
      } finally {
        setIsLoadingRequirements(false);
      }
    };
    fetchRequirements();
  }, [projectId, currentUser, location.state]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    if (
      !loading &&
      resultsReady &&
      (Object.keys(domainObjects).length > 0 ||
        Object.keys(suggestedDomainObjects).length > 0)
    ) {
      setActiveView("results");
      setResultsReady(false);
    }
  }, [loading, resultsReady, domainObjects, suggestedDomainObjects]);

  useEffect(() => {
    if (chosenRequirementId === "new") {
      setDescription("");
      setSelectedReqDescription("");
    } else {
      const selectedReq = allRequirements.find(
        (r) => r.id === chosenRequirementId
      );
      setDescription(selectedReq?.sourceContent || "");
      setSelectedReqDescription(selectedReq?.description || "");
    }
  }, [chosenRequirementId, allRequirements]);

  const showNotification = (type: "success" | "error", message: string) => {
    showGlobalToast(type, message);
  };

  const handleTextSubmit = async () => {
    if (chosenRequirementId === "new") {
      if (!newRequirementTitle.trim()) {
        setError("Please enter a title for the new requirement.");
        return;
      }
      if (!description.trim()) {
        setError("Please enter the requirements specification content.");
        return;
      }
    }

    if (!description.trim() && chosenRequirementId !== "new") {
      setError("No requirement content found to process.");
      return;
    }

    setError("");
    setCreatedRequirementId(null);
    setDomainObjects({});
    setRemovedDomainObjects({});
    setSuggestedDomainObjects({});
    setLoading(true);
    setResultsReady(false);

    try {
      const api = await createAuthenticatedRequest(currentUser);
      if (!api.requirementService) {
        throw new Error("Requirement Service not available");
      }

      if (chosenRequirementId === "new") {
        try {
          const newReqData = {
            title: newRequirementTitle.trim(),
            description:
              newRequirementDescription.trim() ||
              "Created from text input during domain generation",
            sourceType: "TEXT" as const,
            sourceContent: description.trim(),
          };
          if (!api.requirementService) {
            throw new Error("Requirement Service not available");
          }
          const requirementResponse =
            await api.requirementService.createTextRequirement(
              projectId!,
              newReqData
            );
          setCreatedRequirementId(requirementResponse.id);
          showNotification(
            "success",
            `Requirement "${newReqData.title}" created.`
          );
        } catch (reqErr) {
          console.error("Error creating new requirement:", reqErr);
          setError("Failed to create the new requirement. Cannot proceed.");
          setLoading(false);
          return;
        }
      }

      const response = await api.post<UseCaseResponse>(
        "/domain-object-service/v1/generation/text",
        { description, customPrompt }
      );
      setDomainObjects(response.data.domainObjects || {});
      setSuggestedDomainObjects(response.data.suggestedDomainObjects || {});
      setResultsReady(true);
    } catch (err: unknown) {
      console.error(err);
      setError("Error processing text input.");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError("");
    }
  };

  const handleFileSubmit = async () => {
    if (!file) return;

    if (chosenRequirementId === "new") {
      if (!newRequirementTitle.trim()) {
        setError(
          "Please enter a title for the new requirement before uploading a file."
        );
        return;
      }
    }

    setError("");
    setDomainObjects({});
    setRemovedDomainObjects({});
    setSuggestedDomainObjects({});
    setLoading(true);
    setResultsReady(false);

    try {
      const api = await createAuthenticatedRequest(currentUser);
      if (!api.requirementService) {
        throw new Error("Requirement Service not available");
      }

      if (chosenRequirementId === "new") {
        try {
          const newReqData = {
            title: newRequirementTitle.trim(),
            description:
              newRequirementDescription.trim() ||
              "Created from PDF upload during domain generation",
            sourceType: "PDF" as const,
            sourceContent: "",
            sourceFileUrl: "",
          };

          if (!api.requirementService) {
            throw new Error("Requirement Service not available");
          }
          const requirementResponse =
            await api.requirementService.createPdfRequirement(
              projectId!,
              newReqData,
              file
            );

          setCreatedRequirementId(requirementResponse.id);
          showNotification(
            "success",
            `Requirement "${newReqData.title}" created.`
          );
        } catch (reqErr) {
          console.error(
            "Error creating new requirement for PDF upload:",
            reqErr
          );
          setError(
            "Failed to create the new requirement record. Cannot proceed with upload."
          );
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      if (customPrompt.trim()) {
        formData.append("customPrompt", customPrompt);
      }

      const response = await api.post<UseCaseResponse>(
        "/domain-object-service/v1/generation/pdf",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setDomainObjects(response.data.domainObjects || {});
      setSuggestedDomainObjects(response.data.suggestedDomainObjects || {});
      setResultsReady(true);
    } catch (err: unknown) {
      console.error(err);
      setError("Error processing file upload.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDomainObject = (domain: string) => {
    if (domain in domainObjects) {
      setRemovedDomainObjects((prev) => ({
        ...prev,
        [domain]: [...domainObjects[domain]],
      }));
      setDomainObjects((prev) => {
        const newState = { ...prev };
        delete newState[domain];
        return newState;
      });
    } else if (domain in removedDomainObjects) {
      setDomainObjects((prev) => ({
        ...prev,
        [domain]: [...removedDomainObjects[domain]],
      }));
      setRemovedDomainObjects((prev) => {
        const newState = { ...prev };
        delete newState[domain];
        return newState;
      });
    }
  };

  const addDomainObject = () => {
    if (newDomainObject.trim()) {
      setDomainObjects((prev) => ({
        ...prev,
        [newDomainObject.trim()]: [],
      }));
      setNewDomainObject("");
    }
  };

  const handleEditDomain = (domain: string, attributes: string[]) => {
    setEditingDomain(domain);
    setEditingName(domain);
    setEditingAttributes(attributes.map((attr) => ({ value: attr })));
  };

  const handleSaveEdit = () => {
    if (!editingDomain || !editingName.trim()) return;

    if (
      editingName !== editingDomain &&
      (editingName in domainObjects ||
        editingName in suggestedDomainObjects ||
        editingName in removedDomainObjects)
    ) {
      setError(`Domain object "${editingName}" already exists.`);
      return;
    }

    const updatedDomainObjects = { ...domainObjects };
    delete updatedDomainObjects[editingDomain];

    const validAttributes = editingAttributes
      .filter((attr) => !attr.toDelete)
      .filter((attr) => attr.value.trim() !== "")
      .map((attr) => attr.value.trim());

    const orderedDomainObjects: { [key: string]: string[] } = {};
    const entries = Object.entries(domainObjects);

    const editedIndex = entries.findIndex(
      ([domain]) => domain === editingDomain
    );

    for (let i = 0; i < entries.length; i++) {
      const [domain, attrs] = entries[i];

      if (i === editedIndex) {
        orderedDomainObjects[editingName.trim()] = validAttributes;
      } else if (domain !== editingDomain) {
        orderedDomainObjects[domain] = attrs;
      }
    }

    setDomainObjects(orderedDomainObjects);
    setError("");
    setEditingDomain(null);
    setEditingName("");
    setEditingAttributes([]);
  };

  const handleCancelEdit = () => {
    setEditingDomain(null);
    setEditingName("");
    setEditingAttributes([]);
    setError("");
  };

  const handleAttributeChange = (index: number, value: string) => {
    const newAttributes = [...editingAttributes];
    newAttributes[index].value = value;
    setEditingAttributes(newAttributes);
  };

  const handleAddAttribute = () => {
    setEditingAttributes([...editingAttributes, { value: "", isNew: true }]);
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = [...editingAttributes];
    if (newAttributes[index].isNew) {
      newAttributes.splice(index, 1);
    } else {
      newAttributes[index].toDelete = true;
    }
    setEditingAttributes(newAttributes);
  };

  const handleUndoRemoveAttribute = (index: number) => {
    const newAttributes = [...editingAttributes];
    newAttributes[index].toDelete = false;
    setEditingAttributes(newAttributes);
  };

  const renderAttributeItem = (attr: AttributeEdit, attrIndex: number) => {
    return (
      <div
        key={`attr-${attrIndex}`}
        className={`${styles.attributeItem} ${
          attr.toDelete ? styles.attributeDeleted : ""
        }`}
      >
        <input
          type="text"
          value={attr.value}
          onChange={(e) => handleAttributeChange(attrIndex, e.target.value)}
          className={`${styles.editInput} ${styles.attributeInput}`}
          placeholder="Attribute name"
          disabled={attr.toDelete}
        />
        {attr.toDelete ? (
          <span
            className={styles.undoButton}
            onClick={() => handleUndoRemoveAttribute(attrIndex)}
          >
            Undo
          </span>
        ) : (
          <UploaderDeleteIcon
            onClick={() => handleRemoveAttribute(attrIndex)}
          />
        )}
      </div>
    );
  };

  const hasResults =
    Object.keys(domainObjects).length > 0 ||
    Object.keys(suggestedDomainObjects).length > 0 ||
    Object.keys(removedDomainObjects).length > 0;

  const handleFinalizeDomainObjects = async () => {
    if (!projectId) {
      setError("Project ID is missing.");
      showNotification("error", "Project ID is missing.");
      return;
    }

    if (chosenRequirementId === "new" && !newRequirementTitle.trim()) {
      setError("Please enter a title for the new requirement.");
      showNotification("error", "New requirement title is missing.");
      return;
    }

    const finalRequirementId =
      chosenRequirementId === "new"
        ? createdRequirementId
        : chosenRequirementId;

    if (!finalRequirementId) {
      setError("Could not determine requirement ID for saving domain objects.");
      showNotification("error", "Requirement ID missing for saving.");
      return;
    }

    const api = await createAuthenticatedRequest(currentUser);
    setSavingDomainObjects(true);
    setError("");

    try {
      if (!api.domainObjectService) {
        throw new Error("Domain Object Service not available");
      }
      await api.domainObjectService.createDomainObjectsBatch(
        projectId,
        finalRequirementId,
        domainObjects
      );

      showNotification("success", "Domain objects successfully saved!");
      navigateToUseCases(navigate, projectId);
    } catch (err) {
      console.error("Error saving domain objects:", err);
      setError("Failed to save domain objects to the database.");
      showNotification("error", "Failed to save domain objects.");
    } finally {
      setSavingDomainObjects(false);
    }
  };

  const toggleDropdown = () => {
    if (!isLoadingRequirements) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleSelectRequirement = (id: string | "new", label: string) => {
    setChosenRequirementId(id);
    setCreatedRequirementId(null);
    setSelectedRequirementLabel(label);
    setIsDropdownOpen(false);
    if (id !== "new") {
      setNewRequirementTitle("");
    }
  };

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <div className={styles.diagonalLine}></div>
        <div className={styles.diagonalLine}></div>
        <div className={styles.diagonalLine}></div>
        <div className={styles.diagonalLine}></div>
        <h1 className={styles.title}>Domain Object Generator</h1>
        <p className={styles.subtitle}>
          Extract domain objects and their attributes from your requirements.
          These domain objects will serve as the foundation for generating use
          cases and test cases.
        </p>

        {isLoadingRequirements ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Booting up the generator...</p>
          </div>
        ) : (
          <>
            {hasResults && (
              <div className={styles.mainTabs}>
                <button
                  onClick={() => setActiveView("input")}
                  className={`${styles.mainTab} ${
                    activeView === "input" ? styles.activeMainTab : ""
                  }`}
                >
                  Input
                </button>
                <button
                  onClick={() => setActiveView("results")}
                  className={`${styles.mainTab} ${
                    activeView === "results" ? styles.activeMainTab : ""
                  }`}
                >
                  Results
                </button>
              </div>
            )}

            {activeView === "input" && (
              <>
                {chosenRequirementId === "new" && (
                  <div className={styles.tabButtons}>
                    <button
                      onClick={() => setSelectedTab("text")}
                      disabled={selectedTab === "text"}
                      className={`${styles.tabButton} ${
                        selectedTab === "text" ? styles.active : ""
                      }`}
                    >
                      Text Input
                    </button>
                    <button
                      onClick={() => setSelectedTab("file")}
                      disabled={selectedTab === "file"}
                      className={`${styles.tabButton} ${
                        selectedTab === "file" ? styles.active : ""
                      }`}
                    >
                      PDF Upload
                    </button>
                  </div>
                )}

                {chosenRequirementId !== "new" && (
                  <div
                    className={styles.inputWrapper}
                    style={{ marginBottom: "6px" }}
                  >
                    <label className={styles.inputLabel}>
                      Requirement title
                    </label>
                  </div>
                )}

                <div className={styles.inputWrapper} ref={dropdownRef}>
                  <div className={styles.customDropdownContainer}>
                    <button
                      type="button"
                      className={styles.customDropdownTrigger}
                      onClick={toggleDropdown}
                      disabled={isLoadingRequirements}
                    >
                      <span>{selectedRequirementLabel}</span>
                      <span
                        className={`${styles.dropdownArrow} ${
                          isDropdownOpen ? styles.dropdownArrowOpen : ""
                        }`}
                      ></span>
                    </button>
                    {isDropdownOpen && (
                      <ul className={styles.customDropdownOptions}>
                        <li
                          className={`${styles.customDropdownOption} ${
                            chosenRequirementId === "new"
                              ? styles.customDropdownOptionActive
                              : ""
                          }`}
                          onClick={() =>
                            handleSelectRequirement(
                              "new",
                              "-- Create New Requirement --"
                            )
                          }
                        >
                          -- Create New Requirement --
                        </li>
                        {isLoadingRequirements ? (
                          <li
                            className={`${styles.customDropdownOption} ${styles.disabled}`}
                          >
                            Loading...
                          </li>
                        ) : (
                          allRequirements.map((req) => (
                            <li
                              key={req.id}
                              className={`${styles.customDropdownOption} ${
                                chosenRequirementId === req.id
                                  ? styles.customDropdownOptionActive
                                  : ""
                              }`}
                              onClick={() =>
                                handleSelectRequirement(req.id, req.title)
                              }
                            >
                              <FontAwesomeIcon
                                icon={
                                  req.sourceType === "PDF"
                                    ? faFilePdf
                                    : faFileWord
                                }
                                className={styles.dropdownReqIcon}
                              />
                              {req.title}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {chosenRequirementId === "new" && (
                  <>
                    <div className={styles.inputWrapper}>
                      <label
                        htmlFor="newReqTitle"
                        className={styles.inputLabel}
                      >
                        Requirement Title
                      </label>
                      <input
                        type="text"
                        id="newReqTitle"
                        className={styles.customPromptInput}
                        value={newRequirementTitle}
                        onChange={(e) => setNewRequirementTitle(e.target.value)}
                        placeholder="Enter title for the new requirement"
                        required
                      />
                    </div>
                    <div className={styles.inputWrapper}>
                      <label
                        htmlFor="newReqDesc"
                        className={`${styles.inputLabel} ${styles.optional}`}
                      >
                        Description
                      </label>
                      <textarea
                        id="newReqDesc"
                        className={`${styles.textarea} ${styles.requirementDescriptionDisplay}`}
                        value={newRequirementDescription}
                        onChange={(e) =>
                          setNewRequirementDescription(e.target.value)
                        }
                        placeholder="Enter description for the new requirement (optional)"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {chosenRequirementId !== "new" && (
                  <>
                    <div
                      className={styles.inputWrapper}
                      style={{ marginTop: "0.5rem" }}
                    >
                      <label className={styles.inputLabel}>
                        Requirement Description
                      </label>
                      <textarea
                        className={`${styles.textarea} ${styles.textareaReadOnly} ${styles.requirementDescriptionDisplay}`}
                        value={selectedReqDescription}
                        placeholder={
                          "No description provided for selected requirement."
                        }
                        readOnly
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {selectedTab === "text" && (
                  <div className={styles.formContents}>
                    <div className={styles.inputWrapper}>
                      <label className={styles.inputLabel}>
                        Requirements specification
                      </label>
                      <textarea
                        className={`${styles.textarea} ${
                          chosenRequirementId !== "new"
                            ? styles.textareaReadOnly
                            : ""
                        }`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                          chosenRequirementId === "new"
                            ? "Enter your requirements details here"
                            : "Requirement content loaded (read-only)"
                        }
                        required={chosenRequirementId === "new"}
                        readOnly={chosenRequirementId !== "new"}
                      />
                    </div>
                    <div className={styles.inputWrapper}>
                      <label
                        className={`${styles.inputLabel} ${styles.optional}`}
                      >
                        Custom GPT instructions
                      </label>
                      <input
                        type="text"
                        className={styles.customPromptInput}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Specific instructions for processing this requirement"
                      />
                    </div>
                    <div className={styles.submitButtonWrapper}>
                      <button
                        type="button"
                        onClick={handleTextSubmit}
                        disabled={loading}
                        className={styles.submitButton}
                      >
                        {loading ? (
                          <>
                            <span className={styles.loading}></span>
                            Processing...
                          </>
                        ) : (
                          "Create Domain Objects"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {selectedTab === "file" && (
                  <div className={styles.formContents}>
                    <div className={styles.inputWrapper}>
                      <label
                        htmlFor="fileInputUploader"
                        className={styles.inputLabel}
                      >
                        PDF document
                      </label>
                      <div className={styles.fileUploadContainer}>
                        <input
                          type="file"
                          id="fileInputUploader"
                          accept=".pdf"
                          onChange={onFileChange}
                          className={styles.fileInput}
                          disabled={loading}
                          required
                        />
                        <div
                          className={`${styles.fileUploadBox} ${
                            loading ? styles.fileUploadBoxDisabled : ""
                          }`}
                        >
                          {file ? (
                            <div className={styles.selectedFile}>
                              <PDFIcon />
                              {file.name}
                            </div>
                          ) : (
                            <div className={styles.fileUploadPrompt}>
                              <span>
                                Click to select or drop a PDF file here
                              </span>
                              <span className={styles.fileLimit}>
                                (Max 10MB)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.inputWrapper}>
                      <label
                        className={`${styles.inputLabel} ${styles.optional}`}
                      >
                        Custom GPT instructions (Optional)
                      </label>
                      <input
                        type="text"
                        className={styles.customPromptInput}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Specific instructions for processing this requirement"
                      />
                    </div>
                    <div className={styles.submitButtonWrapper}>
                      <button
                        type="button"
                        onClick={handleFileSubmit}
                        disabled={loading || !file}
                        className={styles.submitButton}
                      >
                        {loading ? (
                          <>
                            <span className={styles.loading}></span>
                            Processing...
                          </>
                        ) : (
                          "Create Domain Objects"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className={styles.error}>{error}</p>}
              </>
            )}

            {activeView === "results" && (
              <div className={styles.resultsView}>
                {error && <p className={styles.error}>{error}</p>}

                {Object.keys(domainObjects).length > 0 && (
                  <div className={styles.results}>
                    <h2>Domain Objects:</h2>
                    <table className={styles.domainTable}>
                      <thead>
                        <tr>
                          <th>Domain Object</th>
                          <th>Attributes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(domainObjects).map(
                          ([domain, attributes], index) => (
                            <tr
                              key={`domain-${index}`}
                              className={styles.domainRow}
                            >
                              {editingDomain === domain ? (
                                <>
                                  <td>
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) =>
                                        setEditingName(e.target.value)
                                      }
                                      className={styles.editInput}
                                    />
                                  </td>
                                  <td>
                                    <div className={styles.attributesList}>
                                      {editingAttributes.map(
                                        renderAttributeItem
                                      )}
                                      <button
                                        type="button"
                                        className={styles.addAttributeButton}
                                        onClick={handleAddAttribute}
                                      >
                                        <span className={styles.addButtonText}>
                                          + Add
                                        </span>
                                      </button>
                                    </div>
                                    <div className={styles.editActions}>
                                      <UploaderSaveIcon
                                        onClick={handleSaveEdit}
                                      />
                                      <UploaderCancelIcon
                                        onClick={handleCancelEdit}
                                      />
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td>{domain}</td>
                                  <td>
                                    {attributes.length > 0
                                      ? attributes.join(", ")
                                      : "No attributes"}
                                    <span
                                      style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        display: "flex",
                                        gap: "8px",
                                        zIndex: 1,
                                      }}
                                    >
                                      <UploaderEditIcon
                                        onClick={() =>
                                          handleEditDomain(domain, attributes)
                                        }
                                      />
                                      <UploaderDeleteIcon
                                        onClick={() =>
                                          toggleDomainObject(domain)
                                        }
                                      />
                                    </span>
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {Object.keys(suggestedDomainObjects).length > 0 && (
                  <div className={styles.results}>
                    <h2>Suggested Domain Objects:</h2>
                    <table className={styles.domainTable}>
                      <thead>
                        <tr>
                          <th>Domain Object</th>
                          <th>Attributes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(suggestedDomainObjects).map(
                          ([domain, attributes], index) => (
                            <tr
                              key={`suggested-${index}`}
                              className={`${styles.domainRow} ${styles.suggestedRow}`}
                            >
                              <td>{domain}</td>
                              <td>
                                {attributes.length > 0
                                  ? attributes.join(", ")
                                  : "No attributes"}
                                <span
                                  style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    display: "flex",
                                    gap: "8px",
                                    zIndex: 1,
                                  }}
                                >
                                  <AddIcon
                                    onClick={() => {
                                      setDomainObjects((prev) => ({
                                        ...prev,
                                        [domain]: attributes,
                                      }));
                                      setSuggestedDomainObjects((prev) => {
                                        const newState = { ...prev };
                                        delete newState[domain];
                                        return newState;
                                      });
                                    }}
                                  />
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {Object.keys(removedDomainObjects).length > 0 && (
                  <div className={styles.results}>
                    <h2>Removed Domain Objects:</h2>
                    <table className={styles.domainTable}>
                      <thead>
                        <tr>
                          <th>Domain Object</th>
                          <th>Attributes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(removedDomainObjects).map(
                          ([domain, attributes], index) => (
                            <tr
                              key={`removed-${index}`}
                              className={`${styles.domainRow} ${styles.removedRow}`}
                            >
                              <td>{domain}</td>
                              <td>
                                {attributes.length > 0
                                  ? attributes.join(", ")
                                  : "No attributes"}
                                <span
                                  style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    display: "flex",
                                    gap: "8px",
                                    zIndex: 1,
                                  }}
                                >
                                  <AddIcon
                                    onClick={() => toggleDomainObject(domain)}
                                  />
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className={styles.addObjectContainer}>
                  <input
                    type="text"
                    value={newDomainObject}
                    onChange={(e) => setNewDomainObject(e.target.value)}
                    placeholder="Add new domain object..."
                    className={styles.addObjectInput}
                  />
                  <button
                    onClick={addDomainObject}
                    className={styles.addObjectButton}
                  >
                    Add
                  </button>
                </div>

                {Object.keys(domainObjects).length > 0 && (
                  <button
                    className={styles.finalizeButton}
                    disabled={loading || savingDomainObjects}
                    onClick={handleFinalizeDomainObjects}
                  >
                    {savingDomainObjects ? (
                      <>
                        <span className={styles.loading}></span>
                        Saving Domain Objects...
                      </>
                    ) : (
                      "Save Domain Objects"
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UseCaseUploader;
