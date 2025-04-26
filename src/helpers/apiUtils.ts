import { User } from "firebase/auth";
import axios from "axios";
import { RequirementService } from "../services/RequirementService";
import { ProjectService } from "../services/ProjectService";
import { DomainObjectService } from "../services/DomainObjectService";
import { DomainObjectAttributeService } from "../services/DomainObjectAttributeService";
import { ExtendedAxiosInstance } from "../types/api";

export const getAuthHeader = async (currentUser: User | null) => {
  if (!currentUser) return {};

  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const apiConfig = {
  baseURL: "https://spec2testbe-production.up.railway.app/api",
  withCredentials: true,
};

export const createAuthenticatedRequest = async (
  currentUser: User | null
): Promise<ExtendedAxiosInstance> => {
  const headers = await getAuthHeader(currentUser);

  const api = axios.create({
    baseURL: apiConfig.baseURL,
    headers,
    withCredentials: apiConfig.withCredentials,
  }) as ExtendedAxiosInstance;

  const projectService = new ProjectService(api);
  const requirementService = new RequirementService(api);
  const domainObjectService = new DomainObjectService(api);
  const domainObjectAttributeService = new DomainObjectAttributeService(api);

  api.projectService = projectService;
  api.requirementService = requirementService;
  api.domainObjectService = domainObjectService;
  api.domainObjectAttributeService = domainObjectAttributeService;

  return api;
};
