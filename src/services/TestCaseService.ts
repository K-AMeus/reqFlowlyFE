import { AxiosInstance } from "axios";

export interface TestCaseCreateReqDto {
  useCaseName: string;
  useCaseContent: string;
}

export interface TestCaseCreateResDto {
  id: string;
  name: string;
  content: string;
}

export interface TestCaseDto {
  name: string;
  content: string;
}

export class TestCaseService {
  private api: AxiosInstance;
  private BASE_URL: string = "/test-case-service/v1/projects";

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  async createTestCases(
    projectId: string,
    requirementId: string,
    useCaseId: string,
    data: TestCaseCreateReqDto
  ): Promise<TestCaseCreateResDto> {
    const response = await this.api.post(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases/${useCaseId}/test-cases`,
      data
    );
    return response.data;
  }

  async getTestCases(
    projectId: string,
    requirementId: string,
    useCaseId: string
  ): Promise<TestCaseCreateResDto[]> {
    const response = await this.api.get(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases/${useCaseId}/test-cases`
    );
    return response.data;
  }

  async updateTestCase(
    projectId: string,
    requirementId: string,
    useCaseId: string,
    testCaseId: string,
    data: TestCaseDto
  ): Promise<TestCaseCreateResDto> {
    const response = await this.api.put(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases/${useCaseId}/test-cases/${testCaseId}`,
      data
    );
    return response.data;
  }

  async deleteTestCase(
    projectId: string,
    requirementId: string,
    useCaseId: string,
    testCaseId: string
  ): Promise<void> {
    await this.api.delete(
      `${this.BASE_URL}/${projectId}/requirements/${requirementId}/use-cases/${useCaseId}/test-cases/${testCaseId}`
    );
  }
}
