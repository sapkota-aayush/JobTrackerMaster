// Dummy job data (replace with your real data)
const jobs = [
  {
    id: 1,
    company: "Google",
    location: "Mountain View",
    title: "Software Engineer",
    description: "Build cool stuff",
    salary: 150000,
    appliedDate: "2024-06-10",
    status: "APPLIED",
    workType: "FULL_TIME",
  },
  {
    id: 2,
    company: "Amazon",
    location: "Seattle",
    title: "DevOps Engineer",
    description: "Maintain infrastructure",
    salary: 130000,
    appliedDate: "2024-05-20",
    status: "INTERVIEWED",
    workType: "FULL_TIME",
  },
];

// Elements
const modal = document.getElementById("jobModal");
const jobForm = document.getElementById("jobForm");
const modalTitle = modal.querySelector(".modal-title");
const closeModalBtn = document.getElementById("closeJobModal");
const addJobBtn = document.getElementById("addJobBtn");
const jobList = document.getElementById("jobList");
const saveJobBtn = document.getElementById("saveJob");

// Input fields
const inputJobId = document.getElementById("jobId");
const inputCompany = document.getElementById("company");
const inputLocation = document.getElementById("location");
const inputTitle = document.getElementById("title");
const inputDescription = document.getElementById("description");
const inputSalary = document.getElementById("salary");
const inputAppliedDate = document.getElementById("appliedDate");
const inputStatus = document.getElementById("status");
const inputWorkType = document.getElementById("workType");

// Function to open modal for Add or Edit
function openModal(mode, jobData = null) {
  if (mode === "add") {
    modalTitle.textContent = "Add New Job Application";
    jobForm.reset();
    inputJobId.value = ""; // Clear job id for add
  } else if (mode === "edit" && jobData) {
    modalTitle.textContent = "Edit Job Application";
    inputJobId.value = jobData.id;
    inputCompany.value = jobData.company;
    inputLocation.value = jobData.location;
    inputTitle.value = jobData.title;
    inputDescription.value = jobData.description;
    inputSalary.value = jobData.salary || "";
    inputAppliedDate.value = jobData.appliedDate;
    inputStatus.value = jobData.status;
    inputWorkType.value = jobData.workType || "";
  }
  modal.style.display = "flex";
}

// Close modal function
function closeModal() {
  modal.style.display = "none";
}

// Render jobs list with edit buttons
function renderJobs() {
  jobList.innerHTML = "";
  jobs.forEach((job) => {
    const jobItem = document.createElement("div");
    jobItem.className = "job-item";
    jobItem.innerHTML = `
      <div>
        <strong>${job.title}</strong> at ${job.company} (${job.location})
      </div>
      <button class="edit-job-btn" data-id="${job.id}">Edit</button>
    `;
    jobList.appendChild(jobItem);
  });

  // Add click listeners for all edit buttons
  const editButtons = document.querySelectorAll(".edit-job-btn");
  editButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      const jobToEdit = jobs.find((j) => j.id === id);
      if (jobToEdit) openModal("edit", jobToEdit);
    })
  );
}

// Event Listeners
addJobBtn.addEventListener("click", () => openModal("add"));
closeModalBtn.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

saveJobBtn.addEventListener("click", () => {
  // Gather data from form
  const jobData = {
    id: inputJobId.value ? parseInt(inputJobId.value) : Date.now(), // simple id gen
    company: inputCompany.value.trim(),
    location: inputLocation.value.trim(),
    title: inputTitle.value.trim(),
    description: inputDescription.value.trim(),
    salary: inputSalary.value ? Number(inputSalary.value) : null,
    appliedDate: inputAppliedDate.value,
    status: inputStatus.value,
    workType: inputWorkType.value,
  };

  if (
    !jobData.company ||
    !jobData.location ||
    !jobData.title ||
    !jobData.description ||
    !jobData.appliedDate ||
    !jobData.status
  ) {
    alert("Please fill in all required fields");
    return;
  }

  if (inputJobId.value) {
    // Edit existing job
    const index = jobs.findIndex((j) => j.id === jobData.id);
    if (index !== -1) {
      jobs[index] = jobData;
      alert("Job updated!");
    }
  } else {
    // Add new job
    jobs.push(jobData);
    alert("Job added!");
  }

  renderJobs();
  closeModal();
});

// Initial render
renderJobs();
