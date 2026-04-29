export const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const withAuth = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
});
