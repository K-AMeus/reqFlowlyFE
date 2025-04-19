import { AxiosInstance } from "axios";
import { ProjectService } from "../services/ProjectService";
import { RequirementService } from "../services/RequirementService";

export interface ExtendedAxiosInstance extends AxiosInstance {
  projectService: ProjectService;
  requirementService: RequirementService;
}
