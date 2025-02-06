from rest_framework import serializers
from .models import Badges, Questions, Answers


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answers
        fields = ['id', 'options', 'answer', 'is_correct']
        read_only_fields = ['id']


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
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Badges
        fields = ['id', 'title', 'description', 'image', 'community', 'total_questions', 'pass_mark', 'questions']
        read_only_fields = ['id']

    def validate(self, data):
        total_questions = data.get('total_questions')
        pass_mark = data.get('pass_mark')
        questions = data.get('questions')

        # Ensure total_questions and the number of questions match
        if len(questions) != total_questions:
            raise serializers.ValidationError("The number of questions must match the total questions field.")

        # Ensure pass_mark is less than or equal to total_questions
        if pass_mark > total_questions:
            raise serializers.ValidationError("pass mark cannot exceed total_questions.")

        # Ensure total_questions and pass_mark are natural numbers
        if total_questions < 1 or pass_mark < 1:
            raise serializers.ValidationError("total questions and pass_mark must be natural number.")

        return data

    def create(self, validated_data):
        print(validated_data)
        questions_data = validated_data.pop('questions')
        badge = Badges.objects.create(**validated_data)
        for question_data in questions_data:
            answers_data = question_data.pop('answers')
            question = Questions.objects.create(badge_id=badge, **question_data)
            for answer_data in answers_data:
                Answers.objects.create(question_id=question, **answer_data)
        return badge


class SimplifiedBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badges
        fields = ['id', 'title', 'description', 'image', 'community', 'total_questions', 'pass_mark']
        read_only_fields = ['id']
