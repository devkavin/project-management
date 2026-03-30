FROM php:8.3-cli-alpine

RUN apk add --no-cache bash git unzip icu-dev oniguruma-dev libzip-dev mysql-client \
    && docker-php-ext-install pdo_mysql intl zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 8000
CMD ["entrypoint"]
