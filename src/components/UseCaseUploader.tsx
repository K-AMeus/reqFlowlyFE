import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import styles from "../styles/UseCaseUploader.module.css";

interface UseCaseResponse {
  domainObjects: string[];
  suggestedDomainObjects: string[];
  actions: string[];
  suggestedActions: string[];
}

const UseCaseUploader: React.FC = () => {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [domainObjects, setDomainObjects] = useState<string[]>([]);
  const [removedDomainObjects, setRemovedDomainObjects] = useState<string[]>(
    []
  );
  const [actions, setActions] = useState<string[]>([]);
  const [removedActions, setRemovedActions] = useState<string[]>([]);
  const [newDomainObject, setNewDomainObject] = useState("");
  const [newAction, setNewAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState<"text" | "file">("text");
  const [showDeletedDomainObjects, setShowDeletedDomainObjects] =
    useState(false);
  const [showDeletedActions, setShowDeletedActions] = useState(false);
  const [suggestedDomainObjects, setSuggestedDomainObjects] = useState<
    string[]
  >([]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);

  /** Handle text input submission */
  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setDomainObjects([]);
    setRemovedDomainObjects([]);
    setActions([]);
    setRemovedActions([]);
    setLoading(true);

    try {
      const response = await axios.post<UseCaseResponse>(
        "https://spec2testbe-production.up.railway.app/api/usecase-service/v1/usecases/text",
        { description }
      );
      setDomainObjects(response.data.domainObjects || []);
      setSuggestedDomainObjects(response.data.suggestedDomainObjects || []);
      setActions(response.data.actions || []);
      setSuggestedActions(response.data.suggestedActions || []);
    } catch (err: any) {
      console.error(err);
      setError("Error processing text input.");
    } finally {
      setLoading(false);
    }
  };

  /** Handle PDF file submission */
  const handleFileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setDomainObjects([]);
    setRemovedDomainObjects([]);
    setActions([]);
    setRemovedActions([]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<UseCaseResponse>(
        "https://spec2testbe-production.up.railway.app/api/usecase-service/v1/usecases/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setDomainObjects(response.data.domainObjects || []);
      setActions(response.data.actions || []);
      setSuggestedDomainObjects(response.data.suggestedDomainObjects || []);
      setSuggestedActions(response.data.suggestedActions || []);
    } catch (err: any) {
      console.error(err);
      setError("Error processing file upload.");
    } finally {
      setLoading(false);
    }
  };

  /** File input handler */
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  /** Toggle domain object: active -> removed, removed -> active */
  const toggleDomainObject = (item: string, fromActive: boolean) => {
    if (fromActive) {
      setDomainObjects((prev) => prev.filter((i) => i !== item));
      setRemovedDomainObjects((prev) => [...prev, item]);
    } else {
      setRemovedDomainObjects((prev) => prev.filter((i) => i !== item));
      setDomainObjects((prev) => [...prev, item]);
    }
  };

  /** Toggle action: active -> removed, removed -> active */
  const toggleAction = (item: string, fromActive: boolean) => {
    if (fromActive) {
      setActions((prev) => prev.filter((i) => i !== item));
      setRemovedActions((prev) => [...prev, item]);
    } else {
      setRemovedActions((prev) => prev.filter((i) => i !== item));
      setActions((prev) => [...prev, item]);
    }
  };

  /** Add a new domain object to the list */
  const addDomainObject = () => {
    if (newDomainObject.trim()) {
      setDomainObjects((prev) => [...prev, newDomainObject.trim()]);
      setNewDomainObject("");
    }
  };

  /** Add a new action to the list */
  const addAction = () => {
    if (newAction.trim()) {
      setActions((prev) => [...prev, newAction.trim()]);
      setNewAction("");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Automated Test Case Generation Tool</h1>

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
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? "Processing..." : "Submit Text"}
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
          <button
            type="submit"
            disabled={loading || !file}
            className={styles.submitButton}
          >
            {loading ? "Processing..." : "Upload PDF"}
          </button>
        </form>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {/* Domain Objects */}
      {(domainObjects.length > 0 || removedDomainObjects.length > 0) && (
        <div className={styles.results}>
          <h2>Domain Objects:</h2>
          <ul className={styles.domainList}>
            {domainObjects.map((obj, index) => (
              <li
                key={`active-${index}`}
                className={`${styles.domainListItem} ${styles.activeItem}`}
                onClick={() => toggleDomainObject(obj, true)}
              >
                {obj}
              </li>
            ))}
          </ul>

          {suggestedDomainObjects.length > 0 && (
            <div className={styles.results}>
              <ul className={styles.domainList}>
                {suggestedDomainObjects.map((obj, index) => (
                  <li
                    key={`suggested-domain-${index}`}
                    className={`${styles.domainListItem} ${styles.suggestedItem}`}
                    onClick={() => {
                      // Add suggestion to active list and remove from suggestions
                      setDomainObjects((prev) => [...prev, obj]);
                      setSuggestedDomainObjects((prev) =>
                        prev.filter((item) => item !== obj)
                      );
                    }}
                  >
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add new domain object */}
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

          <h2
            className={styles.deletedHeader}
            onClick={() => setShowDeletedDomainObjects((prev) => !prev)}
          >
            Deleted Domain Objects:
            <span className={styles.dropdownIcon}>
              {showDeletedDomainObjects ? "▼" : "▲"}
            </span>
          </h2>
          {showDeletedDomainObjects && removedDomainObjects.length > 0 && (
            <ul className={styles.removedList}>
              {removedDomainObjects.map((obj, index) => (
                <li
                  key={`removed-${index}`}
                  className={`${styles.domainListItem} ${styles.removed}`}
                  onClick={() => toggleDomainObject(obj, false)}
                >
                  {obj}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <br />
      <hr />
      <hr />

      {/* Actions */}
      {(actions.length > 0 || removedActions.length > 0) && (
        <div className={styles.results}>
          <h2 className={styles.resultsHeader}>Actions:</h2>
          <ul className={styles.domainList}>
            {actions.map((act, index) => (
              <li
                key={`active-action-${index}`}
                className={`${styles.domainListItem} ${styles.activeItem}`}
                onClick={() => toggleAction(act, true)}
              >
                {act}
              </li>
            ))}
          </ul>

          {suggestedActions.length > 0 && (
            <div className={styles.results}>
              <ul className={styles.domainList}>
                {suggestedActions.map((act, index) => (
                  <li
                    key={`suggested-action-${index}`}
                    className={`${styles.domainListItem} ${styles.suggestedItem}`}
                    onClick={() => {
                      setActions((prev) => [...prev, act]);
                      setSuggestedActions((prev) =>
                        prev.filter((item) => item !== act)
                      );
                    }}
                  >
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add new action */}
          <div className={styles.addObjectContainer}>
            <input
              type="text"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              placeholder="Add new action..."
              className={styles.addObjectInput}
            />
            <button onClick={addAction} className={styles.addObjectButton}>
              Add
            </button>
          </div>

          <h2
            className={styles.deletedHeader}
            onClick={() => setShowDeletedActions((prev) => !prev)}
          >
            Deleted Actions:
            <span className={styles.dropdownIcon}>
              {showDeletedActions ? "▼" : "▲"}
            </span>
          </h2>
          {showDeletedActions && removedActions.length > 0 && (
            <ul className={styles.removedList}>
              {removedActions.map((act, index) => (
                <li
                  key={`removed-action-${index}`}
                  className={`${styles.domainListItem} ${styles.removed}`}
                  onClick={() => toggleAction(act, false)}
                >
                  {act}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(domainObjects.length > 0 || actions.length > 0) && (
        <button className={styles.finalizeButton} disabled={loading}>
          {loading ? "Finalizing..." : "Finalize Domain Objects & Actions"}
        </button>
      )}
    </div>
  );
};

export default UseCaseUploader;
