from datetime import timedelta
from rest_framework import serializers
import cloudinary.uploader
from django.db import transaction
from django.db.models import Sum
import json
from .models import (
    Category, Course, LearningObjective, CourseRequirement, Section, SectionItem, Review, Report,
    Video, Assessment, Question, Choice, SupportingDocument, Purchase, SectionItemCompletion, VideoSession
)
from .services import CallUserService, UserServiceException
from banners.utils import get_ad_content


call_user_service = CallUserService()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('slug', 'created_at', 'updated_at')

    def validate_title(self, value):
        normalized_title = value.lower()
        qs = Category.objects.filter(title__iexact=normalized_title)
        if self.instance:  # update
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A category with this title already exists (case-insensitive).")
        return value

class CategorySerializerUser(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'title', 'slug', 'description', 'image']
        read_only_fields = ('id', 'title', 'slug', 'description', 'image')

class CourseSerializer(serializers.ModelSerializer):
    thumbnail_file = serializers.ImageField(write_only=True, required=True)
    # thumbnail = serializers.CharField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'category', 'title', 'description', 'thumbnail', 'freemium', 'step', 'thumbnail_file',
            'subscription', 'subscription_amount', 'video_session', 'chat_upto', 'safe_period', 'is_complete', 'is_available',
            'average_rating', 'total_reviews'
        ]
        read_only_fields = ('id', 'thumbnail')

    def validate_title(self, value):
        normalized_title = value.strip().lower()
        instance = self.instance  # Get the current instance during update
        queryset = Course.objects.filter(title__iexact=normalized_title)
        if instance:
            queryset = queryset.exclude(id=instance.id)  # Exclude current instance during update, other wise always true.
        if queryset.exists():
            raise serializers.ValidationError(f"A course with the title '{value}' already exists (case-insensitive).")
        return value
    
    def validate(self, data):
        print('subsctiption:', data.get('subscription'), 'amount', data.get('subscription_amount'))
        if data.get('subscription') and (data.get('subscription_amount') is None or data.get('subscription_amount') <= 0):
            raise serializers.ValidationError("Subscription amount is required and should be greater than 0 if subscription is enabled.")
        return data
    
    def get_average_rating(self, obj):
        return obj.get_average_rating()

    def get_total_reviews(self, obj):
        return obj.get_total_reviews()

class LearningObjectiveSerializer(serializers.ModelSerializer):
    # id = serializers.IntegerField(read_only=True)
    objective = serializers.CharField(max_length=300)

    class Meta:
        model = LearningObjective
        fields = ['id', 'objective', 'order']
        extra_kwargs = {'order': {'required': True}}
        read_only_fields = ('id',)

class CourseRequirementSerializer(serializers.ModelSerializer):
    # id = serializers.IntegerField(read_only=True)
    requirement = serializers.CharField(max_length=300)

    class Meta:
        model = CourseRequirement
        fields = ['id', 'requirement', 'order']
        extra_kwargs = {'order': {'required': True}}
        read_only_fields = ('id',)

class CourseObjectivesRequirementsSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    objectives = LearningObjectiveSerializer(many=True)
    requirements = CourseRequirementSerializer(many=True)

    def create(self, validated_data):
        course = Course.objects.get(id=validated_data['course_id'])
        
        # Create objectives
        objectives_data = validated_data['objectives']
        objectives = [
            LearningObjective(course=course, **obj_data)
            for obj_data in objectives_data
        ]
        LearningObjective.objects.bulk_create(objectives)

        # Create requirements
        requirements_data = validated_data['requirements']
        requirements = [
            CourseRequirement(course=course, **req_data)
            for req_data in requirements_data
        ]
        CourseRequirement.objects.bulk_create(requirements)
        course.save()
        return validated_data

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['id', 'course', 'title', 'order']
        extra_kwargs = {
            'course': {'required': True}
        }

