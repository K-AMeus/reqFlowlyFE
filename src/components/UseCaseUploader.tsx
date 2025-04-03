import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import styles from "../styles/UseCaseUploader.module.css";

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

  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setDomainObjects({});
    setRemovedDomainObjects({});
    setLoading(true);

    try {
      const response = await axios.post<UseCaseResponse>(
        "https://spec2testbe-production.up.railway.app/api/usecase-service/v1/usecases/text",
        { description, customPrompt }
      );
      setDomainObjects(response.data.domainObjects || {});
      setSuggestedDomainObjects(response.data.suggestedDomainObjects || {});
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
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (customPrompt.trim()) {
        formData.append("customPrompt", customPrompt);
      }

      const response = await axios.post<UseCaseResponse>(
        "https://spec2testbe-production.up.railway.app/api/usecase-service/v1/usecases/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setDomainObjects(response.data.domainObjects || {});
      setSuggestedDomainObjects(response.data.suggestedDomainObjects || {});
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
      // Move from active to removed
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
          <input
            type="text"
            className={styles.customPromptInput}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom prompt (optional)"
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
            {loading ? "Processing..." : "Upload PDF"}
          </button>
        </form>
      )}

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
                    onClick={() => toggleDomainObject(domain)}
                  >
                    <td>{domain}</td>
                    <td>
                      {attributes.length > 0
                        ? attributes.join(", ")
                        : "No attributes"}
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
                  >
                    <td>{domain}</td>
                    <td>
                      {attributes.length > 0
                        ? attributes.join(", ")
                        : "No attributes"}
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
                    onClick={() => toggleDomainObject(domain)}
                  >
                    <td>{domain}</td>
                    <td>
                      {attributes.length > 0
                        ? attributes.join(", ")
                        : "No attributes"}
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
        <button onClick={addDomainObject} className={styles.addObjectButton}>
          Add
        </button>
      </div>

      {(Object.keys(domainObjects).length > 0 ||
        Object.keys(removedDomainObjects).length > 0) && (
        <button className={styles.finalizeButton} disabled={loading}>
          {loading ? "Finalizing..." : "Finalize Domain Objects"}
        </button>
      )}
    </div>
  );
};

export default UseCaseUploader;
