import { User } from "firebase/auth";
import axios from "axios";

export const getAuthHeader = async (currentUser: User | null) => {
  if (!currentUser) return {};

  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const apiConfig = {
  baseURL: "https://spec2testbe-production.up.railway.app/api",
  withCredentials: true,
};

export const createAuthenticatedRequest = async (currentUser: User | null) => {
  const headers = await getAuthHeader(currentUser);

  return axios.create({
    baseURL: apiConfig.baseURL,
    headers,
    withCredentials: apiConfig.withCredentials,
  });
};
