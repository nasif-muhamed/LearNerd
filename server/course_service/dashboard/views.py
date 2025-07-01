import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Case, When, IntegerField, Sum, F, Avg
from django.db.models.functions import TruncYear, TruncMonth, TruncDay, Abs
from courses.models import Course, Purchase, Review, Report, VideoSession
from transactions.models import Transaction
from courses.permissions import IsAdminUserCustom, IsUser
from courses.serializers import CourseSerializer

logger = logging.getLogger(__name__)

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUserCustom]
    def get(self, request):
        filter_type = request.query_params.get('filter', 'all').lower()
        # Define time filters
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        time_filters = {
            'today': {'created_at__gte': today},
            'week': {'created_at__gte': week_start},
            'month': {'created_at__gte': month_start},
            'all': {}
        }
        
        # Get the appropriate filter
        filter_params = time_filters.get(filter_type, time_filters['all'])
        try:
            # Calculate metrics
            # Total Courses (available and not blocked)
            courses_query = Course.objects.filter(is_available=True, is_blocked=False)
            if filter_params:
                courses_query = courses_query.filter(**filter_params)
            total_courses = courses_query.count()
            
            # Total Active Instructors
            total_instructors = courses_query.values('instructor').distinct().count()
            # Total Purchases, Total Completed Courses, Total Students, Total Subscriptions, Total Freemium Purchases
            purchases = Purchase.objects.all()
            if filter_params:
                purchases = purchases.filter(purchased_at__gte=filter_params.get('created_at__gte'))
            total_purchases = purchases.count() 
            completed_courses = purchases.filter(completed=True)
            total_completed_courses = completed_courses.count()
            total_students = purchases.values('user').distinct().count()
            subscriptions_query = purchases.filter(purchase_type='subscription')
            total_subscriptions = subscriptions_query.count()
            freemium_query = purchases.filter(purchase_type='freemium')
            total_freemium = freemium_query.count()
            # Total Fees Collected, Total Refunds, Total Commission, Total Pay Outs
            transactions = Transaction.objects.filter(**filter_params)
            total_sales = transactions.filter(
                transaction_type='course_sale'
            )
            total_fees_collected = total_sales.aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            commission_query = transactions.filter(
                transaction_type='commission'
            )
            total_commission = commission_query.aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            refunds_query = transactions.filter(transaction_type='course_sale', status='refunded')
            total_refunds = refunds_query.aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            payouts_query = transactions.filter(transaction_type='course_sale', status='credited')
            total_payouts = payouts_query.aggregate(total=Sum('amount'))['total'] or 0
            data = {
                'total_courses': total_courses,
                'total_students': total_students,
                'total_instructors': total_instructors,
                'total_purchases': total_purchases,
                'total_completed_courses': total_completed_courses,
                'total_subscriptions': total_subscriptions,
                'total_freemium': total_freemium,
                'total_fees_collected': float(total_fees_collected),
                'total_commission': float(total_commission),
                'total_refunds': float(total_refunds),
                'total_payouts': float(total_payouts),
                'filter_applied': filter_type
            }
            return Response(data)
        except Exception as e:
            logger.exception(f"Error in AdminDashboardView: {e}")
            return Response({'error': 'An error occurred while fetching dashboard data.'}, status=500)

class ChartDataView(APIView):
    permission_classes = [IsAdminUserCustom]
    def get(self, request):
        filter_type = request.query_params.get('filter', 'daily').lower()
        chart_data = []
        total_subscriptions = 0
        total_freemium = 0
        if filter_type == 'yearly':
            queryset = Purchase.objects.annotate(
                year=TruncYear('purchased_at')
            ).values('year').annotate(
                subscribed=Count(Case(When(purchase_type='subscription', then=1), output_field=IntegerField())),
                freemium=Count(Case(When(purchase_type='freemium', then=1), output_field=IntegerField()))
            ).order_by('year')

            for entry in queryset:
                total_subscriptions += entry['subscribed']
                total_freemium += entry['freemium']
                chart_data.append({
                    'name': entry['year'].strftime('%Y'),
                    'subscribed': entry['subscribed'],
                    'freemium': entry['freemium']
                })

        elif filter_type == 'monthly':
            queryset = Purchase.objects.annotate(
                month=TruncMonth('purchased_at')
            ).values('month').annotate(
                subscribed=Count(Case(When(purchase_type='subscription', then=1), output_field=IntegerField())),
                freemium=Count(Case(When(purchase_type='freemium', then=1), output_field=IntegerField()))
            ).order_by('-month')

            for entry in queryset:
                total_subscriptions += entry['subscribed']
                total_freemium += entry['freemium']
                chart_data.append({
                    'name': entry['month'].strftime('%b'),
                    'subscribed': entry['subscribed'],
                    'freemium': entry['freemium']
                })

        else:
            queryset = Purchase.objects.annotate(
                day=TruncDay('purchased_at')
            ).values('day').annotate(
                subscribed=Count(Case(When(purchase_type='subscription', then=1), output_field=IntegerField())),
                freemium=Count(Case(When(purchase_type='freemium', then=1), output_field=IntegerField()))
            ).order_by('-day')[:10]

            for entry in queryset:
                total_subscriptions += entry['subscribed']
                total_freemium += entry['freemium']
                chart_data.append({
                    'name': entry['day'].strftime('%d/%a'),
                    'subscribed': entry['subscribed'],
                    'freemium': entry['freemium']
                })

        return Response({'purchase_chart_data': chart_data, 'total_subscriptions': total_subscriptions, 'total_freemium': total_freemium, 'filter_applied': filter_type})

