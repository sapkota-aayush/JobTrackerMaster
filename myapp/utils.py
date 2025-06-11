from django.core.mail import send_mail
from django.conf import settings
from celery import shared_task
import time

@shared_task
def send_contact_email_task(name, email, message):
    subject = f"New Contact Message from {name}"
    body = f"Email: {email}\n\nMessage:\n{message}"
    time.sleep(15)  # Simulates a delay (like heavy processing)
    
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['aayushsapkota1030@gmail.com'],
        fail_silently=False,
    )
