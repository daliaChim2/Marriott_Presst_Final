export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("nombre");
  localStorage.removeItem("correo");
  localStorage.removeItem("user");
  window.location.href = "/login";
};