class TutorDashboardView(APIView):
    permission_classes = [IsUser]

    def get(self, request):
        tutor_id = request.user_payload['user_id']
        filter_type = request.query_params.get('filter', 'all').lower()
        draft = Course.objects.filter(instructor=tutor_id, is_complete=False).first()
        if draft:
            draft_serializer = CourseSerializer(draft)

        # Define time filters
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        time_filters = {
            'today': {'created_at__gte': today},
            'week': {'created_at__gte': week_start},
            'month': {'created_at__gte': month_start},
            'all': {}
        }
        # Get the appropriate filter
        filter_params = time_filters.get(filter_type, time_filters['all'])
        try:
            # Total Courses (authored by the tutor, available, and not blocked)
            courses_query = Course.objects.filter(
                instructor=tutor_id,
                is_available=True,
                is_blocked=False
            )
            if filter_params:
                courses_query = courses_query.filter(**filter_params)
            total_courses = courses_query.count()
            # Total Students Enrolled (unique students in tutor's courses)
            purchases = Purchase.objects.filter(course__instructor=tutor_id)
            if filter_params:
                purchases = purchases.filter(purchased_at__gte=filter_params.get('created_at__gte'))
            total_students = purchases.values('user').distinct().count()
            # Total Enrollments (purchases of tutor's courses)
            total_enrollments = purchases.count()
            # Total Completed Courses (by students in tutor's courses)
            completed_courses = purchases.filter(completed=True)
            total_completed_courses = completed_courses.count()
            # Total Subscriptions and Freemium Purchases
            subscriptions_query = purchases.filter(purchase_type='subscription')
            total_subscriptions = subscriptions_query.count()
            freemium_query = purchases.filter(purchase_type='freemium')
            total_freemium = freemium_query.count()
            # Total Earnings (tutor's share from course sales, credited)
            tutor_transactions = Transaction.objects.filter(
                purchase__course__instructor=tutor_id,
            )
            if filter_params:
                tutor_transactions = tutor_transactions.filter(**filter_params)
            earnings_query = tutor_transactions.filter(
                transaction_type='course_sale',
            )
            total_earnings = earnings_query.aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            # Total Refunds (for tutor's courses)
            refunds_query = earnings_query.filter(
                status='refunded'
            )
            total_refunds = refunds_query.aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            # Total Amount on Hold (within safe period)
            on_hold_query = earnings_query.filter(
                status__in=['pending', 'reported']
            )
            total_on_hold = on_hold_query.aggregate(total=Sum('amount'))['total'] or 0
            # Total Platform Commission (deducted from tutor's courses)
            commission_query = tutor_transactions.filter(
                transaction_type='commission'
            )
            total_commission = commission_query.aggregate(total=Sum(Abs(F('amount'))))['total'] or 0
            # Average Course Rating
            avg_rating_query = Review.objects.filter(
                course__instructor=tutor_id
            )
            if filter_params:
                avg_rating_query = avg_rating_query.filter(**filter_params)
            avg_course_rating = avg_rating_query.aggregate(avg=Avg('rating'))['avg'] or 0
            # Total Video Sessions (scheduled or completed by tutor)
            video_sessions_query = VideoSession.objects.filter(tutor=tutor_id)
            if filter_params:
                video_sessions_query = video_sessions_query.filter(**filter_params)
            total_video_sessions = video_sessions_query.count()
            # Total Reports (filed against tutor's courses)
            reports_query = Report.objects.filter(course__instructor=tutor_id)
            if filter_params:
                reports_query = reports_query.filter(**filter_params)
            total_reports = reports_query.count()
            data = {
                'total_courses': total_courses,
                'total_students': total_students,
                'total_enrollments': total_enrollments,
                'total_completed_courses': total_completed_courses,
                'total_subscriptions': total_subscriptions,
                'total_freemium': total_freemium,
                'total_earnings': float(total_earnings),
                'total_refunds': float(total_refunds),
                'total_platform_commission': float(total_commission),
                'total_amount_on_hold': float(total_on_hold),
                'average_course_rating': float(avg_course_rating),
                'total_video_sessions': total_video_sessions,
                'total_reports': total_reports,
                'filter_applied': filter_type,
                'draft': draft_serializer.data if draft else None,
            }
            return Response(data)
        except Exception as e:
            logger.exception(f"Error in TutorDashboardView: {e}")
            return Response({'error': 'An error occurred while fetching dashboard data.'}, status=500)
        
