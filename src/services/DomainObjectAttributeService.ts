import { AxiosInstance } from "axios";

export interface DomainObjectAttributeCreateRequestDto {
  name: string;
  dataType: string;
}

export interface DomainObjectAttributeCreateResponseDto {
  id: string;
  domainObjectId: string;
  name: string;
  dataType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DomainObjectAttributeDto {
  id: string;
  domainObjectId: string;
  name: string;
  dataType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DomainObjectAttributesPageResponse {
  content: DomainObjectAttributeDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export class DomainObjectAttributeService {
  private api: AxiosInstance;
  private BASE_URL = "/domain-object-service/v1/projects";

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  async createAttribute(
    projectId: string,
    domainObjectId: string,
    attributeData: DomainObjectAttributeCreateRequestDto
  ): Promise<DomainObjectAttributeCreateResponseDto> {
    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/domain-objects/${domainObjectId}/attributes`,
      attributeData
    );
    return response.data;
  }

  async getAttribute(
    projectId: string,
    domainObjectId: string,
    attributeId: string
  ): Promise<DomainObjectAttributeDto> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/domain-objects/${domainObjectId}/attributes/${attributeId}`
    );
    return response.data;
  }

  async getAllAttributes(
    projectId: string,
    domainObjectId: string,
    page = 0,
    size = 10
  ): Promise<DomainObjectAttributesPageResponse> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/domain-objects/${domainObjectId}/attributes`,
      {
        params: {
          page,
          size,
        },
      }
    );
    return response.data;
  }

  async updateAttribute(
    projectId: string,
    domainObjectId: string,
    attributeId: string,
    attributeData: DomainObjectAttributeCreateRequestDto
  ): Promise<DomainObjectAttributeCreateResponseDto> {
    const response = await this.api.put(
      `${this.BASE_URL}/${projectId}/domain-objects/${domainObjectId}/attributes/${attributeId}`,
      attributeData
    );
    return response.data;
  }

  async deleteAttribute(
    projectId: string,
    domainObjectId: string,
    attributeId: string
  ): Promise<void> {
    await this.api.delete(
      `${this.BASE_URL}/${projectId}/domain-objects/${domainObjectId}/attributes/${attributeId}`
    );
  }
}
