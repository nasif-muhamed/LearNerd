import json
from rest_framework import serializers
from .models import Badges, Questions, Answers


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answers
        fields = ['id', 'options', 'answer', 'is_correct']
        read_only_fields = ['id']
        # extra_kwargs = {
        #     'is_correct': {'write_only': True}
        # }


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)

    class Meta:
        model = Questions
        fields = ['id', 'question', 'order', 'answers']
        read_only_fields = ['id']

    def validate(self, data):
        answers = data.get('answers')
        if len(answers) != 4:
            raise serializers.ValidationError("Each question must have exactly four options.")
        
        correct_answers = [answer for answer in answers if answer['is_correct']]
        if len(correct_answers) != 1:
            raise serializers.ValidationError("Exactly one answer must be marked as correct.")
        
        return data


class BadgeSerializer(serializers.ModelSerializer):
    questions_raw = serializers.CharField(write_only=True, required=False, allow_null=True)
    questions = QuestionSerializer(many=True, required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Badges
        fields = ['id', 'title', 'description', 'image', 'image_url', 'community', 'total_questions', 'pass_mark', 'is_active', 'questions', 'questions_raw']
        read_only_fields = ['id']
        

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url  # Returns the full URL of the uploaded image
        return None

    def validate(self, data):
        questions_raw = data.pop('questions_raw', None)
        print('questions_raw:', questions_raw)
        if questions_raw:
            try:
                questions = json.loads(questions_raw)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format in questions field.")
        else:
            questions = data.get('questions', [])  # Fallback to empty list if no raw data

        print('questions:', questions)
        # Add parsed questions back to data for nested serializer
        data['questions'] = questions

        return data

    def create(self, validated_data):
        total_questions = validated_data.get('total_questions')
        pass_mark = validated_data.get('pass_mark')
        print('validated_data', validated_data)
        questions_data = validated_data.pop('questions')
        print('questions_data:', questions_data)

        # Ensure total_questions and the number of questions match
        if len(questions_data) != total_questions:
            raise serializers.ValidationError("The number of questions must match the total_questions field.")

        # Ensure pass_mark is less than or equal to total_questions
        if pass_mark > total_questions:
            raise serializers.ValidationError("Pass mark cannot exceed total_questions.")

        # Ensure total_questions and pass_mark are natural numbers
        if total_questions < 1 or pass_mark < 1:
            raise serializers.ValidationError("Total questions and pass_mark must be natural numbers.")

        badge = Badges.objects.create(**validated_data)
        for question_data in questions_data:
            answers_data = question_data.pop('answers')
            question = Questions.objects.create(badge_id=badge, **question_data)
            for answer_data in answers_data:
                Answers.objects.create(question_id=question, **answer_data)
        return badge

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        total_questions = validated_data.get('total_questions')
        if total_questions is None:
            total_questions = instance.total_questions
        pass_mark = validated_data.get('pass_mark')

        if pass_mark and pass_mark > total_questions:
            raise serializers.ValidationError("Pass mark cannot exceed total_questions.")

        # Update only changed fields
        for attr, value in validated_data.items():
            print('attr',getattr(instance, attr) != value, getattr(instance, attr), value)
            if getattr(instance, attr) != value:
                setattr(instance, attr, value)

        instance.save()

        if questions_data:
            # Delete existing questions and answers
            for question in instance.questions.all():
                question.delete()

            # Create new questions and answers
            for question_data in questions_data:
                answers_data = question_data.pop('answers')
                question = Questions.objects.create(badge_id=instance, **question_data)
                for answer_data in answers_data:
                    Answers.objects.create(question_id=question, **answer_data)

        return instance


class SimplifiedBadgeSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Badges
        fields = ['id', 'title', 'description', 'image', 'community', 'total_questions', 'pass_mark']
        read_only_fields = ['id']

    def get_image(self, obj):
        if obj.image:
            return obj.image.url  # This returns the full URL of the image
        return None
