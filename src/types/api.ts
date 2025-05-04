import { AxiosInstance } from "axios";
import { ProjectService } from "../services/ProjectService";
import { RequirementService } from "../services/RequirementService";
import { DomainObjectService } from "../services/DomainObjectService";
import { DomainObjectAttributeService } from "../services/DomainObjectAttributeService";
import { UseCaseService } from "../services/UseCaseService";

export interface ExtendedAxiosInstance extends AxiosInstance {
  projectService: ProjectService;
  requirementService: RequirementService;
  domainObjectService: DomainObjectService;
  domainObjectAttributeService: DomainObjectAttributeService;
  useCaseService: UseCaseService;
}
