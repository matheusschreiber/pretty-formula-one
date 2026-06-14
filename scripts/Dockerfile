FROM python:3.11-slim

RUN pip install -r requirements.txt

WORKDIR /app

COPY automation.py .

ENV PYTHONUNBUFFERED=1

CMD ["python", "automation.py"]

 

