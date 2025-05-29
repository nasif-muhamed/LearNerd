import os
import uuid
from datetime import timedelta
from django.utils import timezone
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, FileExtensionValidator, MaxLengthValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from cloudinary.models import CloudinaryField

class Category(models.Model):
    title = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)  # For SEO-friendly URLs
    description = models.TextField()
    image = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

class Course(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses')
    title = models.CharField(max_length=255, db_index=True, unique=True)
    description = models.TextField()
    thumbnail = models.URLField(blank=True, null=True)
    instructor = models.BigIntegerField(db_index=True)
    freemium = models.BooleanField(default=True)
    subscription = models.BooleanField(default=True)
    subscription_amount = models.DecimalField(max_digits=10, decimal_places=2, default=None, null=True, blank=True, validators=[MinValueValidator(0.00)])
    is_available = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    is_complete = models.BooleanField(default=False)
    step = models.PositiveIntegerField(default=1)
    video_session = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)
    chat_upto = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)  # in days
    safe_period = models.PositiveIntegerField(validators=[MinValueValidator(1),], null=True, blank=True, default=None)  # time period where a student's payment will be held by the admin
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.subscription:
            self.subscription_amount = None
            self.video_session = None
            self.chat_upto = None
            self.safe_period = None
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title', 'is_available']),  # Composite index for common queries
        ]

    def get_average_rating(self):
        reviews = Review.objects.filter(course=self)
        if reviews.exists(): 
            avg = reviews.aggregate(models.Avg('rating'))['rating__avg']
            return round(avg, 1)
        return 0

    def get_total_reviews(self):
        return Review.objects.filter(course=self).count()

class LearningObjective(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='objectives')
    objective = models.TextField(max_length=300, blank=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['course', 'objective'], name='unique_objective_per_course'),
        ]

    def __str__(self):
        return self.objective

class CourseRequirement(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='requirements')
    requirement = models.TextField(max_length=300, blank=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['course', 'requirement'], name='unique_requirement_per_course'),
        ]

    def __str__(self):
        return self.requirement
    
class Section(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0, db_index=True)  # Indexed for sorting

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['course', 'title'], name='unique_section_title_per_course'),
        ]

    def __str__(self):
        return f"{self.title} - {self.course.title}"
    
class SectionItem(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='items')
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0, db_index=True)  # Indexed for sorting

    ITEM_TYPES = (
        ('video', 'Video'),
        ('assessment', 'Assessment'),
    )
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['section', 'title'], name='unique_section_item_title_per_section'),
        ]

    def __str__(self):
        return f"{self.title} ({self.item_type})"
    
class Video(models.Model):
    section_item = models.OneToOneField(SectionItem, on_delete=models.CASCADE, related_name='video')
    video_url = models.URLField(blank=True, null=True)  # URL to video hosted in claudinary
    thumbnail = models.URLField(blank=True, null=True)
    duration = models.PositiveIntegerField(default=0)  # Duration in seconds

    def __str__(self):
        return f"Video for {self.section_item.title}"

class Assessment(models.Model):
    section_item = models.OneToOneField(SectionItem, on_delete=models.CASCADE, related_name='assessment')
    instructions = models.TextField(blank=True, null=True)
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=70.00) # percentage

    def __str__(self):
        return f"Assessment for {self.section_item.title}"
    
    @property
    def total_questions(self):
        return self.questions.count()

class Question(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['text', 'assessment'], name='unique_question_text_per_assesment'),
        ]

    def __str__(self):
        return self.text

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['question', 'text'], name='unique_choice_text_per_question'),
        ]

    def __str__(self):
        return self.text

# def validate_pdf(value):
#     ext = os.path.splitext(value.name)[1].lower()
#     valid_extensions = ['.pdf']
#     if ext not in valid_extensions:
#         raise ValidationError('Unsupported file type. Only PDFs are allowed.')
    
class SupportingDocument(models.Model):
    section_item = models.OneToOneField(SectionItem, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    pdf_file = CloudinaryField('pdf', resource_type='raw', blank=True, null=True)

    def __str__(self):
        return self.title

class Purchase(models.Model):
    PURCHASE_TYPE_CHOICES = (
        ('subscription', 'Subscription'),
        ('freemium', 'Freemium')
    )
    user = models.BigIntegerField()
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="purchases")
    purchase_type = models.CharField(max_length=20, choices=PURCHASE_TYPE_CHOICES)
    subscription_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    payment_status = models.CharField(max_length=20, default=None, null=True, blank=True)  # Pending, Completed, Failed
    video_session = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)
    chat_upto = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)  # in days
    safe_period = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)  # time period where a student's payment will be held by the admin
    completed = models.BooleanField(default=False)  # Mark if the course is completed
    stripe_payment_intent_id = models.CharField(max_length=100, null=True, blank=True)
    # stripe_checkout_session_id = models.CharField(max_length=100, null=True, blank=True)
    purchased_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # Track purchase date

    class Meta:
        ordering = ['-purchased_at']
        unique_together = ('user', 'course')

    def __str__(self):
        return f"{self.user} + {self.course.title}"
    
    @property
    def is_completed(self):
        total_section_items = SectionItem.objects.filter(section__course=self.course).count()
        completed_items = self.section_items_completed.filter(completed=True).count()
        return total_section_items == completed_items

    @property
    def safe_period_expiry(self):
        if self.safe_period and self.purchased_at:
            return self.purchased_at + timedelta(days=self.safe_period)
        return None
    
    @property
    def is_safe_period_over(self):
        if self.safe_period_expiry:
            return self.safe_period_expiry < timezone.now()
        return False

class SectionItemCompletion(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="section_items_completed")
    section_item = models.ForeignKey(SectionItem, on_delete=models.CASCADE, related_name="section_item_completion")
    completed = models.BooleanField(default=False)
    ad_viewed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('purchase', 'section_item')

class Review(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    user = models.BigIntegerField(db_index=True)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])
    review = models.TextField(validators=[MaxLengthValidator(500)], blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('course', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user} for {self.course.title}"

class Report(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
        ('refunded', 'Refunded'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reports')
    # purchase = models.OneToOneField(Purchase, on_delete=models.CASCADE, related_name='reports')
    user = models.BigIntegerField(db_index=True)
    report = models.TextField(validators=[MaxLengthValidator(500)], blank=True, null=True)
    resolved = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField(validators=[MaxLengthValidator(500)], blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('course', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"Report by {self.user} for {self.course.title}"

class NoteSectionItem(models.Model):
    section_item = models.ForeignKey(SectionItem, on_delete=models.CASCADE, related_name='notes')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Notes for {self.section_item.title}"

class VideoSession(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
    )

    tutor = models.BigIntegerField(db_index=True)
    student = models.BigIntegerField(db_index=True)
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="video_sessions")
    room_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    scheduled_time = models.DateTimeField(null=True, blank=True)
    ending_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=30, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Session {self.room_id} - {self.tutor} with {self.student}"

    @property
    def is_upcoming(self):
        return self.scheduled_time > timezone.now()

