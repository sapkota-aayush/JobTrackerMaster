from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    def __str__(self):
        return self.user.username


LIST_CHOICES = (
    ("WISH_LIST", "Wish List"),
    ("APPLIED", "Applied"),
    ("SHORTLISTED", "Shortlisted"),
    ("REJECTED", "Rejected"),
    ("INTERVIEWED", "Interviewed"),
    ("OFFERED", "Offered"),
    ("ACCEPTED", "Accepted"),
    ("DECLINED", "Declined"),
)


class JobModel(models.Model):
    company = models.CharField(max_length=100, verbose_name="Company Name")
    location = models.CharField(max_length=100, verbose_name="Location")
    title = models.CharField(max_length=100, verbose_name="Job Title")
    description = models.TextField(verbose_name="Job Description")
    salary = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Salary"
    )
    applied_on = models.DateTimeField(verbose_name="Date of Action")
    user = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name="jobs"
    )
    status = models.CharField(
        max_length=20, choices=LIST_CHOICES, default="WISH_LIST", verbose_name="Status"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Last Updated")

    def __str__(self):
        return f"{self.title} at {self.company}"

    class Meta:
        ordering = ["-applied_on"]
        verbose_name = "Job"
        verbose_name_plural = "Jobs"
