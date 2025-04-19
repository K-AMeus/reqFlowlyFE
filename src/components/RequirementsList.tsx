import React, { useState, useEffect } from "react";
import styles from "../styles/Requirements.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { RequirementDto } from "../services/RequirementService";
import { formatDate, formatTimeAgo } from "../helpers/dateUtils";

interface RequirementsListProps {
  projectId: string;
}

const RequirementsList: React.FC<RequirementsListProps> = ({ projectId }) => {
  const [requirements, setRequirements] = useState<RequirementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRequirement, setSelectedRequirement] =
    useState<RequirementDto | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  const { currentUser } = useAuth();

  useEffect(() => {
    fetchRequirements();
  }, [projectId, currentPage]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const api = await createAuthenticatedRequest(currentUser);
      const response = await api.requirementService.getAllRequirements(
        projectId,
        currentPage
      );

      setRequirements(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching requirements:", err);
      setError("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequirement = (requirement: RequirementDto) => {
    setSelectedRequirement(requirement);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedRequirement(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <button
          className={styles.paginationButton}
          disabled={currentPage === 0}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          className={styles.paginationButton}
          disabled={currentPage >= totalPages - 1}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    );
  };

  const renderRequirementDetail = () => {
    if (!selectedRequirement) return null;

    return (
      <div className={styles.requirementDetail}>
        <button className={styles.backButton} onClick={handleBackToList}>
          ← Back to Requirements
        </button>

        <div className={styles.requirementHeader}>
          <h3>{selectedRequirement.title}</h3>
          <div className={styles.requirementMeta}>
            <span>Created: {formatDate(selectedRequirement.createdAt)}</span>
            <span>Updated: {formatTimeAgo(selectedRequirement.updatedAt)}</span>
          </div>
        </div>

        {selectedRequirement.description && (
          <div className={styles.requirementSection}>
            <h4>Description</h4>
            <p>{selectedRequirement.description}</p>
          </div>
        )}

        {selectedRequirement.sourceType === "TEXT" &&
          selectedRequirement.sourceContent && (
            <div className={styles.requirementSection}>
              <h4>Source Content</h4>
              <div className={styles.sourceContent}>
                <pre>{selectedRequirement.sourceContent}</pre>
              </div>
            </div>
          )}

        {selectedRequirement.sourceType === "FILE" &&
          selectedRequirement.sourceFileUrl && (
            <div className={styles.requirementSection}>
              <h4>Source File</h4>
              <a
                href={selectedRequirement.sourceFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fileLink}
              >
                View File
              </a>
            </div>
          )}
      </div>
    );
  };

  const renderRequirementsList = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading requirements...</p>
        </div>
      );
    }

    if (error) {
      return <div className={styles.error}>{error}</div>;
    }

    if (requirements.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No requirements found for this project.</p>
          <p>Go to the Domain Objects page to add requirements.</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.requirementsList}>
          {requirements.map((requirement) => (
            <div
              key={requirement.id}
              className={styles.requirementCard}
              onClick={() => handleViewRequirement(requirement)}
            >
              <div className={styles.requirementCardHeader}>
                <h3>{requirement.title}</h3>
                <span className={styles.requirementType}>
                  {requirement.sourceType === "TEXT" ? "Text" : "File"}
                </span>
              </div>

              {requirement.description && (
                <p className={styles.requirementDescription}>
                  {requirement.description.length > 100
                    ? `${requirement.description.substring(0, 100)}...`
                    : requirement.description}
                </p>
              )}

              <div className={styles.requirementCardFooter}>
                <span>Created: {formatDate(requirement.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {renderPagination()}
      </>
    );
  };

  return (
    <div className={styles.requirementsContainer}>
      <h2 className={styles.requirementsTitle}>Project Requirements</h2>

      {viewMode === "list" && renderRequirementsList()}
      {viewMode === "detail" && renderRequirementDetail()}
    </div>
  );
};

export default RequirementsList;
