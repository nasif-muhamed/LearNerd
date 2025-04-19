from django.core.management.base import BaseCommand
from users.rabbitmq_consumer import start_consumer

class Command(BaseCommand):
    help = 'Starts the RabbitMQ consumer for notification events'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting RabbitMQ consumer...'))
        try:
            start_consumer()
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Consumer stopped.'))