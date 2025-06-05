// dashboard.js
// --- Constants ---
const STATUS_MAP = {
  WISH_LIST: { text: "Wishlist", color: "info" },
  APPLIED: { text: "Applied", color: "primary" },
  SHORTLISTED: { text: "Shortlisted", color: "info" },
  REJECTED: { text: "Rejected", color: "danger" },
  INTERVIEWED: { text: "Interviewed", color: "warning" },
  OFFERED: { text: "Offered", color: "success" },
  ACCEPTED: { text: "Accepted", color: "success" },
  DECLINED: { text: "Declined", color: "secondary" },
};

// --- DOM Elements ---
const addJobBtn = document.getElementById("addJobBtn");
const jobModal = document.getElementById("jobModal");
const closeJobModal = document.getElementById("closeJobModal");
const cancelJob = document.getElementById("cancelJob");
const addFirstJobBtn = document.getElementById("addFirstJobBtn");
const jobList = document.getElementById("jobList");
const noJobsMessage = document.getElementById("noJobsMessage");
const logoutButton = document.getElementById("logoutButton");
const logoutModalElement = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const saveJobBtn = document.getElementById("saveJob");
const welcomeText = document.getElementById("welcomeText");
const userAvatar = document.getElementById("userAvatar");

// --- Modal Functionality ---
function openJobModal() {
  jobModal.style.display = "flex";
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  document.getElementById("appliedDate").value = formattedDate;
}

function closeModal() {
  jobModal.style.display = "none";
}

addJobBtn.addEventListener("click", openJobModal);
if (addFirstJobBtn) {
  addFirstJobBtn.addEventListener("click", openJobModal);
}

closeJobModal.addEventListener("click", closeModal);
cancelJob.addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
  if (e.target === jobModal) closeModal();
});

// --- Helper Functions ---
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function showToast(message, isSuccess = true) {
  const toastElement = isSuccess
    ? document.getElementById("successToast")
    : document.getElementById("errorToast");
  const messageElement = isSuccess
    ? document.getElementById("toastMessage")
    : document.getElementById("errorToastMessage");

  messageElement.textContent = message;
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: isSuccess ? 3000 : 5000,
  });
  toast.show();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

// --- Job Card Rendering ---
function addJobCard(job) {
  if (noJobsMessage) {
    noJobsMessage.style.display = "none";
  }

  const statusInfo = STATUS_MAP[job.status] || {
    text: job.status,
    color: "secondary",
  };

  const card = document.createElement("div");
  card.className = "col-lg-6 col-xl-4 mb-4";
  card.innerHTML = `
        <div class="job-card card h-100">
            <div class="card-header">
                <h5 class="card-title">${job.title}</h5>
                <span class="status-badge badge bg-${statusInfo.color}">${
    statusInfo.text
  }</span>
            </div>
            <div class="card-body">
                <div class="company-name">${job.company}</div>
                <p class="job-description">${job.description.substring(
                  0,
                  120
                )}${job.description.length > 120 ? "..." : ""}</p>
                <div class="job-details">
                    <div>
                        <i class="bi bi-geo-alt me-1"></i> ${job.location}
                    </div>
                    <div>
                        <i class="bi bi-calendar me-1"></i> ${formatDate(
                          job.applied_on
                        )}
                    </div>
                </div>
                ${
                  job.salary
                    ? `<div class="salary mt-2"><i class="bi bi-cash me-1"></i> ${formatCurrency(
                        job.salary
                      )}/year</div>`
                    : ""
                }
            </div>
        </div>
    `;

  jobList.appendChild(card);
}

// --- Status Counts ---
function updateStatusCounts(jobs) {
  const counts = {
    WISH_LIST: 0,
    APPLIED: 0,
    SHORTLISTED: 0,
    REJECTED: 0,
    INTERVIEWED: 0,
    OFFERED: 0,
    ACCEPTED: 0,
    DECLINED: 0,
  };

  jobs.forEach((job) => {
    if (job.status in counts) {
      counts[job.status]++;
    }
  });

  document.getElementById("wishlistCount").textContent =
    counts["WISH_LIST"] + " jobs";
  document.getElementById("appliedCount").textContent =
    counts["APPLIED"] + " jobs";
  document.getElementById("interviewCount").textContent =
    counts["INTERVIEWED"] + " jobs";
  document.getElementById("offerCount").textContent =
    counts["OFFERED"] + " jobs";
  document.getElementById("rejectedCount").textContent =
    counts["REJECTED"] + " jobs";
}

