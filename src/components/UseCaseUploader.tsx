import React, { useState, ChangeEvent, useEffect } from "react";
import styles from "../styles/UseCaseUploader.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { useParams } from "react-router-dom";
import { RequirementCreateRequestDto } from "../services/RequirementService";
import { UploaderDeleteIcon, AddIcon } from "../helpers/icons";

interface UseCaseResponse {
  domainObjects: { [key: string]: string[] };
  suggestedDomainObjects: { [key: string]: string[] };
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
  const [savingRequirement, setSavingRequirement] = useState(false);

  const { currentUser } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();

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

  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter some text to process.");
      return;
    }

    setError("");
    setDomainObjects({});
    setRemovedDomainObjects({});
    setSuggestedDomainObjects({});
    setLoading(true);
    setResultsReady(false);

    try {
      const api = await createAuthenticatedRequest(currentUser);

      if (projectId) {
        try {
          setSavingRequirement(true);

          const requirementData: RequirementCreateRequestDto = {
            title: `Requirement from ${new Date().toLocaleString()}`,
            description: "Domain objects extracted from text input",
            sourceType: "TEXT",
            sourceContent: description,
          };

          await api.requirementService.createRequirement(
            projectId,
            requirementData
          );
        } catch (err) {
          console.error("Error saving requirement:", err);
        } finally {
          setSavingRequirement(false);
        }
      }

      const response = await api.post<UseCaseResponse>(
        "/usecase-service/v1/usecases/text",
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

  const handleFileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setDomainObjects({});
    setRemovedDomainObjects({});
    setSuggestedDomainObjects({});
    setLoading(true);
    setResultsReady(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (customPrompt.trim()) {
        formData.append("customPrompt", customPrompt);
      }

      const api = await createAuthenticatedRequest(currentUser);

      // TODO: Implement file upload as requirements when needed

      const response = await api.post<UseCaseResponse>(
        "/usecase-service/v1/usecases/upload",
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

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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

  const hasResults =
    Object.keys(domainObjects).length > 0 ||
    Object.keys(suggestedDomainObjects).length > 0 ||
    Object.keys(removedDomainObjects).length > 0;

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <div className={styles.diagonalLine}></div>
        <div className={styles.diagonalLine}></div>
        <div className={styles.diagonalLine}></div>
        <div className={styles.diagonalLine}></div>
        <h1 className={styles.title}>
          ReqFlowly Use Case & Test Case Generator
        </h1>

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

            {selectedTab === "text" && (
              <form onSubmit={handleTextSubmit} className={styles.form}>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter your requirements here..."
                />
                <input
                  type="text"
                  className={styles.customPromptInput}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom prompt (optional)"
                />
                <button
                  type="submit"
                  disabled={loading || savingRequirement}
                  className={styles.submitButton}
                >
                  {loading ? (
                    <>
                      <span className={styles.loading}></span>
                      Processing...
                    </>
                  ) : savingRequirement ? (
                    <>
                      <span className={styles.loading}></span>
                      Saving Requirement...
                    </>
                  ) : (
                    "Submit Text"
                  )}
                </button>
              </form>
            )}

            {selectedTab === "file" && (
              <form onSubmit={handleFileSubmit} className={styles.form}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onFileChange}
                  className={styles.fileInput}
                />
                <input
                  type="text"
                  className={styles.customPromptInput}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom prompt (optional)"
                />
                <button
                  type="submit"
                  disabled={loading || !file}
                  className={styles.submitButton}
                >
                  {loading ? (
                    <>
                      <span className={styles.loading}></span>
                      Processing...
                    </>
                  ) : (
                    "Upload PDF"
                  )}
                </button>
              </form>
            )}

            {error && <p className={styles.error}>{error}</p>}
          </>
        )}

        {activeView === "results" && (
          <div className={styles.resultsView}>
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
                          <td>{domain}</td>
                          <td style={{ position: "relative" }}>
                            {attributes.length > 0
                              ? attributes.join(", ")
                              : "No attributes"}
                            <span
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                            >
                              <UploaderDeleteIcon
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
                          <td style={{ position: "relative" }}>
                            {attributes.length > 0
                              ? attributes.join(", ")
                              : "No attributes"}
                            <span
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
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
                          <td style={{ position: "relative" }}>
                            {attributes.length > 0
                              ? attributes.join(", ")
                              : "No attributes"}
                            <span
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
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

            {(Object.keys(domainObjects).length > 0 ||
              Object.keys(removedDomainObjects).length > 0) && (
              <button className={styles.finalizeButton} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.loading}></span>
                    Finalizing...
                  </>
                ) : (
                  "Finalize Domain Objects"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UseCaseUploader;
