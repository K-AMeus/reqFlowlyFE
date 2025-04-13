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
