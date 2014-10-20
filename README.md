# CMB-Web project
=====================

## Introduction
===============


## Configuration
================

Install system wide the following application

    $ brew install node
    $ npm install -g gulp

Project specific configuration and setup

    $ git clone git@kwsource.kitwarein.com:cmb-web/cmb-web.git src
    $ cd src
    $ npm install
    $ bower install
    $ gulp
    $ gulp serve

NGINX configuration file used for blending Girder with "gulp serve":
By default, the configuration file is named nginx.conf and placed in the directory /usr/local/nginx/conf, /etc/nginx, or /usr/local/etc/nginx.

    |  worker_processes  1;
    |
    |  events {
    |      worker_connections  1024;
    |  }
    |
    |  http {
    |      include       mime.types;
    |      default_type  application/octet-stream;
    |
    |      sendfile        on;
    |
    |      keepalive_timeout  65;
    |
    |      server {
    |          listen       8888;
    |          server_name  localhost;
    |
    |          location / {
    |              proxy_pass http://localhost:3000;
    |          }
    |
    |          location /api/v1 {
    |              proxy_pass http://localhost:8080/api/v1;
    |          }
    |
    |          location /browser-sync {
    |              proxy_pass http://localhost:3000/browser-sync;
    |              proxy_http_version 1.1;
    |              proxy_set_header Upgrade $http_upgrade;
    |              proxy_set_header Connection "upgrade";
    |          }
    |
    |          error_page   500 502 503 504  /50x.html;
    |          location = /50x.html {
    |              root   html;
    |          }
    |      }
    |  }

