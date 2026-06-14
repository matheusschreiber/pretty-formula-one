FROM python:3.11-slim

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app

COPY automation.py .

ENV PYTHONUNBUFFERED=1

CMD ["python", "automation.py"]

 

