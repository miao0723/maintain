FROM php:8.3-fpm

# Install dependencies
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list \
    && apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
# Configure and install gd (required by phpoffice/phpspreadsheet and others)
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd zip pdo pdo_mysql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Configure PHP-FPM to listen on all interfaces
RUN echo "listen = 0.0.0.0:9000" > /usr/local/etc/php-fpm.d/zz-custom.conf && \
    echo "listen.allowed_clients = any" >> /usr/local/etc/php-fpm.d/zz-custom.conf

# Copy backend application
COPY backend/ /var/www/html/

# Install dependencies (use Tsinghua Composer mirror)
RUN composer config -g repos.packagist composer https://mirrors.tuna.tsinghua.edu.cn/composer/ \
    && composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 9000

CMD ["php-fpm"]
