FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV POETRY_VIRTUALENVS_CREATE=false
ENV POETRY_NO_INTERACTION=1

RUN pip install --no-cache-dir poetry==2.1.3

WORKDIR /app/apps/model-api

COPY apps/model-api/pyproject.toml apps/model-api/poetry.lock ./

RUN poetry install --only main

COPY apps/model-api ./

EXPOSE 3003

CMD ["python", "./src/main.py"]
