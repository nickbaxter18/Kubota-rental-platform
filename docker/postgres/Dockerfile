# PostgreSQL with proper locale configuration
FROM postgres:15

# Set environment variables for locale
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8

# Install locale packages and generate locale
RUN apt-get update && \
    apt-get install -y locales && \
    locale-gen en_US.UTF-8 && \
    update-locale LANG=en_US.UTF-8 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy initialization script
COPY docker/postgres/init.sql /docker-entrypoint-initdb.d/

# Ensure proper permissions
RUN chmod 644 /docker-entrypoint-initdb.d/init.sql

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pg_isready -U kubota_user -d kubota_rental || exit 1

EXPOSE 5432
