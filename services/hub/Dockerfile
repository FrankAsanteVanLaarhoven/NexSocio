FROM python:3.11-slim AS builder
WORKDIR /app
COPY libs/nexus-common /app/libs/nexus-common
COPY services/hub /app/services/hub
WORKDIR /app/services/hub
RUN pip install -e ../../libs/nexus-common fastapi uvicorn httpx pydantic-settings

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY libs/nexus-common /app/libs/nexus-common
COPY services/hub /app/services/hub
ENV PYTHONPATH=/app/services:/app/libs/nexus-common
EXPOSE 8007
CMD ["python", "-m", "uvicorn", "services.hub.api.main:app", "--host", "0.0.0.0", "--port", "8007"]