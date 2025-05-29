from .models import SectionItem

def mark_purchase_completed(purchase):
    print('inside mark_purchase_completed')
    course = purchase.course
    section_item_count = SectionItem.objects.filter(section__course=course).count()
    section_items_completed_count = purchase.section_items_completed.count()
    print('count:', section_item_count, section_items_completed_count)
    if section_item_count == section_items_completed_count and not purchase.completed:
        purchase.completed = True
        purchase.save()