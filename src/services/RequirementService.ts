import { AxiosInstance } from "axios";

export interface RequirementCreateRequestDto {
  title: string;
  description?: string;
  sourceType: string;
  sourceContent?: string;
  sourceFileUrl?: string;
}

export interface TextRequirementCreateDto {
  title: string;
  description?: string;
  sourceType: "TEXT";
  sourceContent?: string;
}

export interface PdfRequirementMetadataDto {
  title: string;
  description?: string;
  sourceType: "PDF";
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

  async createTextRequirement(
    projectId: string,
    reqData: TextRequirementCreateDto
  ): Promise<RequirementCreateResponseDto> {
    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/requirements/text`,
      reqData
    );
    return response.data;
  }

  async createPdfRequirement(
    projectId: string,
    metadata: PdfRequirementMetadataDto,
    file: File
  ): Promise<RequirementCreateResponseDto> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );

    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/requirements/pdf`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
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

  async getUsedRequirements(
    projectId: string,
    page = 0,
    size = 9
  ): Promise<RequirementsPageResponse> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/requirements/used`,
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
