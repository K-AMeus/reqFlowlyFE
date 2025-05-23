import React, { useState, useEffect } from "react";
import styles from "../styles/DomainObjects.module.css";
import { useAuth } from "../context/AuthContext";
import { createAuthenticatedRequest } from "../helpers/apiUtils";
import { DomainObjectAttributeDto } from "../services/DomainObjectService";
import { showGlobalToast } from "../helpers/toastUtils";

interface DomainObjectsDetailProps {
  projectId: string;
  requirementId: string;
}

const DomainObjectsDetail: React.FC<DomainObjectsDetailProps> = ({
  projectId,
  requirementId,
}) => {
  const [domainObjects, setDomainObjects] = useState<
    Record<string, DomainObjectAttributeDto[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useAuth();

  useEffect(() => {
    if (projectId && requirementId) {
      fetchDomainObjects();
    }
  }, [projectId, requirementId]);

  const fetchDomainObjects = async () => {
    try {
      setLoading(true);
      const services = await createAuthenticatedRequest(currentUser);
      if (!services?.domainObjectService)
        throw new Error("Domain Object Service not available");
      const response =
        await services.domainObjectService.getDomainObjectsWithAttributesByRequirement(
          projectId,
          requirementId
        );

      setDomainObjects(response?.domainObjectsWithAttributes || {});
    } catch (err) {
      console.error("Error fetching domain objects:", err);
      setError("Failed to fetch domain objects for this requirement");
      showGlobalToast("error", "Failed to fetch domain objects");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading domain objects...</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (Object.keys(domainObjects).length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No domain objects found for this requirement.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.domainObjectsTable}>
        <thead>
          <tr>
            <th className={styles.domainNameColumn}>Domain Object</th>
            <th>Attributes</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(domainObjects).map(([domainName, attributes]) => (
            <tr key={domainName} className={styles.domainObjectRow}>
              <td className={styles.domainNameCell}>{domainName}</td>
              <td className={styles.attributesCell}>
                <div className={styles.attributesList}>
                  {attributes.map((attribute) => (
                    <span key={attribute.id} className={styles.attributeTag}>
                      {attribute.name}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DomainObjectsDetail;
