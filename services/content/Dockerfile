FROM python:3.11-slim AS builder
WORKDIR /app
COPY libs/nexus-common /app/libs/nexus-common
COPY services/content /app/services/content
WORKDIR /app/services/content
RUN pip install --no-cache-dir ../../libs/nexus-common . 2>/dev/null || pip install -e ../../libs/nexus-common fastapi uvicorn sqlalchemy asyncpg pydantic-settings email-validator python-multipart

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY libs/nexus-common /app/libs/nexus-common
COPY services/content /app/services/content
ENV PYTHONPATH=/app/services/content:/app/libs/nexus-common
EXPOSE 8003
CMD ["python", "-m", "uvicorn", "services.content.api.main:app", "--host", "0.0.0.0", "--port", "8003"]