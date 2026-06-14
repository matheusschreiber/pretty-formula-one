FROM python:3.11-slim

RUN pip install --no-cache-dir fastf1

WORKDIR /app

COPY automation.py .

ENV PYTHONUNBUFFERED=1

CMD ["python", "automation.py"]

 

