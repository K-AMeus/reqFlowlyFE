import { AxiosInstance } from "axios";

export interface UseCaseCreateReqDto {
  domainObject: string;
  attributes: string[];
}

export interface UseCaseCreateResDto {
  id: string;
  name: string;
  content: string;
}

export interface UseCaseDto {
  name: string;
  content: string;
}

export class UseCaseService {
  private api: AxiosInstance;
  private BASE_URL: string = "/use-case-service/v1/projects";

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  async generateUseCases(
    projectId: string,
    requirementId: string,
    data: UseCaseCreateReqDto
  ): Promise<UseCaseCreateResDto[]> {
    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases`,
      data
    );
    return response.data;
  }

  async getUseCases(
    projectId: string,
    requirementId: string
  ): Promise<UseCaseCreateResDto[]> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases`
    );
    return response.data;
  }

  async updateUseCase(
    projectId: string,
    requirementId: string,
    useCaseId: string,
    data: UseCaseDto
  ): Promise<UseCaseCreateResDto> {
    const response = await this.api.put(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases/${useCaseId}`,
      data
    );
    return response.data;
  }

  async deleteUseCase(
    projectId: string,
    requirementId: string,
    useCaseId: string
  ): Promise<void> {
    await this.api.delete(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases/${useCaseId}`
    );
  }
}
