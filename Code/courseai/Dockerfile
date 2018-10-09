# Dockerfile

# FROM directive instructing base image to build upon
FROM python:3-onbuild

# Install Java (First add the required apt source
RUN echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list && \
apt-get -y update && \
apt-get install -y -t jessie-backports openjdk-8-jdk

COPY start.sh /start.sh

# EXPOSE port 8000 to allow communication to/from server
EXPOSE 8000

# Collect static files from apps and then minify and obfuscate them.
RUN SECRET_KEY=dummy ES_IP=localhost python3 manage.py collectstatic --noinput

#sync db
RUN python3 manage.py syncdb --noinput

# CMD specifcies the command to execute to start the server running.
CMD ["/start.sh"]
# done
