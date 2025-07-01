from django.db import connection

def tutor_course_stats(id):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT c.id) AS total_courses,
                COUNT(p.id) AS total_enrollments
            FROM courses_course c
            LEFT JOIN courses_purchase p ON p.course_id = c.id
            WHERE c.instructor = %s AND c.is_available = TRUE;
        """, [id])
        row = cursor.fetchone()  # returns tuple
        return row
    
def top_tutors():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                c.instructor, 
                COUNT(DISTINCT c.id) AS total_courses, 
                COUNT(p.id) AS total_enrollments 
            FROM courses_course c 
            LEFT JOIN courses_purchase p ON p.course_id = c.id 
            WHERE c.is_available = TRUE 
            GROUP BY c.instructor 
            ORDER BY total_enrollments DESC;
        """)
        rows = cursor.fetchall()
        return rows