from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
# from django.contrib.postgres.fields import JSONBField

class ProfileManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) 
        user.save(using=self._db)
        return user

class Profile(AbstractBaseUser):
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    biography = models.TextField(max_length=1000, blank=True, null=True)
    image = models.ImageField(upload_to='user/profile/images', null=True, blank=True)
    is_tutor = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProfileManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    @property
    def is_profile_completed(self):
        return bool(self.first_name and self.last_name and self.biography)

    @property
    def full_name_or_email(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        return self.email

class AdminUser(models.Model):
    profile = models.ForeignKey(Profile, related_name="admins", on_delete=models.CASCADE)
    username = models.CharField(max_length=100)

class BadgesAquired(models.Model):
    profile = models.ForeignKey(Profile, related_name="badges_aquired", on_delete=models.CASCADE)
    badge_id = models.BigIntegerField()
    badge_title = models.CharField(max_length=50)
    badge_image = models.URLField()
    total_questions = models.IntegerField()
    pass_mark = models.IntegerField()
    aquired_mark = models.IntegerField()
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_passed(self):
        return self.aquired_mark >= self.pass_mark

class NotificationManager(models.Manager):
    def unread(self, user):
        return self.filter(user=user, is_read=False)

    def mark_read(self, user, notification_id):
        return self.filter(user=user, id=notification_id).update(is_read=True)

    def for_type(self, user, notification_type):
        return self.filter(user=user, notification_type=notification_type)

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        COURSE_PURCHASE = 'COURSE_PURCHASE', 'Course Purchase'
        COURSE_REVIEW = 'COURSE_REVIEW', 'Course Review'
        WALLET_CREDIT = 'WALLET_CREDIT', 'Wallet Credit'
        USER_REPORT = 'USER_REPORT', 'User Report'
        CHAT_MESSAGE = 'CHAT_MESSAGE', 'Chat Message'

    user = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='The user receiving the notification'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        help_text='Type of notification'
    )
    message = models.TextField(
        help_text='Human-readable notification message'
    )
    # data = JSONBField(
    #     default=dict,
    #     blank=True,
    #     help_text='Additional metadata for the notification (e.g., course_id, amount)'
    # )
    is_read = models.BooleanField(
        default=False,
        help_text='Whether the notification has been read'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When the notification was created'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='When the notification was last updated'
    )

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    objects = NotificationManager()

    def __str__(self):
        return f"{self.notification_type} for {self.user.username}: {self.message}"
