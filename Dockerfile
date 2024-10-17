# Use the official Node.js image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies specified in the package.json
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Expose the ports that the application will run on
EXPOSE 8085
EXPOSE 8087

# Command to run the application
CMD ["node", "server.js"]
