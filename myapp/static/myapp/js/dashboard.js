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
const elements = {
  addJobBtn: document.getElementById("addJobBtn"),
  jobModal: document.getElementById("jobModal"),
  closeJobModal: document.getElementById("closeJobModal"),
  cancelJob: document.getElementById("cancelJob"),
  addFirstJobBtn: document.getElementById("addFirstJobBtn"),
  jobList: document.getElementById("jobList"),
  noJobsMessage: document.getElementById("noJobsMessage"),
  logoutButton: document.getElementById("logoutButton"),
  logoutModalElement: document.getElementById("logoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout"),
  saveJobBtn: document.getElementById("saveJob"),
  welcomeText: document.getElementById("welcomeText"),
  userAvatar: document.getElementById("userAvatar"),
  jobForm: document.getElementById("jobForm"),
  chatBtn: document.getElementById("chatBtn"),
  chatWindow: document.getElementById("chatWindow"),
  closeChatBtn: document.getElementById("closeChatBtn"),
  chatInput: document.getElementById("chatInput"),
  chatBody: document.getElementById("chatBody"),
  chatSendBtn: document.getElementById("chatSendBtn"),
};

// --- State ---
let currentEditingJobId = null;

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

// --- User Initialization ---
function initializeUserElements() {
  // Get the DOM elements
  const avatarElement = document.getElementById("userAvatar");
  const welcomeElement = document.getElementById("welcomeText");

  // Check if elements exist
  if (!avatarElement || !welcomeElement) {
    console.error("User elements not found!");
    return;
  }

  // Get username from data attributes
  const username =
    avatarElement.dataset.username || welcomeElement.dataset.username;

  if (!username) {
    console.warn("Username not found in data attributes");
    return;
  }

  // Update welcome text
  welcomeElement.textContent = `Welcome, ${username}!`;

  // Generate and set initials
  const initials = username
    .split(" ")
    .filter((name) => name.length > 0) // Filter out empty names
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .substring(0, 2); // Max 2 letters

  avatarElement.textContent = initials || "?";
}

// --- Modal Functionality ---
function openJobModal() {
  // Reset form and clear editing state
  currentEditingJobId = null;
  document.getElementById("jobForm").reset();
  document.getElementById("modalTitle").textContent = "Add New Job";
  document.getElementById("saveJob").textContent = "Save Job";
  
  // Set today's date as default
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  document.getElementById("appliedDate").value = formattedDate;
  
  // Show modal
  elements.jobModal.style.display = "flex";
}

function closeModal() {
  elements.jobModal.style.display = "none";
  // Reset form when closing
  currentEditingJobId = null;
  document.getElementById("jobForm").reset();
  document.getElementById("modalTitle").textContent = "Add New Job";
  document.getElementById("saveJob").textContent = "Save Job";
}

