FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app/apps/model-api

COPY apps/model-api/requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY apps/model-api/src ./src

EXPOSE 3003

CMD ["python", "./src/main.py"]
