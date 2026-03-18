# Use Ubuntu as the base system
FROM ubuntu:22.04

# Install the C compiler and OpenSSL library
RUN apt-get update && apt-get install -y \
    gcc \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy your project files into the container
COPY . /app
WORKDIR /app

# Compile the C server
RUN gcc server.c -o tictactoe -lssl -lcrypto

# Tell the cloud to open port 8080
EXPOSE 8080

# Start the server
CMD ["./tictactoe"]
