import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { RequirementDto } from "../services/RequirementService";
import styles from "../styles/ExportPage.module.css";
import { ChevronLeft } from "../helpers/icons";
import { showGlobalToast } from "../helpers/toastUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileWord } from "@fortawesome/free-solid-svg-icons";
import { CardCalendarIcon, CardTimeIcon } from "../helpers/icons";
import { formatTimeAgo } from "../helpers/dateUtils";
import requirementsStyles from "../styles/Requirements.module.css";

const ExportPage: React.FC = () => {
  const { projectId, requirementId } = useParams<{
    projectId: string;
    requirementId: string;
  }>();
  const [requirement, setRequirement] = useState<RequirementDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !projectId || !requirementId) {
        setError("Missing critical information to load requirement data.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const api = await createAuthenticatedRequest(currentUser);

        const fetchedRequirement = await api.requirementService?.getRequirement(
          projectId,
          requirementId
        );
        if (fetchedRequirement) {
          setRequirement(fetchedRequirement);
        } else {
          setError("Requirement not found.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error fetching data for export:", err);
        setError("Failed to load all details for export.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, projectId, requirementId]);

  const handleRequestPdfExport = async () => {
    if (!currentUser || !projectId || !requirementId || !requirement) {
      showGlobalToast(
        "error",
        "Cannot initiate PDF export: Missing critical data."
      );
      return;
    }
    showGlobalToast(
      "success",
      `PDF export for "${requirement.title}" started.`
    );
  };

  const handleBackToRequirement = () => {
    if (projectId && requirementId) {
      navigate(`/projects/${projectId}/use-cases/${requirementId}`);
    } else if (projectId) {
      navigate(`/projects/${projectId}/use-cases`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading export data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className={styles.actionButton}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Requirement Not Found</h2>
          <p>The requested requirement could not be loaded.</p>
          <button onClick={() => navigate(-1)} className={styles.actionButton}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBackToRequirement}>
          <ChevronLeft /> Back
        </button>
        <h1>Export Document</h1>
        <p className={requirementsStyles.requirementsSubtitle}>
          Export all the generated artefacts of the selected requirement.
        </p>
      </div>

      <div className={styles.content}>
        {requirement && (
          <div
            className={`${requirementsStyles.requirementCard} ${requirementsStyles.requirementCardStatic}`}
          >
            <div className={requirementsStyles.requirementCardHeader}>
              <FontAwesomeIcon
                icon={requirement.sourceType === "PDF" ? faFilePdf : faFileWord}
                className={requirementsStyles.requirementTypeIcon}
              />
              <h3>{requirement.title}</h3>
            </div>

            <div className={requirementsStyles.requirementCardContent}>
              {requirement.description ? (
                <p className={requirementsStyles.requirementDescriptionFull}>
                  {requirement.description}
                </p>
              ) : (
                <p
                  className={`${requirementsStyles.requirementDescriptionFull} ${requirementsStyles.previewEmpty}`}
                >
                  No description provided for this requirement
                </p>
              )}
            </div>

            {(requirement.createdAt || requirement.updatedAt) && (
              <div className={requirementsStyles.requirementCardFooter}>
                <div className={requirementsStyles.requirementDates}>
                  {requirement.createdAt && (
                    <div className={requirementsStyles.dateItem}>
                      <div className={requirementsStyles.dateLabel}>
                        <CardCalendarIcon />
                        <span>Created</span>
                      </div>
                      <span className={requirementsStyles.dateValue}>
                        {formatTimeAgo(requirement.createdAt)}
                      </span>
                    </div>
                  )}
                  {requirement.updatedAt && (
                    <div className={requirementsStyles.dateItem}>
                      <div className={requirementsStyles.dateLabel}>
                        <CardTimeIcon />
                        <span>Updated</span>
                      </div>
                      <span className={requirementsStyles.dateValue}>
                        {formatTimeAgo(requirement.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.exportActionsContainer}>
          <button
            className={styles.actionButton}
            onClick={handleRequestPdfExport}
            disabled={!requirement || loading}
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              display: "flex",
              marginTop: "30px",
              marginBottom: "20px",
            }}
          >
            <FontAwesomeIcon icon={faFilePdf} /> Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