class TutorChartDataView(APIView):
    permission_classes = [IsUser]
    def get(self, request):
        filter_type = request.query_params.get('filter', 'daily').lower()
        tutor_id = request.user_payload['user_id']
        total_subscriptions = 0
        total_freemium = 0
        total_amount = 0
        try:
            base_query = Purchase.objects.filter(
                course__instructor=tutor_id,
            )
            base_query_subscription_only = base_query.filter(
                purchase_type='subscription',
                subscription_amount__isnull=False
            )
            amount_chart_data = []
            purchase_chart_data = []
            if filter_type == 'daily':
                amount_data = (base_query_subscription_only
                        .annotate(date=TruncDay('purchased_at'))
                        .values('date')
                        .annotate(amount=Sum('subscription_amount'))
                        .order_by('-date'))[:10]

                for entry in amount_data:
                    amount = entry['amount']
                    total_amount += amount
                    amount_chart_data.append({
                        'name': entry['date'].strftime('%d/%a'),
                        'amount': float(amount)
                    })

                purchase_type_data = base_query.annotate(
                    day=TruncDay('purchased_at')
                ).values('day').annotate(
                    subscribed=Count(Case(When(purchase_type='subscription', then=1), output_field=IntegerField())),
                    freemium=Count(Case(When(purchase_type='freemium', then=1), output_field=IntegerField()))
                ).order_by('-day')[:10]

                for entry in purchase_type_data:
                    total_subscriptions += entry['subscribed']
                    total_freemium += entry['freemium']
                    purchase_chart_data.append({
                        'name': entry['day'].strftime('%d/%a'),
                        'subscribed': entry['subscribed'],
                        'freemium': entry['freemium']
                    })

            elif filter_type == 'monthly':
                amount_data = (base_query_subscription_only
                        .annotate(month=TruncMonth('purchased_at'))
                        .values('month')
                        .annotate(amount=Sum('subscription_amount'))
                        .order_by('month'))

                for entry in amount_data:
                    amount = entry['amount']
                    total_amount += amount
                    amount_chart_data.append({
                        'name': entry['month'].strftime('%b'),
                        'amount': float(amount)
                    })

                purchase_type_data = base_query.annotate(
                    month=TruncMonth('purchased_at')
                ).values('month').annotate(
                    subscribed=Count(Case(When(purchase_type='subscription', then=1), output_field=IntegerField())),
                    freemium=Count(Case(When(purchase_type='freemium', then=1), output_field=IntegerField()))
                ).order_by('-month')

                for entry in purchase_type_data:
                    total_subscriptions += entry['subscribed']
                    total_freemium += entry['freemium']
                    purchase_chart_data.append({
                        'name': entry['month'].strftime('%b'),
                        'subscribed': entry['subscribed'],
                        'freemium': entry['freemium']
                    })

            elif filter_type == 'yearly':
                amount_data = (base_query_subscription_only
                        .annotate(year=TruncYear('purchased_at'))
                        .values('year')
                        .annotate(amount=Sum('subscription_amount'))
                        .order_by('year'))

                for entry in amount_data:
                    amount = entry['amount']
                    total_amount += amount
                    amount_chart_data.append({
                        'name': entry['year'].strftime('%Y'),
                        'amount': float(amount)
                    })

                purchase_type_data = base_query.annotate(
                    year=TruncYear('purchased_at')
                ).values('year').annotate(
                    subscribed=Count(Case(When(purchase_type='subscription', then=1), output_field=IntegerField())),
                    freemium=Count(Case(When(purchase_type='freemium', then=1), output_field=IntegerField()))
                ).order_by('year')

                for entry in purchase_type_data:
                    total_subscriptions += entry['subscribed']
                    total_freemium += entry['freemium']
                    purchase_chart_data.append({
                        'name': entry['year'].strftime('%Y'),
                        'subscribed': entry['subscribed'],
                        'freemium': entry['freemium']
                    })

            else:
                return Response({'error': 'Invalid filter type. Use daily, monthly, or yearly.'}, status=400)
            return Response({'amount_chart_data': amount_chart_data, 'total_amount': total_amount, 'purchase_chart_data': purchase_chart_data, 'total_subscriptions': total_subscriptions, 'total_freemium': total_freemium})

        except Exception as e:
            logger.exception(f"Error in TutorSalesChartView: {e}")
            return Response({'error': f'An error occurred while fetching chart data. {str(e)}'}, status=500)
        