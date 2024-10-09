# Usa una imagen base de PHP 8
FROM php:8

# Instala dependencias necesarias
RUN apt-get update \
    && apt-get install -y git zip unzip libssl-dev libcurl4-openssl-dev pkg-config libssl-dev libpng-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instala Composer v2
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Instala PHPUnit
RUN curl -Ls https://phar.phpunit.de/phpunit.phar -o /usr/local/bin/phpunit \
    && chmod +x /usr/local/bin/phpunit

# Instala Xdebug
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Configura Xdebug
RUN echo "zend_extension=xdebug.so" > /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.mode=coverage" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.log_level=0" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Instala extensiones de PHP adicionales
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

RUN docker-php-ext-install pdo pdo_mysql gd

# Configura el directorio de trabajo
WORKDIR /var/www/html

# Copia los archivos del proyecto
COPY public /var/www/html/public
COPY includes /var/www/html/includes
COPY src /var/www/html/src
COPY data /var/www/html/data
COPY composer.json /var/www/html/

# Instala dependencias del proyecto
RUN composer install --ignore-platform-req=ext-mongodb --ignore-platform-req=ext-mysql_xdevapi

# Configura el directorio de trabajo para el servidor web
WORKDIR /var/www/html

# Expone el puerto 80 (puedes cambiarlo si tu aplicación corre en otro puerto)
EXPOSE 80

# Comando por defecto para ejecutar el servidor web
CMD ["php", "-S", "0.0.0.0:80"]