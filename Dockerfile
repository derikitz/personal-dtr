# Use the official Nginx image as the base image
FROM nginx:alpine

# Set the working directory inside the container
WORKDIR /usr/share/nginx/html

# Copy your static website files into the container
COPY dtr/. .

# Expose port 80 to make the website accessible
EXPOSE 80

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]