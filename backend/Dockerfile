FROM python:3.12-slim

WORKDIR /app

RUN echo ">>> TEN DOCKERFILE JEST UŻYWANY <<<"


# Tworzymy venv
RUN python3 -m venv /app/venv

# Ustawiamy PATH tak, aby pip i python były z venv
ENV PATH="/app/venv/bin:$PATH"

# Kopiujemy requirements
COPY requirements.txt /app/requirements.txt

# Instalujemy zależności DO VENV (PEP 668 nie blokuje venv!)
RUN pip install --no-cache-dir -r /app/requirements.txt

# Kopiujemy cały backend
COPY . /app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]