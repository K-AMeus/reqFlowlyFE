import { AxiosInstance } from "axios";

export interface DomainObjectCreateRequestDto {
  name: string;
}

export interface DomainObjectCreateResponseDto {
  id: string;
  projectId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DomainObjectsCreateRequestDto {
  domainObjectsWithAttributes: Record<
    string,
    DomainObjectAttributeCreateRequestDto[]
  >;
}

export interface DomainObjectsCreateResponseDto {
  domainObjects: DomainObjectResponseDto[];
}

export interface DomainObjectResponseDto {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  attributes: DomainObjectAttributeCreateResponseDto[];
}

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

export interface DomainObjectsWithAttributesResponseDto {
  domainObjectsWithAttributes: Record<string, DomainObjectAttributeDto[]>;
}

export interface DomainObjectDto {
  id: string;
  projectId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DomainObjectsPageResponse {
  content: DomainObjectDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export class DomainObjectService {
  private api: AxiosInstance;
  private BASE_URL = "/domain-object-service/v1/projects";

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  async createDomainObject(
    projectId: string,
    domainObjectData: DomainObjectCreateRequestDto
  ): Promise<DomainObjectCreateResponseDto> {
    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/domain-objects`,
      domainObjectData
    );
    return response.data;
  }

  async createDomainObjectsBatch(
    projectId: string,
    requirementId: string,
    domainObjectsWithAttributes: Record<string, string[]>
  ): Promise<DomainObjectsCreateResponseDto> {
    const payload: DomainObjectsCreateRequestDto = {
      domainObjectsWithAttributes: {},
    };

    for (const [domainName, attributes] of Object.entries(
      domainObjectsWithAttributes
    )) {
      const attributeDtos = attributes.map((attrName) => ({
        name: attrName,
        dataType: "string",
      }));

      payload.domainObjectsWithAttributes[domainName] = attributeDtos;
    }

    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/domain-objects`,
      payload
    );
    return response.data;
  }

  async getDomainObject(
    projectId: string,
    domainObjectId: string
  ): Promise<DomainObjectDto> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/domain-objects/${domainObjectId}`
    );
    return response.data;
  }

  async getAllDomainObjects(
    projectId: string,
    page = 0,
    size = 10
  ): Promise<DomainObjectsPageResponse> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/domain-objects`,
      {
        params: {
          page,
          size,
        },
      }
    );
    return response.data;
  }

  async getAllDomainObjectsWithAttributes(
    projectId: string
  ): Promise<DomainObjectsWithAttributesResponseDto> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/domain-objects`
    );
    return response.data;
  }

  async updateDomainObject(
    projectId: string,
    requirementId: string,
    domainObjectId: string,
    domainObjectData: DomainObjectCreateRequestDto
  ): Promise<DomainObjectCreateResponseDto> {
    const response = await this.api.put(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/domain-objects/${domainObjectId}`,
      domainObjectData
    );
    return response.data;
  }

  async deleteDomainObject(
    projectId: string,
    requirementId: string,
    domainObjectId: string
  ): Promise<void> {
    await this.api.delete(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/domain-objects/${domainObjectId}`
    );
  }
}