class SupportingDocumentSerializer(serializers.ModelSerializer):
    pdf_file = serializers.FileField(write_only=True, required=False, allow_null=True)
    pdf_url = serializers.URLField(read_only=True, source='pdf_file')

    class Meta:
        model = SupportingDocument
        fields = ['id', 'title', 'pdf_file', 'pdf_url']

    def create(self, validated_data):
        pdf_file = validated_data.pop('pdf_file', None)
        if pdf_file:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                pdf_file,
                resource_type="raw",
                folder="course/documents/",
                public_id=f"doc_{validated_data.get('title').lower().replace(' ', '_')}",
                overwrite=True
            )
            validated_data['pdf_file'] = upload_result['secure_url']
        return super().create(validated_data)
    
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'choices']

    def validate_choices(self, value):
        if len(value) != 4:
            raise serializers.ValidationError("Each question must have 4 choices")
        if not any(choice['is_correct'] for choice in value):
            raise serializers.ValidationError("At least one choice must be correct")
        return value

    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            choice_serializer = ChoiceSerializer(data=choice_data)
            choice_serializer.is_valid(raise_exception=True)
            choice_serializer.save(question=question)
        return question
        
class AssessmentSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Assessment
        fields = ['id', 'instructions', 'passing_score', 'questions']

    def validate_questions(self, value):
        if len(value) < 1:
            raise serializers.ValidationError("Assessment must have atleast 4 questions")
        return value
    
    def create(self, validated_data):
        questions_datas = validated_data.pop('questions')
        assessment = Assessment.objects.create(**validated_data)
        
        for question_data in questions_datas:
            question_serializer = QuestionSerializer(data=question_data)
            question_serializer.is_valid(raise_exception=True)
            question_serializer.save(assessment=assessment)  # Pass the assessment instance        
        return assessment

class VideoSerializer(serializers.ModelSerializer):
    video_file = serializers.FileField(write_only=True, required=False)
    thumbnail_file = serializers.FileField(write_only=True, required=False)
    video_url = serializers.URLField(read_only=True)
    
    class Meta:
        model = Video
        fields = ['id', 'video_url', 'thumbnail', 'duration', 'video_file', 'thumbnail_file']

    def create(self, validated_data):
        video_file = validated_data.pop('video_file', None)
        thumbnail_file = validated_data.pop('thumbnail_file', None)

        if video_file:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                video_file,
                resource_type="video",
                folder="course/videos/",
            )
            validated_data['video_url'] = upload_result['secure_url']
        
        if thumbnail_file:
            thumbnail_result = cloudinary.uploader.upload(
                thumbnail_file,
                resource_type="image",
                folder="course/video_thumbnails/",
                public_id=f"thumbnail_{validated_data.get('section_item').title.lower().replace(' ', '_')}",
                overwrite=True
            )
            validated_data['thumbnail'] = thumbnail_result['secure_url']

        validated_data['duration'] = int(upload_result.get('duration', 0))
        return super().create(validated_data)
        
class SectionItemSerializer(serializers.ModelSerializer):
    # video = VideoSerializer(required=False)
    # assessment = AssessmentSerializer(required=False)

    video_file = serializers.FileField(write_only=True, required=False)
    thumbnail_file = serializers.FileField(write_only=True, required=False, allow_null=True)
    video_data = serializers.CharField(write_only=True, required=False)
    assessment_data = serializers.CharField(write_only=True, required=False)
    document_data = serializers.CharField(write_only=True, required=False)
    document_file = serializers.FileField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = SectionItem
        fields = ['id', 'section', 'title', 'order', 'item_type', 'thumbnail_file', 'video_file', 
                'video_data', 'assessment_data', 'document_data', 'document_file']
        extra_kwargs = {
            'section': {'required': True}
        }

    def validate(self, data):
        print('inside valid SectionItem')
        item_type = data.get('item_type')
        
        if item_type == 'video' and 'video_file' not in data:
            raise serializers.ValidationError("Video data is required for video item type")
        if item_type == 'assessment' and 'assessment_data' not in data:
            raise serializers.ValidationError("Assessment data is required for assessment item type")
        if item_type == 'video' and 'assessment_data' in data:
            raise serializers.ValidationError("Assessment data should not be provided for video item type")
        if item_type == 'assessment' and 'video_file' in data:
            raise serializers.ValidationError("Video data should not be provided for assessment item type")
        if 'document_data' in data and 'document_file' not in data:
            raise serializers.ValidationError("Document file is required when supporting document data is provided")
        print('outside valid SectionItem')  
        return data

    def create(self, validated_data):
        print('inside create SectionItem')
        with transaction.atomic():
            video_file = validated_data.pop('video_file', None)
            thumbnail_file = validated_data.pop('thumbnail_file', None)
            video_data = validated_data.pop('video_data', None)  # will contain duration
            assessment_json = validated_data.pop('assessment_data', None)
            document_json = validated_data.pop('document_data', None)
            document_file = validated_data.pop('document_file', None)
            print('docs:', document_file, document_json)
            section_item = SectionItem.objects.create(**validated_data)
            
            if video_data:
                video_data = json.loads(video_data)  # Parse the JSON string
                video_data['section_item'] = section_item
                video_data['video_file'] = video_file
                video_data['thumbnail_file'] = thumbnail_file
                VideoSerializer().create(video_data)

            elif assessment_json:
                assessment_data = json.loads(assessment_json)
                assessment_data['section_item'] = section_item
                AssessmentSerializer().create(assessment_data)
            
                # questions_data = assessment_data.pop('questions')
                # assessment = Assessment.objects.create(section_item=section_item, **assessment_data)
                # for question_data in questions_data:
                #     choices_data = question_data.pop('choices')
                #     question = Question.objects.create(assessment=assessment, **question_data)
                    
                #     for choice_data in choices_data:
                #         Choice.objects.create(question=question, **choice_data)
            
            if document_json:
                document_data = json.loads(document_json)
                document_data['section_item'] = section_item
                document_data['pdf_file'] = document_file
                SupportingDocumentSerializer().create(document_data)
            print('outside create SectionItem')
            return section_item

class VideoDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'video_url', 'thumbnail', 'duration']

class AssessmentDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'instructions', 'passing_score', 'questions']

class SectionItemDetailSerializer(serializers.ModelSerializer):
    video = VideoDetailSerializer(read_only=True)
    assessment = AssessmentDetailSerializer(read_only=True)
    documents = SupportingDocumentSerializer(read_only=True)

    class Meta:
        model = SectionItem
        fields = ['id', 'title', 'order', 'item_type', 'video', 'assessment', 'documents']

class SectionDetailSerializer(serializers.ModelSerializer):
    items = SectionItemDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'title', 'order', 'items', 'course']

class CourseDetailSerializer(serializers.ModelSerializer):
    sections = SectionDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "category", "title", "description", "thumbnail", "instructor", "freemium", 
                  "subscription", "subscription_amount", "is_available", "is_complete", "step", 
                  "video_session", "chat_upto", "safe_period", "created_at", "updated_at", "sections"]
        
class CourseAnalyticsSerializer(serializers.ModelSerializer):
    section_count = serializers.SerializerMethodField()
    video_count = serializers.SerializerMethodField()
    assessment_count = serializers.SerializerMethodField()
    total_video_duration = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()
    total_admission = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'section_count',
            'video_count',
            'assessment_count',
            'total_video_duration',
            'document_count',
            'total_admission',
        ]

    def get_section_count(self, obj):
        return obj.sections.count()

    def get_video_count(self, obj):
        return SectionItem.objects.filter(
            section__course=obj,
            item_type='video'
        ).count()

    def get_assessment_count(self, obj):
        return SectionItem.objects.filter(
            section__course=obj,
            item_type='assessment'
        ).count()

    def get_total_video_duration(self, obj):
        total_duration = Video.objects.filter(
            section_item__section__course=obj
        ).aggregate(total_duration=Sum('duration'))['total_duration'] or 0
        
        # Convert to hours, minutes, seconds format
        hours = total_duration // 3600
        minutes = (total_duration % 3600) // 60
        seconds = total_duration % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def get_document_count(self, obj):
        return SupportingDocument.objects.filter(
            section_item__section__course=obj
        ).count()
    
    def get_total_admission(self, obj):
        return Purchase.objects.filter(course=obj).count()

class CourseUnAuthDetailSerializer(serializers.ModelSerializer):
    objectives = LearningObjectiveSerializer(many=True, read_only=True)
    requirements = CourseRequirementSerializer(many=True, read_only=True)
    analytics = serializers.SerializerMethodField()
    instructor_details = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'description',
            'thumbnail',
            'instructor',
            'freemium',
            'subscription',
            'subscription_amount',
            'video_session',
            'chat_upto',
            'safe_period',
            'created_at',
            'updated_at',
            'objectives',
            'requirements',
            'analytics',
            'instructor_details',
            'average_rating',
            'total_reviews'
        ]

    def get_analytics(self, obj):
        analytics_serializer = CourseAnalyticsSerializer(obj)
        return analytics_serializer.data
    
    def get_instructor_details(self, obj):
            try:
                response_user_service = call_user_service.get_user_details(obj.instructor)
                return response_user_service.json()
            except UserServiceException as e:
                # You might want to handle this error differently based on your requirements
                return {"error": str(e)}
            except Exception as e:
                return {"error": "Failed to fetch instructor details"}

    def get_average_rating(self, obj):
        return obj.get_average_rating()

    def get_total_reviews(self, obj):
        return obj.get_total_reviews()

class PurchaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'
        read_only_fields = ['purchased_at', 'completed']

    def validate(self, data):
        print('inside validate')
        try:
            course = data.get('course')
            purchase_type= data.get('purchase_type')
            subscription_amount= data.get('subscription_amount')
            video_session= data.get('video_session')
            chat_upto= data.get('chat_upto')
            safe_period= data.get('safe_period')
            stripe_payment_intent_id = data.get('stripe_payment_intent_id')
            print('inside try:', course, purchase_type, subscription_amount, video_session, chat_upto, safe_period)
        except TypeError:
            raise serializers.ValidationError('Invalid data format')
        except KeyError as e:
            raise serializers.ValidationError(f"Missing field: {str(e)}")

        if purchase_type == 'freemium' and not course.freemium:
            raise serializers.ValidationError('Freemium option is not available for this course')
        
        if purchase_type == 'subscription' and not course.subscription:
            raise serializers.ValidationError('Subscription option is not available for this course')

        if subscription_amount is not None and subscription_amount != course.subscription_amount:
            raise serializers.ValidationError('Invalid subscription amount')
        
        if video_session is not None and video_session != course.video_session:
            raise serializers.ValidationError('Invalid video session')
        
        if chat_upto is not None and chat_upto != course.chat_upto:
            raise serializers.ValidationError('Invalid chat limit')
        
        if safe_period is not None and safe_period != course.safe_period:
            raise serializers.ValidationError('Invalid safe period')
        
        # Check if the course is available and complete
        if not course.is_available or not course.is_complete:
            raise serializers.ValidationError('This course is not available')
        
        if purchase_type=='subscription' and not stripe_payment_intent_id:
            raise serializers.ValidationError('stripe_payment_intent_id is necessary for subscription')

        return data

    def create(self, validated_data):
        return Purchase.objects.create(**validated_data)

class StudentMyCourseSerializer(serializers.ModelSerializer):
    course_id = serializers.CharField(source='course.id')
    course_title = serializers.CharField(source='course.title')
    course_description = serializers.CharField(source='course.description')
    course_thumbnail = serializers.URLField(source='course.thumbnail')
    course_total_section_items = serializers.SerializerMethodField()
    purchase_type = serializers.CharField()
    completed_section_items = serializers.SerializerMethodField()
    video_session_status = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = [
            'id',
            'course_id',
            'course_title',
            'course_description',
            'course_thumbnail',
            'course_total_section_items',
            'purchase_type',
            'completed_section_items',
            'video_session_status'
        ]

    def get_completed_section_items(self, obj):
        # Count how many section items are completed for this purchase
        return SectionItemCompletion.objects.filter(
            purchase=obj,
            completed=True
        ).count()
    
    def get_course_total_section_items(self, obj):
        # Count total section items for the course related to this purchase
        return SectionItem.objects.filter(section__course=obj.course).count()
    
    def get_video_session_status(self, obj):
        # Count total section items for the course related to this purchase
        print('session status:', obj.video_sessions.first())
        return obj.video_sessions.first().status if obj.video_sessions.first() else None


# class StudentMyCourseDetailSerializer(serializers.ModelSerializer):
#     objectives = LearningObjectiveSerializer(many=True, read_only=True)
#     requirements = CourseRequirementSerializer(many=True, read_only=True)
#     sections = SectionDetailSerializer(many=True, read_only=True)
#     analytics = serializers.SerializerMethodField()

#     class Meta:
#         model = Course
#         fields = [
#             'id',
#             'category',
#             'title',
#             'description',
#             'thumbnail',
#             'instructor',
#             'freemium',
#             'subscription',
#             'subscription_amount',
#             'video_session',
#             'chat_upto',
#             'safe_period',
#             'created_at',
#             'updated_at',
#             'objectives',
#             'requirements',
#             'sections',
#             'analytics',
#         ]

#     def get_analytics(self, obj):
#         analytics_serializer = CourseAnalyticsSerializer(obj)
#         return analytics_serializer.data

class SectionItemCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionItemCompletion
        fields = ['section_item', 'completed', 'completed_at']

