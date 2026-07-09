FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt /app/
COPY libs/nexus-common /app/libs/nexus-common
COPY services/robot_agent /app/services/robot_agent
RUN pip install --no-cache-dir -r requirements.txt httpx
ENV PYTHONPATH=/app/services:/app/libs/nexus-common
EXPOSE 8006
CMD ["python", "-m", "uvicorn", "services.robot_agent.api.main:app", "--host", "0.0.0.0", "--port", "8006"]