// --- API Functions ---
async function loadJobs() {
  try {
    const accessToken = getCookie("access_token");
    const csrfToken = getCookie("csrftoken");

    if (!accessToken) {
      showToast("Authentication required. Please login again.", false);
      setTimeout(() => (window.location.href = "/login/"), 2000);
      return;
    }

    const response = await fetch("/api/jobs/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFToken": csrfToken,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        showToast("Session expired. Please login again.", false);
        setTimeout(() => (window.location.href = "/login/"), 2000);
      } else {
        throw new Error(`Failed to load jobs: ${response.status}`);
      }
      return;
    }

    const jobs = await response.json();

    // Clear current job list
    jobList.innerHTML = "";

    if (jobs.length === 0 && noJobsMessage) {
      noJobsMessage.style.display = "block";
    } else {
      if (noJobsMessage) noJobsMessage.style.display = "none";
      jobs.forEach((job) => addJobCard(job));
    }

    updateStatusCounts(jobs);
  } catch (error) {
    console.error("Error loading jobs:", error);
    showToast("Failed to load jobs: " + error.message, false);
  }
}

async function saveJob(jobData) {
  const accessToken = getCookie("access_token");
  const csrfToken = getCookie("csrftoken");

  if (!accessToken) {
    showToast("Authentication required. Please login again.", false);
    setTimeout(() => (window.location.href = "/login/"), 2000);
    return null;
  }

  try {
    const response = await fetch("/api/board/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        showToast("Session expired. Please login again.", false);
        setTimeout(() => (window.location.href = "/login/"), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save job");
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving job:", error);
    throw error;
  }
}

// --- Save Job Handler ---
saveJobBtn.addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const company = document.getElementById("company").value.trim();
  const location = document.getElementById("location").value.trim();
  const description = document.getElementById("description").value.trim();
  const salary = document.getElementById("salary").value;
  const appliedDate = document.getElementById("appliedDate").value;
  const status = document.getElementById("status").value;
  const workType = document.getElementById("workType").value;

  if (
    !title ||
    !company ||
    !location ||
    !description ||
    !appliedDate ||
    !status
  ) {
    showToast("Please fill in all required fields", false);
    return;
  }

  const jobData = {
    title,
    company,
    location,
    description,
    salary: salary ? parseInt(salary) : null,
    applied_on: appliedDate,
    status,
    work_type: workType || null,
  };

  try {
    const job = await saveJob(jobData);
    if (job) {
      addJobCard(job);
      updateStatusCounts([job]);
      closeModal();
      document.getElementById("jobForm").reset();
      showToast("Job saved successfully!");
    }
  } catch (error) {
    showToast("Failed to save job: " + error.message, false);
  }
});

// --- Logout Functionality ---
logoutButton.addEventListener("click", function (e) {
  e.preventDefault();
  logoutModalElement.style.display = "flex";
});

cancelLogout.addEventListener("click", function () {
  logoutModalElement.style.display = "none";
});

logoutModalElement.addEventListener("click", function (e) {
  if (e.target === logoutModalElement) {
    logoutModalElement.style.display = "none";
  }
});

confirmLogout.addEventListener("click", async function () {
  try {
    const accessToken = getCookie("access_token");
    const csrfToken = getCookie("csrftoken");

    if (!accessToken) {
      showToast("No active session found", false);
      return;
    }

    const response = await fetch("/api/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
    });

    if (response.ok) {
      // Clear access token cookie
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      showToast("Logout successful!");

      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = "/login/";
      }, 1500);
    } else {
      if (response.status === 401) {
        showToast("Session expired. Redirecting to login...", false);
        setTimeout(() => (window.location.href = "/login/"), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Logout failed");
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Logout failed: " + error.message, false);
  }
});

// --- Initialize Dashboard ---
document.addEventListener("DOMContentLoaded", () => {
  // Set user info
  const username = "{{ user.username }}"; // From Django context
  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  welcomeText.textContent = `Welcome, ${username}!`;
  userAvatar.textContent = initials;

  // Check authentication
  const accessToken = getCookie("access_token");
  if (!accessToken) {
    showToast("Authentication required. Redirecting to login...", false);
    setTimeout(() => (window.location.href = "/login/"), 2000);
    return;
  }

  // Load jobs
  loadJobs();

  // Initialize toasts
  new bootstrap.Toast(document.getElementById("successToast"), {
    autohide: true,
    delay: 3000,
  });
  new bootstrap.Toast(document.getElementById("errorToast"), {
    autohide: true,
    delay: 5000,
  });
});
