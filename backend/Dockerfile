FROM python:3.12-slim

WORKDIR /app

RUN echo ">>> BACKEND DOCKERFILE <<<"

# Tworzymy venv
RUN python3 -m venv /app/venv

# PATH do venv
ENV PATH="/app/venv/bin:$PATH"

# Instalujemy zależności
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Kopiujemy backend
COPY . /app

# Backend zawsze działa na porcie 8000 w kontenerze
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
