import { NavigateFunction } from "react-router-dom";

export const navigateTo = (navigate: NavigateFunction, path: string): void => {
  navigate(path);
};

export const navigateToProject = (
  navigate: NavigateFunction,
  projectId: string | undefined
): void => {
  if (!projectId) {
    console.error("Project ID is undefined!");
    return;
  }

  navigate(`/projects/${projectId}`);
};

export const navigateToDomainObjects = (
  navigate: NavigateFunction,
  projectId: string | undefined
): void => {
  if (!projectId) {
    console.error("Project ID is undefined!");
    return;
  }

  navigate(`/projects/${projectId}/domain-objects`);
};

export const navigateToUseCases = (
  navigate: NavigateFunction,
  projectId: string | undefined
): void => {
  if (!projectId) {
    console.error("Project ID is undefined!");
    return;
  }

  navigate(`/projects/${projectId}/use-cases`);
};

export const navigateToTestCases = (
  navigate: NavigateFunction,
  projectId: string | undefined
): void => {
  if (!projectId) {
    console.error("Project ID is undefined!");
    return;
  }

  navigate(`/projects/${projectId}/test-cases`);
};
