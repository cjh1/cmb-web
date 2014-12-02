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
        function generateHttpConfig (method, url, data, config) {
            config = config || {};

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

            // Add extra configuration directives if present.  If one of the
            // options is "headers", *merge* it to the exists headers object
            // instead of blindly rewriting it.
            for (var c in config) {
                if (config.hasOwnProperty(c)) {
                    if (c !== 'headers') {
                        httpConfig[c] = config[c];
                    } else {
                        httpConfig.headers = httpConfig.headers || {};
                        for (var h in config.headers) {
                            if (config.headers.hasOwnProperty(h)) {
                                httpConfig.headers[h] = config.headers[h];
                            }
                        }
                    }
                }
            }

            return httpConfig;
        }

        this.getApiBase = function () {
            return apiBasePathURL;
        };

        this.getAuthToken = function () {
            return authToken;
        };

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
        this.put = function (url, data) {
            return $http(generateHttpConfig('PUT', url, data));
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
        this.post = function (url, data, config) {
            return $http(generateHttpConfig('POST', url, data, config));
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
         * Return a promise which should provide the list of available folders
         * within a folder.
         */
        this.listFolders = function ( parentId ) {
            return this.get('folder?parentType=folder&parentId=' + parentId);
        };

        /**
         * Return a promise which should provide the list of available items
         * within a folder.
         */
        this.listItems = function (parentId, name) {
            return this.get('item?folderId=' + parentId + (name ? '&text=' + name : ''));
        };

        this.listItemFiles = function (itemId) {
            return this.get('item/' + itemId + '/files');
        };

        this.createFolder = function (parentId, name, description, parentType) {
            parentType = parentType || "folder";
            return this.post(['folder?parentId=', parentId, '&parentType=', parentType, '&name=', escape(name), '&description=', escape(description)].join(''));
        };

        this.deleteFolder = function (id) {
            return this.delete('folder/' + id);
        };

        this.createItem = function (folderId, name, description, metadata) {
            var that = this,
                promise = this.post(['item?folderId=', folderId, '&name=', escape(name), '&description=', escape(description)].join(''));
            if(metadata) {
                promise
                .success(function(newItem) {
                    return that.put('item/' + newItem._id + '/metadata', metadata);
                })
                .error(function(){
                    console.log('Error while creating item');
                    return promise;
                });
            }
            return promise;
        };

        this.uploadChunk = function (uploadId, offset, blob) {
            var formdata = new FormData();
            formdata.append('offset', offset);
            formdata.append('uploadId', uploadId);
            formdata.append('chunk', blob);

            return this.post('file/chunk', formdata, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            });
        };

        this.uploadFile = function (parentType, parentId, file, opt) {
            var that = this;

            opt = opt || {};

            // Create a new file.
            //
            // If the "name" parameter is given, use that for the filename;
            // otherwise use the filename in the File object.
            this.post(['file',
                       '?parentType=', parentType,
                       '&parentId=', parentId,
                       '&name=', opt.name || file.name,
                       '&size=', file.size,
                       '&mimeType=', file.type].join(''))
                .success(function (upload) {
                    var chunkSize = 16*1024*1024,
                        uploadNextChunk,
                        i = 0,
                        chunks = Math.floor(file.size / chunkSize);

                    uploadNextChunk = function (offset) {
                        var blob;

                        if (offset + chunkSize >= file.size) {
                            blob = file.slice(offset);
                            that.uploadChunk(upload._id, offset, blob)
                                .success(function (data) {
                                    $rootScope.$broadcast('file-uploaded', parentId, data);
                                })
                                .error(function (data) {
                                    console.warn('could not upload data');
                                    console.warn(data);
                                });
                        } else {
                            blob = file.slice(offset, offset + chunkSize);
                            that.uploadChunk(upload._id, offset, blob)
                                .success(function (data) {
                                    var msg;

                                    i += 1;
                                    msg = 'chunk ' + i + ' of ' + chunks + ' uploaded';

                                    $rootScope.$broadcast('notification-message', {
                                        type: 'upload',
                                        file: file.name,
                                        done: i,
                                        total: chunks
                                    });

                                    uploadNextChunk(offset + chunkSize);
                                })
                                .error(function (data) {
                                    console.warn('could not upload data');
                                    console.warn(data);
                                });
                        }
                    };

                    uploadNextChunk(0);
                })
                .error(function (data) {
                    console.warn("Could not upload file");
                    console.warn(data);
                });
        };

        this.uploadFileItem = function (itemId, file, opt) {
            this.uploadFile('item', itemId, file, opt);
        };

        // PUT /meshes/{mesh_file_id}/extract/surface
        //
        // Where mesh_file_id is the id of the file containing the mesh.
        //
        // The body of the request should have the following form:
        //
        // {
        //   "output": {
        //     "itemId": "The id of the item you what the output to be uploaded to",
        //     "name": "The name to give the output file"
        //   }
        // }
        this.processMesh = function(itemId, fileId) {
          return this.put(
            "meshes/" + fileId + "/extract/surface",
            {
              output: {
                itemId: itemId,
                name: 'mesh-faceset.vtk'
              }
            }
          );
        };

    }]);
