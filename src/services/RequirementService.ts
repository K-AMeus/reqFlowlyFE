import { AxiosInstance } from "axios";

export interface RequirementCreateRequestDto {
  title: string;
  description?: string;
  sourceType: string;
  sourceContent?: string;
  sourceFileUrl?: string;
}

export interface RequirementCreateResponseDto {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  sourceType: string;
  sourceContent?: string;
  sourceFileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequirementDto extends RequirementCreateResponseDto {
  createdAt: string;
  updatedAt: string;
}

export interface RequirementsPageResponse {
  content: RequirementDto[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

export class RequirementService {
  private api: AxiosInstance;
  private BASE_URL = "/requirement-service/v1/projects";

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  async createRequirement(
    projectId: string,
    reqData: RequirementCreateRequestDto
  ): Promise<RequirementCreateResponseDto> {
    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/requirements`,
      reqData
    );
    return response.data;
  }

  async getRequirement(
    projectId: string,
    requirementId: string
  ): Promise<RequirementDto> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}`
    );
    return response.data;
  }

  async getAllRequirements(
    projectId: string,
    page = 0,
    size = 9
  ): Promise<RequirementsPageResponse> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/requirements`,
      {
        params: {
          page,
          size,
        },
      }
    );
    return response.data;
  }

  async updateRequirement(
    projectId: string,
    requirementId: string,
    reqData: RequirementCreateRequestDto
  ): Promise<RequirementCreateResponseDto> {
    const response = await this.api.put(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}`,
      reqData
    );
    return response.data;
  }

  async deleteRequirement(
    projectId: string,
    requirementId: string
  ): Promise<void> {
    await this.api.delete(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}`
    );
  }
}
