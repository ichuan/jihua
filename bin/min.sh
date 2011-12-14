#!/bin/bash

cd /var/www/jihua/bin/
java -jar yuicompressor-2.4.7.jar --type js /var/www/jihua/static/js/jihua.js -o /var/www/jihua/static/js/jihua.min.js
java -jar yuicompressor-2.4.7.jar --type css /var/www/jihua/static/css/jihua.css -o /var/www/jihua/static/css/jihua.min.css
