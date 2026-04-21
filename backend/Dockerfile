FROM python:3.12-slim

# Ustawiamy katalog roboczy
WORKDIR /app

# Kopiujemy plik z zależnościami
COPY requirements.txt .

# Instalujemy zależności
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy cały backend
COPY . .

# Uruchamiamy backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
