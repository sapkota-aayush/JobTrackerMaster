from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    def __str__(self):
        return self.user.username


class WorkType(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


LIST_CHOICES = (
    ("WISH_LIST", "Wish List"),
    ("APPLIED", "Applied"),
    ("SHORTLISTED", "Shortlisted"),
    ("REJECTED", "Rejected"),
    ("INTERVIEWED", "Interviewed"),
    ("OFFERED", "Offered"),
    ("ACCEPTED", "Accepted"),
    ("DECLINED", "Declined"),
    ('REMOVED','Removed'),
)


class JobModel(models.Model):
    company = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    title = models.CharField(max_length=100)
    description = models.TextField()
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    applied_on = models.DateTimeField()
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="jobs")
    status = models.CharField(max_length=20, choices=LIST_CHOICES, default="WISH_LIST")
    work_type = models.ForeignKey(WorkType, on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} at {self.company}"

    class Meta:
        ordering = ["-applied_on"]
        

class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.email})"
