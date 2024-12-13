# Start with the official PostgreSQL image
FROM postgres:16

# Install necessary packages for pgvector
RUN apt-get update && apt-get install -y \
    postgresql-server-dev-16 \
    build-essential \
    wget \
    git

# Install pgvector
RUN git clone https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector

# Set up a default database and enable the extension
COPY init.sql /docker-entrypoint-initdb.d/