// --- Job Card Rendering ---
function addJobCard(job) {
  if (elements.noJobsMessage) {
    elements.noJobsMessage.style.display = "none";
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
        <div class="d-flex justify-content-between align-items-start">
          <div class="company-name">${job.company}</div>
          <button class="btn btn-sm btn-outline-primary edit-job-btn" data-job-id="${
            job.id
          }">
            <i class="bi bi-pencil"></i> Edit
          </button>
        </div>
        <p class="job-description">${job.description.substring(0, 120)}${
    job.description.length > 120 ? "..." : ""
  }</p>
        <div class="job-details">
          <div>
            <i class="bi bi-geo-alt me-1"></i> ${job.location}
          </div>
          <div>
            <i class="bi bi-calendar me-1"></i> ${formatDate(job.applied_on)}
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

  elements.jobList.appendChild(card);
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

  const updateCount = (id, count) => {
    const element = document.getElementById(id);
    if (element) element.textContent = `${count} job${count !== 1 ? "s" : ""}`;
  };

  updateCount("wishlistCount", counts.WISH_LIST);
  updateCount("appliedCount", counts.APPLIED);
  updateCount("interviewCount", counts.INTERVIEWED);
  updateCount("offerCount", counts.OFFERED);
  updateCount("rejectedCount", counts.REJECTED);
  updateCount("shortListedCount", counts.SHORTLISTED);
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

    const response = await fetch("/api/get/", {
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
    elements.jobList.innerHTML = "";

    if (jobs.length === 0 && elements.noJobsMessage) {
      elements.noJobsMessage.style.display = "block";
    } else {
      if (elements.noJobsMessage) elements.noJobsMessage.style.display = "none";
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
      body: JSON.stringify({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description,
        salary: jobData.salary ? parseInt(jobData.salary) : null,
        applied_on: jobData.appliedDate,
        status: jobData.status,
        work_type: jobData.workType || null,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        showToast("Session expired. Please login again.", false);
        setTimeout(() => (window.location.href = "/login/"), 2000);
      } else {
        const errorData = await response.json();
        // Handle duplicate job error specifically
        if (errorData.error && errorData.error.includes("already exists")) {
          throw new Error(errorData.error);
        }
        throw new Error(errorData.detail || errorData.error || "Failed to save job");
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving job:", error);
    throw error;
  }
}

// --- Event Handlers ---
function setupEventListeners() {
  // Job Modal
  if (elements.addJobBtn)
    elements.addJobBtn.addEventListener("click", openJobModal);
  if (elements.addFirstJobBtn)
    elements.addFirstJobBtn.addEventListener("click", openJobModal);
  if (elements.closeJobModal)
    elements.closeJobModal.addEventListener("click", closeModal);
  if (elements.cancelJob)
    elements.cancelJob.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === elements.jobModal) closeModal();
  });

  // Save Job event listener is now handled in edit.js

  // Logout
  if (elements.logoutButton) {
    elements.logoutButton.addEventListener("click", function (e) {
      e.preventDefault();
      elements.logoutModalElement.style.display = "flex";
    });
  }

  if (elements.cancelLogout) {
    elements.cancelLogout.addEventListener("click", function () {
      elements.logoutModalElement.style.display = "none";
    });
  }

  if (elements.logoutModalElement) {
    elements.logoutModalElement.addEventListener("click", function (e) {
      if (e.target === elements.logoutModalElement) {
        elements.logoutModalElement.style.display = "none";
      }
    });
  }

  if (elements.confirmLogout) {
    elements.confirmLogout.addEventListener("click", async function () {
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
          setTimeout(() => (window.location.href = "/login/"), 1500);
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
  }

  // Chat Functionality
  if (elements.chatBtn) {
    elements.chatBtn.onclick = () => {
      elements.chatWindow.style.display = "flex";
      elements.chatInput.focus();
    };
  }

  if (elements.closeChatBtn) {
    elements.closeChatBtn.onclick = () => {
      elements.chatWindow.style.display = "none";
    };
  }

  if (elements.chatSendBtn) {
    elements.chatSendBtn.onclick = sendChat;
  }

  if (elements.chatInput) {
    elements.chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") sendChat();
    });
  }
}

// --- Chat Function ---
async function sendChat() {
  const msg = elements.chatInput.value.trim();
  if (!msg) return;

  // Show user's message
  elements.chatBody.innerHTML += `<div><strong>You:</strong> ${msg}</div>`;
  elements.chatInput.value = "";
  elements.chatBody.scrollTop = elements.chatBody.scrollHeight;

  const accessToken = getCookie("access_token");
  const csrfToken = getCookie("csrftoken");

  if (!accessToken) {
    elements.chatBody.innerHTML += `<div><strong>🤖:</strong> Error: Not authenticated. Please log in again.</div>`;
    elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
    return;
  }

  try {
    const response = await fetch("/api/ai-assistant/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ message: msg }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error || `HTTP error: ${response.status}`;
      elements.chatBody.innerHTML += `<div><strong>🤖:</strong> Error: ${errorMsg}</div>`;
      elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
      return;
    }

    const data = await response.json();
    elements.chatBody.innerHTML += `<div><strong>🤖:</strong> ${data.reply}</div>`;
    elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
  } catch (err) {
    elements.chatBody.innerHTML += `<div><strong>🤖:</strong> Error: Network error or server unreachable.</div>`;
    elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
  }
}

// --- Initialize Dashboard ---
function initializeDashboard() {
  initializeUserElements();

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

  // Setup event listeners
  setupEventListeners();
}

// --- DOM Ready ---
document.addEventListener("DOMContentLoaded", initializeDashboard);
