import { AxiosInstance } from "axios";

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectsPageResponse {
  content: Project[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export class ProjectService {
  private api: AxiosInstance;
  private BASE_URL = "/project-service/v1/projects";

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  async getAllProjects(
    page: number,
    size: number,
    sortField: "name" | "createdAt" | "updatedAt",
    sortDirection: "asc" | "desc"
  ): Promise<ProjectsPageResponse> {
    const response = await this.api.get<ProjectsPageResponse>(this.BASE_URL, {
      params: {
        page,
        size,
        orderBy: sortField,
        direction: sortDirection,
      },
    });
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.api.get<Project>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async createProject(projectData: {
    name: string;
    description?: string;
  }): Promise<Project> {
    const response = await this.api.post<Project>(this.BASE_URL, projectData);
    return response.data;
  }

  async updateProject(
    id: string,
    projectData: { name: string; description?: string }
  ): Promise<Project> {
    const response = await this.api.put<Project>(
      `${this.BASE_URL}/${id}`,
      projectData
    );
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`${this.BASE_URL}/${id}`);
  }
}
