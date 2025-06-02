// Password show/hide toggle
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
togglePassword.addEventListener("click", function () {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  eyeIcon.className = type === "password" ? "bi bi-eye" : "bi bi-eye-slash";
});

// Get CSRF token from cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

document
  .getElementById("login-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");
    errorMessage.innerText = "";

    try {
      const response = await fetch("http://localhost:8080/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include", // Very important for cookies like refresh_token
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        document.cookie = `access_token=${data.access_token}; path=/;`;
        window.location.href = "/dashboard/";
      } else {
        errorMessage.innerText = data.error || "Login failed.";
      }
    } catch (err) {
      console.error("Login failed:", err);
      errorMessage.innerText = "Something went wrong. Try again.";
    }
  });
