# Dockerfile
# copied from https://semaphoreci.com/community/tutorials/dockerizing-a-python-django-web-application

# FROM directive instructing base image to build upon
FROM python:3-onbuild

# COPY startup script into known file location in container
COPY start.sh /start.sh

# EXPOSE port 8000 to allow communication to/from server
EXPOSE 8000

# CMD specifcies the command to execute to start the server running.
CMD ["/start.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
# Keep pod running for kubernetes
