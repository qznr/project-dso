FROM alpine:3.20 AS ojs_source

ARG OJS_VERSION=3_3_0-16
WORKDIR /app

RUN apk add --no-cache curl tar \
    && curl -sSL -O "https://pkp.sfu.ca/ojs/download/ojs-${OJS_VERSION//_/.}.tar.gz" \
    && tar --strip-components=1 -xzf "ojs-${OJS_VERSION//_/.}.tar.gz" \
    && rm "ojs-${OJS_VERSION//_/.}.tar.gz"

FROM php:8.2-apache

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev \
      libzip-dev libicu-dev libxslt1-dev libxml2-dev libpq-dev \
      poppler-utils ghostscript antiword cron \
    && curl -sSLf https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions \
      -o /usr/local/bin/install-php-extensions \
    && chmod +x /usr/local/bin/install-php-extensions \
    && install-php-extensions gd intl mbstring mysqli pdo_mysql pgsql pdo_pgsql xml xsl zip bcmath gettext ftp \
    && a2enmod rewrite ssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY --from=ojs_source /app .

RUN echo "log_errors = On" >> /usr/local/etc/php/conf.d/log-errors.ini \
    && echo "error_log = /dev/stderr" >> /usr/local/etc/php/conf.d/log-errors.ini

RUN mkdir -p /var/www/html/files /var/www/html/public /etc/ssl/apache2 /run/apache2 \
    && chown -R www-data:www-data /var/www/html /etc/ssl/apache2

EXPOSE 8080 8443

VOLUME ["/var/www/html/files", "/var/www/html/public"]

ENV SERVERNAME=localhost \
    HTTPS=on \
    PKP_CLI_INSTALL=0

USER www-data

CMD ["apache2-foreground"]