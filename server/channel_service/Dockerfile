FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 8004

CMD ["daphne", "-b", "0.0.0.0", "-p", "8004", "channel_service.asgi:application"]