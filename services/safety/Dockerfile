FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt /app/
COPY libs/nexus-common /app/libs/nexus-common
COPY services/safety /app/services/safety
RUN pip install --no-cache-dir -r requirements.txt
ENV PYTHONPATH=/app/services:/app/libs/nexus-common
EXPOSE 8005
CMD ["python", "-m", "uvicorn", "services.safety.api.main:app", "--host", "0.0.0.0", "--port", "8005"]