# ML Workflow Execution Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the execute_workflow.py script
COPY execute_workflow.py .

# Create data and results directories
RUN mkdir -p /app/data /app/results

# Set the entrypoint to the execute_workflow.py script
ENTRYPOINT ["python", "execute_workflow.py"]
