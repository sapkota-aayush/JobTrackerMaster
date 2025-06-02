// Get DOM elements
const logoutButton = document.getElementById("logoutButton");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const successToast = document.getElementById("successToast");
const errorToast = document.getElementById("errorToast");

// Show logout confirmation modal
logoutButton.addEventListener("click", function (e) {
  e.preventDefault();
  logoutModal.style.display = "flex";
});

// Hide modal when cancel is clicked
cancelLogout.addEventListener("click", function () {
  logoutModal.style.display = "none";
});

// Hide modal when clicking outside the modal
logoutModal.addEventListener("click", function (e) {
  if (e.target === logoutModal) {
    logoutModal.style.display = "none";
  }
});

// Function to get a cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Function to show toast notification
function showToast(toastElement, message = "") {
  if (message) {
    toastElement.querySelector(".toast-body").innerHTML = message;
  }
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}

// Logout function
confirmLogout.addEventListener("click", async function () {
  try {
    // Get access token from cookie
    const accessToken = getCookie("access_token");
    if (!accessToken) {
      showToast(
        errorToast,
        '<i class="bi bi-exclamation-triangle me-2"></i> No access token found!'
      );
      return;
    }

    // Make logout request with authentication
    const response = await fetch("/api/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    if (response.ok) {
      // Show success toast
      showToast(successToast);

      // Close the modal
      logoutModal.style.display = "none";

      // Clear access token cookie
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Redirect to login page after a delay
      setTimeout(() => {
        window.location.href = "/login/";
      }, 1500);
    } else {
      // Handle specific error cases
      if (response.status === 401) {
        showToast(
          errorToast,
          '<i class="bi bi-exclamation-triangle me-2"></i> Session expired. Please login again.'
        );
        setTimeout(() => {
          window.location.href = "/login/";
        }, 2000);
      } else {
        showToast(
          errorToast,
          `<i class="bi bi-exclamation-triangle me-2"></i> Logout failed (${response.status})`
        );
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
    showToast(
      errorToast,
      '<i class="bi bi-exclamation-triangle me-2"></i> Network error during logout'
    );
  }
});

// Initialize Bootstrap Toasts
const successToastInstance = new bootstrap.Toast(successToast, {
  autohide: true,
  delay: 3000,
});

const errorToastInstance = new bootstrap.Toast(errorToast, {
  autohide: true,
  delay: 5000,
});
