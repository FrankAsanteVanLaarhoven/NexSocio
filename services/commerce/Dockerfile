FROM python:3.11-slim AS builder
WORKDIR /app
COPY libs/nexus-common /app/libs/nexus-common
COPY services/commerce /app/services/commerce
WORKDIR /app/services/commerce
RUN pip install -e ../../libs/nexus-common fastapi uvicorn sqlalchemy asyncpg pydantic-settings

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY libs/nexus-common /app/libs/nexus-common
COPY services/commerce /app/services/commerce
ENV PYTHONPATH=/app/services:/app/libs/nexus-common
EXPOSE 8008
CMD ["python", "-m", "uvicorn", "services.commerce.api.main:app", "--host", "0.0.0.0", "--port", "8008"]