from rest_framework import serializers
import cloudinary.uploader
from django.db import transaction
import json
from .models import (
    Category, Course, LearningObjective, CourseRequirement, Section, SectionItem,
    Video, Assessment, Question, Choice
)

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
    
    class Meta:
        model = Course
        fields = [
            'id', 'category', 'title', 'description', 'thumbnail', 'freemium', 'step', 'thumbnail_file',
            'subscription', 'subscription_amount', 'video_session', 'chat_upto', 'safe_period', 'is_complete', 'is_available'
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
    # documents = SupportingDocumentSerializer(many=True, required=False)
    class Meta:
        model = SectionItem
        fields = ['id', 'section', 'title', 'order', 'item_type', 'thumbnail_file', 'video_file', 'video_data', 'assessment_data']
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
        print('outside valid SectionItem')  
        return data

    def create(self, validated_data):
        print('inside create SectionItem')
        with transaction.atomic():
            video_file = validated_data.pop('video_file', None)
            thumbnail_file = validated_data.pop('thumbnail_file', None)
            video_data = validated_data.pop('video_data', None)  # will contain duration
            assessment_json = validated_data.pop('assessment_data', None)
            
            
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

    class Meta:
        model = SectionItem
        fields = ['id', 'title', 'order', 'item_type', 'video', 'assessment']

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