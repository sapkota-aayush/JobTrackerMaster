// =============================================================================
// EDIT.JS - Job Edit Functionality
// =============================================================================

// =============================================================================
// API FUNCTIONS
// =============================================================================

// Function to fetch job details by ID
async function fetchJobDetails(jobId) {
  try {
    const accessToken = getCookie("access_token");
    const csrfToken = getCookie("csrftoken");

    if (!accessToken) {
      showToast("Authentication required. Please login again.", false);
      setTimeout(() => (window.location.href = "/login/"), 2000);
      return null;
    }

    const response = await fetch(`/api/get/${jobId}/`, {
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
        throw new Error(`Failed to fetch job details: ${response.status}`);
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching job details:", error);
    showToast("Failed to fetch job details: " + error.message, false);
    return null;
  }
}

// Function to update job
async function updateJob(jobId, jobData) {
  try {
    const accessToken = getCookie("access_token");
    const csrfToken = getCookie("csrftoken");

    if (!accessToken) {
      showToast("Authentication required. Please login again.", false);
      setTimeout(() => (window.location.href = "/login/"), 2000);
      return null;
    }

    const response = await fetch("/api/update/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({
        id: jobId,
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
        throw new Error(errorData.detail || "Failed to update job");
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating job:", error);
    throw error;
  }
}

// =============================================================================
// FORM MANAGEMENT
// =============================================================================

// Function to populate form with job data
function populateJobForm(job) {
  document.getElementById("title").value = job.title || "";
  document.getElementById("company").value = job.company || "";
  document.getElementById("location").value = job.location || "";
  document.getElementById("description").value = job.description || "";
  document.getElementById("salary").value = job.salary || "";
  document.getElementById("appliedDate").value = job.applied_on ? job.applied_on.split('T')[0] : "";
  document.getElementById("status").value = job.status || "";
  document.getElementById("workType").value = job.work_type || "";
}

// Function to clear form
function clearJobForm() {
  document.getElementById("jobForm").reset();
  currentEditingJobId = null;
  document.getElementById("modalTitle").textContent = "Add New Job";
  document.getElementById("saveJob").textContent = "Save Job";
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================

// Function to open edit modal
async function openEditModal(jobId) {
  try {
    const job = await fetchJobDetails(jobId);
    if (job) {
      currentEditingJobId = jobId;
      populateJobForm(job);
      document.getElementById("modalTitle").textContent = "Edit Job";
      document.getElementById("saveJob").textContent = "Update Job";
      document.getElementById("jobModal").style.display = "flex";
    }
  } catch (error) {
    showToast("Failed to load job details: " + error.message, false);
  }
}

// =============================================================================
// SAVE/UPDATE HANDLING
// =============================================================================

// Function to handle save/update job
async function handleSaveJob() {
  // Prevent double submission
  const saveBtn = document.getElementById("saveJob");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = currentEditingJobId ? "Updating..." : "Saving...";

  try {
    // Get all form values
    const title = document.getElementById("title").value.trim();
    const company = document.getElementById("company").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();
    const salary = document.getElementById("salary").value;
    const appliedDate = document.getElementById("appliedDate").value;
    const status = document.getElementById("status").value;
    const workType = document.getElementById("workType").value;

    // Validate required fields
    if (!title || !company || !location || !description || !appliedDate || !status) {
      showToast("Please fill in all required fields", false);
      return;
    }

    const jobData = {
      title,
      company,
      location,
      description,
      salary,
      appliedDate,
      status,
      workType,
    };

    let result;
    if (currentEditingJobId) {
      // Update existing job
      result = await updateJob(currentEditingJobId, jobData);
      if (result) {
        showToast("Job updated successfully!");
      }
    } else {
      // Create new job
      result = await saveJob(jobData);
      if (result) {
        showToast("Job saved successfully!");
      }
    }

    if (result) {
      closeModal();
      clearJobForm();
      loadJobs(); // Reload the job list
    }
  } catch (error) {
    showToast("Failed to save job: " + error.message, false);
  } finally {
    // Re-enable button
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Function to setup edit event listeners
function setupEditEventListeners() {
  // Add event delegation for edit buttons (since they're dynamically created)
  document.addEventListener("click", async (e) => {
    if (e.target.closest(".edit-job-btn")) {
      const editBtn = e.target.closest(".edit-job-btn");
      const jobId = editBtn.getAttribute("data-job-id");
      if (jobId) {
        await openEditModal(jobId);
      }
    }
  });

  // Update the save button event listener to handle both create and update
  const saveJobBtn = document.getElementById("saveJob");
  if (saveJobBtn) {
    // Remove existing event listener if any
    saveJobBtn.removeEventListener("click", handleSaveJob);
    // Add new event listener
    saveJobBtn.addEventListener("click", handleSaveJob);
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize edit functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  setupEditEventListeners();
});

// =============================================================================
// EXPORTS
// =============================================================================

// Export functions for use in dashboard.js if needed
window.editJob = openEditModal;
window.updateJob = updateJob;
window.fetchJobDetails = fetchJobDetails;
