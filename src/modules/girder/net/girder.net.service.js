angular.module("girder.net", [])
    /**
     * The girder.net.GirderConnector service simplify management
     * and interaction with a Girder server using its Restful API.
     */
    .service('girder.net.GirderConnector', [ '$window', '$http', '$rootScope', function ($window, $http, $rootScope) {
        'use strict';

        // Internal state
        var apiBasePathURL = '/api/v1/',
            user = null,
            authToken = null;

        // Helper function use to generate $http argument base on
        // the targetted method and URL.
        function generateHttpConfig (method, url, data) {
            // Create basic request config
            var httpConfig = {
                method: method,
                url: apiBasePathURL + url
            };

            if (data) {
                httpConfig.data = data;
            }

            // Add authentication token if available
            if (authToken) {
                httpConfig.headers = { 'Girder-Token' : authToken };
            }

            return httpConfig;
        }

        /**
         * Change Girder API endpoint if need be.
         * The default value is '/api/v1/'
         */
         this.setGirderBasePathAPI = function (newBasePath) {
            apiBasePathURL = newBasePath;
         };

         /**
          * Try to Authenticate a given user. Once the action is fullfiled
          * one of the following event will be broadcasted on the $rootScope.
          *
          * Events:
          *   - 'login', { user data [...] }
          *   - 'login-error'
          */
        this.login = function (login, password) {
            var authString = $window.btoa(login + ':' + password);
            $http({
                method: 'GET',
                url: apiBasePathURL + 'user/authentication',
                headers: {
                    'Authorization': 'Basic ' + authString
                }
            })
            .success(function(data, status, headers, config) {
                user = data.user;
                authToken = data.authToken.token;
                $rootScope.$broadcast('login', user);
            })
            .error(function(data, status, headers, config) {
                user = null;
                authToken = null;
                $rootScope.$broadcast('login-error');
            });
        };

        /**
         * Try to delete authentication cookie.
         *
         * Events:
         *   - 'logout'
         *   - 'logout-error'
         */
        this.logout = function () {
            if (user) {
                this.delete('user/authentication')
                .success(function(){
                    $rootScope.$broadcast('logout');
                    user = null;
                    authToken = null;
                })
                .error(function(){
                    $rootScope.$broadcast('logout-error');
                });
            }
        };

        /**
         * Return the logged in user if any.
         */
        this.getUser = function () {
            return user;
        };

        /**
         * Return true if logged in, false otherwise.
         */
        this.isLoggedIn = function () {
            return !!user;
        };

        /**
         * Perform a GET http call to the given url with
         * the authentication Token if available.
         */
        this.get = function (url) {
            return $http(generateHttpConfig('GET', url));
        };

        /**
         * Perform a PUT http call to the given url with
         * the authentication Token if available.
         */
        this.put = function (url) {
            return $http(generateHttpConfig('PUT', url));
        };

        /**
         * Perform a DELETE http call to the given url with
         * the authentication Token if available.
         */
        this.delete = function (url) {
            return $http(generateHttpConfig('DELETE', url));
        };

        /**
         * Perform a POST http call to the given url with
         * the authentication Token if available.
         */
        this.post = function (url, data) {
            return $http(generateHttpConfig('POST', url, data));
        };

        /**
         * Annonymous HTTP get call on a given URL and
         * return a promise like on which could be
         * attached a .success(function(data){}) or
         * .error(function(){}) callback.
         */
        this.fetch = function (url) {
            return $http({ method: 'GET', url: url});
        };

        // ====================================================================

        /**
         * Return a promise which should provide the list of available workflow
         */
        this.listWorkflows = function () {
            return this.get('collection');
        };

        /**
         * Return a promise which should provide the list of available groups
         * within a workflow.
         */
        this.listWorkflowGroups = function ( workflowId ) {
            return this.get('folder?parentType=collection&parentId=' + workflowId);
        };

        /**
         * Return a promise which should provide the list of available projects
         * within a group.
         */
        this.listGroupProjects = function ( groupId ) {
            return this.get('folder?parentType=folder&parentId=' + groupId);
        };

        this.createFolder = function (parentId, name, description) {
            return this.post(['folder?parentId=', parentId, '&name=', escape(name), '&description=', escape(description)].join(''));
        };

        this.deleteFolder = function (id) {
            return this.delete('folder/' + id);
        };

    }]);