class SectionItemDetailWithCompletionSerializer(serializers.ModelSerializer):
    video = VideoDetailSerializer(read_only=True)
    assessment = AssessmentDetailSerializer(read_only=True)
    documents = SupportingDocumentSerializer(read_only=True)
    completion = serializers.SerializerMethodField()

    class Meta:
        model = SectionItem
        fields = ['id', 'title', 'order', 'item_type', 'video', 'assessment', 'documents', 'completion']

    def get_completion(self, obj):
        # Get the purchase object from the context (passed from parent serializer)
        purchase = self.context.get('purchase')
        if purchase:
            try:
                completion = SectionItemCompletion.objects.get(
                    purchase=purchase,
                    section_item=obj
                )
                return SectionItemCompletionSerializer(completion).data
            except SectionItemCompletion.DoesNotExist:
                return {'section_item': obj.id, 'completed': False, 'completed_at': None}
        return None

class SectionDetailWithItemsSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'title', 'order', 'items']

    def get_items(self, obj):
        # Pass the purchase context to the SectionItemDetailWithCompletionSerializer
        items = obj.items.all()
        return SectionItemDetailWithCompletionSerializer(
            items,
            many=True,
            context={'purchase': self.context.get('purchase')}
        ).data

class StudentMyCourseDetailSerializer(serializers.ModelSerializer):
    course = serializers.SerializerMethodField()
    course_total_section_items = serializers.SerializerMethodField()
    purchase_type = serializers.CharField()
    completed_section_items = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField()
    ad_viewed = serializers.SerializerMethodField()
    ads = serializers.SerializerMethodField()
    video_session = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = [
            'id',
            'course',
            'course_total_section_items',
            'purchase_type',
            'completed_section_items',
            'sections',
            'ad_viewed',
            'ads',
            'video_session',
        ]

    def get_course_total_section_items(self, obj):
        return SectionItem.objects.filter(section__course=obj.course).count()

    def get_completed_section_items(self, obj):
        return SectionItemCompletion.objects.filter(
            purchase=obj,
            completed=True
        ).count()

    def get_sections(self, obj):
        sections = Section.objects.filter(course=obj.course)
        return SectionDetailWithItemsSerializer(
            sections,
            many=True,
            context={'purchase': obj}
        ).data
   
    def get_course(self, obj):
        course = obj.course
        return CourseUnAuthDetailSerializer(course).data
    
    def get_ad_viewed(self, obj):
        return SectionItemCompletion.objects.filter(
            purchase=obj,
            ad_viewed=True
        ).values_list('section_item__id', flat=True)
    
    def get_ads(self, obj):  # <--- new method
        if obj.purchase_type == 'freemium':
            return get_ad_content()
        return None
    
    def get_video_session(self, obj):
        sessions = obj.video_sessions.all()
        serializer = VideoSessionSerializer(sessions, many=True)
        return serializer.data if sessions else None
    
    
class TutorCourseSerializer(serializers.ModelSerializer):
    total_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()

    class Meta:
        model = Course
        fields = ['id', 'instructor', 'total_courses', 'total_enrollments']

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'rating', 'review', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_rating(self, value):
        if value <= 0 or value > 5:
            raise serializers.ValidationError("Rating must be between 0 and 5")
        return value
    
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'

class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'report', 'created_at']
        read_only_fields = ['id', 'created_at']
    
class ReportSerializer(serializers.ModelSerializer):
    instructor = serializers.IntegerField(source='course.instructor')
    course_title = serializers.CharField(source='course.title')
    purchase_details = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'course', 'course_title', 'user', 'report', 'resolved', 'status', 'reason', 'instructor', 'created_at', 'purchase_details']
        read_only_fields = ['id', 'created_at']

    def get_purchase_details(self, obj):
        purchase = Purchase.objects.get(course=obj.course, user=obj.user)
        purchase_details = {
            'purchase_type': purchase.purchase_type,
            'subscription_amount': purchase.subscription_amount,
            'purchased_at': purchase.purchased_at,
            'expire_at': purchase.safe_period_expiry if purchase.purchase_type == 'subscription' else None
        }
        # print('purchase_details:', purchase_details)
        return purchase_details

class VideoSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoSession
        fields = ["id", "tutor", "student", "purchase", "room_id", "status", "scheduled_time", "is_active", "created_at"]
        read_only_fields = ["id", "purchase", "room_id", "created_at"]

        