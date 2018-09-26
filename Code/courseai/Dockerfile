# Dockerfile

# FROM directive instructing base image to build upon
FROM python:3-onbuild

FROM openjdk:8-jre

COPY start.sh /start.sh

# EXPOSE port 8000 to allow communication to/from server
EXPOSE 8000

# Collect static files from apps and then minify and obfuscate them.
RUN python manage.py collectstatic

# CMD specifcies the command to execute to start the server running.
CMD ["/start.sh"]
# done
