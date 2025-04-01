from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminCategoryViewSet, UserCategoryView, CourseCreateAPIView, CreateObjectivesRequirementsView, ObjectiveListView, TutorCourseListAPIView,
    RequirementListView, ObjectiveUpdateView, RequirementUpdateView, ObjectiveDeleteView, RequirementDeleteView, SectionCreateView,
    SectionItemCreateView, SectionContentView, CourseInCompleteView, SectionDeleteView, SectionItemDeleteView, ListDraftsView, DeleteDraftView,
    CourseUnAuthDetailView, 
)

router = DefaultRouter()
router.register(r'categories', AdminCategoryViewSet)

urlpatterns = [
    path('', CourseCreateAPIView.as_view(), name='course-creation'),
    path('<int:id>/', CourseUnAuthDetailView.as_view(), name='course-detail'),
    
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
    
    path('incomplete-sections/<int:section_id>/content/', SectionContentView.as_view(), name='section-content'),
    path('incomplete-course/<int:course_id>/content/', CourseInCompleteView.as_view(), name='incomplete-course'),
    path('', include(router.urls)),
]
