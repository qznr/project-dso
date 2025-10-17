FROM pkpofficial/ojs:3_3_0-16

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libxml2-dev \
      libxslt1-dev \
      libzip-dev \
      libpng-dev \
      libjpeg-dev \
      libfreetype6-dev \
      libicu-dev \
      ghostscript \
      poppler-utils \
      antiword \
      cron \
      && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install \
      intl \
      xsl \
      zip \
      gd \
      bcmath \
    || true

RUN a2enmod rewrite ssl

RUN mkdir -p /var/www/html/files /var/www/html/public \
    && chown -R www-data:www-data /var/www/html/files /var/www/html/public /var/www/html

USER www-data

CMD [ "pkp-start" ]
