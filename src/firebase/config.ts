import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAyT6t9Dr6DBdXOe_Ca034GdfNZ0JLhs8w",
  authDomain: "flowspec-9ce0c.firebaseapp.com",
  projectId: "flowspec-9ce0c",
  storageBucket: "flowspec-9ce0c.firebasestorage.app",
  messagingSenderId: "491471908555",
  appId: "1:491471908555:web:1d44715bf49da56058b54e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
