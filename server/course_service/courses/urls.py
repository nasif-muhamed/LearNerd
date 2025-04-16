from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminCategoryViewSet, UserCategoryView, CourseCreateAPIView, CreateObjectivesRequirementsView, ObjectiveListView, TutorCourseListAPIView,
    RequirementListView, ObjectiveUpdateView, RequirementUpdateView, ObjectiveDeleteView, RequirementDeleteView, SectionCreateView,
    SectionItemCreateView, CourseInCompleteView, SectionDeleteView, SectionItemDeleteView, ListDraftsView, DeleteDraftView,
    CourseUnAuthDetailView, CoursePurchaseView, StudentMyCoursesListView, StudentMyCourseDetailView, StudentAssessmentSubmitView, StudentLectureSubmitView,
    TutorToggleActivationCourseView, StudentFetchTopTutorsView, StudentTutorAnalysisView, TutorCoursePreviewView, ReviewListCreateAPIView, StudentCourseReviewsView,
    AdminUserCoursesDetailsView, StripeWebhookView, CreatePaymentIntentView,
)

router = DefaultRouter()
router.register(r'categories', AdminCategoryViewSet)

urlpatterns = [
    path('', CourseCreateAPIView.as_view(), name='course-creation'),
    path('<int:id>/', CourseUnAuthDetailView.as_view(), name='course-detail'),
    path('stream/<int:course_id>/', StudentMyCourseDetailView.as_view(), name='course-auth-detail'),
    path('toggle-activation/', TutorToggleActivationCourseView.as_view(), name='activate-deactivate'),
    
    path('tutor/uploaded-courses/', TutorCourseListAPIView.as_view(), name='tutor-courses'),
    path('drafts/', ListDraftsView.as_view(), name='list-drafts'),
    path('draft/<int:course_id>', DeleteDraftView.as_view(), name='delete-draft'),

    path('categories/user/', UserCategoryView.as_view(), name='categories-user'),

    # Create objectives and requirements
    path('objectives-requirements/', CreateObjectivesRequirementsView.as_view(), name='create-objectives-requirements'),
    
    # Fetch objectives and requirements
    path('<int:course_id>/objectives/', ObjectiveListView.as_view(), name='objective-list'),
    path('<int:course_id>/requirements/', RequirementListView.as_view(), name='requirement-list'),
    
    # Update objectives and requirements
    path('objectives/<int:id>/', ObjectiveUpdateView.as_view(), name='objective-update'),
    path('requirements/<int:id>/', RequirementUpdateView.as_view(), name='requirement-update'),
    
    # Delete objectives and requirements
    path('objectives/<int:id>/delete/', ObjectiveDeleteView.as_view(), name='objective-delete'),
    path('requirements/<int:id>/delete/', RequirementDeleteView.as_view(), name='requirement-delete'),

    path('sections/', SectionCreateView.as_view(), name='section-create'),
    path('sections/<int:id>/delete', SectionDeleteView.as_view(), name='section-delete'),

    path('section-items/', SectionItemCreateView.as_view(), name='section-item-create'),
    path('section-items/<int:id>/delete', SectionItemDeleteView.as_view(), name='section-item-delete'),
    
    # path('incomplete-sections/<int:section_id>/content/', SectionContentView.as_view(), name='section-content'),
    path('incomplete-course/<int:course_id>/content/', CourseInCompleteView.as_view(), name='incomplete-course'),
    path('', include(router.urls)),

    # purchase a course
    path('<int:course_id>/purchase/', CoursePurchaseView.as_view(), name='purchase-course'),
    path('<int:course_id>/create-payment-intent/', CreatePaymentIntentView.as_view(), name='stripe-payment-intent'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    
    # all courses of a user
    path('student/<int:student_id>/my-courses/', StudentMyCoursesListView.as_view(), name='purchased-course-student'),

    # purchased course's section items completion
    path('assessments/<int:assessment_id>/submit/', StudentAssessmentSubmitView.as_view(), name='assessment-submit-course-student'),
    path('lecture/<int:lecture_id>/submit/', StudentLectureSubmitView.as_view(), name='assessment-submit-course-student'),

    path('tutors/', StudentFetchTopTutorsView.as_view(), name='top-tutors'), # to list tutors with pagination and filter by category
    path('tutor/course-details/<int:id>/', StudentTutorAnalysisView.as_view(), name='tutor-analysis'), # tutor analytics like total course and enrollments
    path('tutor/course-preview/<int:course_id>/', TutorCoursePreviewView.as_view(), name='tutor-course-preview'), # to preview the course for a tutor    

    # Create a new review for a course and get all reviews of a course
    path('<int:course_id>/reviews/', ReviewListCreateAPIView.as_view(), name='review-list-create'),    
    # Get all reviews by a specific user
    # path('users/<int:user_id>/reviews/', UserReviewsView.as_view(), name='user-reviews'),
    
    # Get current user's reviews
    path('my-course/<int:course_id>/reviews/', StudentCourseReviewsView.as_view(), name='my-course-reviews'),

    # Get all enrolled course and uploaded courses by a user
    path('admin/user/<int:user_id>/courses/', AdminUserCoursesDetailsView.as_view(), name='my-course-reviews'),
]
