export default function getClientUrl() {
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";

  if (process.env.APP_NAME === "Bordt") return "https://bordt.hubsite.app";

  return "error://";
}
