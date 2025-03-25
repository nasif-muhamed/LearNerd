import os
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, FileExtensionValidator, MaxLengthValidator
from django.core.exceptions import ValidationError

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
    instructor = models.BigIntegerField()
    freemium = models.BooleanField(default=True)
    subscription = models.BooleanField(default=True)
    subscription_amount = models.DecimalField(max_digits=10, decimal_places=2, default=None, null=True, blank=True, validators=[MinValueValidator(0)])
    is_available = models.BooleanField(default=False)
    is_complete = models.BooleanField(default=False)
    step = models.PositiveIntegerField(default=1)
    video_session = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)
    chat_upto = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)  # in days
    safe_period = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=True, blank=True, default=None)  # time period where a student's payment will be held by the admin
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

def validate_pdf(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.pdf']
    if ext not in valid_extensions:
        raise ValidationError('Unsupported file type. Only PDFs are allowed.')
    
class SupportingDocument(models.Model):
    section_item = models.ForeignKey(SectionItem, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(
        upload_to='course/supporting_documents/',
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf']),
            MaxLengthValidator(5 * 1024 * 1024),  # 5MB limit
        ]
    )    
    size = models.PositiveIntegerField(blank=True, null=True)  # Store file size in bytes

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.file:
            self.size = self.file.size
        super().save(*args, **kwargs)