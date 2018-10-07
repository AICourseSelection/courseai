"""
Django settings for courseai project.
Generated by 'django-admin startproject' using Django 2.0.3.
For more information on this file, see
https://docs.djangoproject.com/en/2.0/topics/settings/
For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.0/ref/settings/
"""

import os
import django

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.0/howto/deployment/checklist/

# SECURITY

SECRET_KEY = os.environ.get("SECRET_KEY")
SECURE_CONTENT_TYPE_NOSNIFF = False
SECURE_BROWSER_XSS_FILTER = False
SECURE_SSL_REDIRECT = False  # TODO: set to true when domain name owned
# SECURE_HSTS_SECONDS # TODO: set a value for this when only serving over SSL
CSRF_COOKIE_SECURE = False
X_FRAME_OPTIONS = 'DENY'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG") == 'True'

ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    'pipeline',
    'ics',
    'degree.apps.DegreeConfig',
    'search.apps.SearchConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.messages',
    'django.contrib.sessions',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    'accounts',
    'feedback',
    'django_json_widget',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'courseai.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'courseai.wsgi.application'


# Database
# https://docs.djangoproject.com/en/2.0/ref/settings/#databases
databaseConfig = {};
if os.environ.get('DATABASE') == 'MYSQL':
    databaseConfig = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'main_database',
            'USER': 'courseai-user',
            'PASSWORD': 'B^ksX7&(kl',
            'HOST': '35.197.170.146',
        }
    }
else:
    databaseConfig = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }
DATABASES = databaseConfig

# Password validation
# https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
            },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
            },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
            },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
            },
        ]

# Local email server - prints to console
# https://wsvincent.com/django-contact-form/
# https://docs.djangoproject.com/en/2.1/topics/email/

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'testing@example.com'
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''
EMAIL_USE_TLS = False
EMAIL_PORT = 1025

# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/

STATIC_ROOT = os.path.join(BASE_DIR, 'static')
# STATICFILES_DIRS = [ os.path.join(BASE_DIR, "static"), ]

STATIC_URL = '/static/'

STATICFILES_FINDERS = (
        'django.contrib.staticfiles.finders.FileSystemFinder',
        'django.contrib.staticfiles.finders.AppDirectoriesFinder',
        #    'django.contrib.staticfiles.finders.DefaultStorageFinder',
        'pipeline.finders.PipelineFinder',
        )

STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

PIPELINE = {
        # 'PIPELINE_ENABLED': True,
        'CSS_COMPRESSOR': 'pipeline.compressors.NoopCompressor',
        'JS_COMPRESSOR': 'pipeline.compressors.closure.ClosureCompressor',
        'CLOSURE_BINARY': os.environ.get("CC_PATH", 'closure-compiler/run-compiler.sh'),
        'DISABLE_WRAPPER': True,
        'STYLESHEETS': {
            'main': {
                'source_filenames': (
                    'css/style.css',
                    ),
                'output_filename': 'css/main.min.css',
                },
            },
        'JAVASCRIPT': {
            'main': {
                'source_filenames': (
                    'js/ajax_csrf.js',
                    'js/cookie.js',
                    ),
                'output_filename': 'js/main.min.js'
                },
            'index': {
                'source_filenames': (
                    'js/index.js',
                    ),
                'output_filename': 'js/index.min.js'
                },
            'planner': {
                'source_filenames': (
                    'js/planner_app/autosave.js',
                    'js/planner_app/course.js',
                    'js/planner_app/data.js',
                    'js/planner_app/degree.js',
                    'js/planner_app/mms.js',
                    'js/planner_app/plan.js',
                    'js/planner_app/search.js',
                    'js/planner_app/ui.js',
                    ),
                'output_filename': 'js/planner.min.js',
                },
            'profile': {
                'source_filenames': (
                    'js/profile.js',
                    ),
                'output_filename': 'js/profile.min.js'
                }
            }
        }
