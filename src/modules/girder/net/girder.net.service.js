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
            authToken = null,
            taskList = {};

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

        this.fetchTaskList = function() {
            var self = this;

            self.listWorkflows()
                .success(function(collections) {
                    angular.forEach(collections, function(collection) {
                        taskList[collection.name] = {};
                        self.listFolders(collection._id, 'collection')
                            .success(function(folders){
                                angular.forEach(folders, function(folder) {
                                    if (folder.name === 'tasks') {
                                        self.listItems(folder._id)
                                            .success(function(items) {
                                                angular.forEach(items, function(item) {
                                                    self.listItemFiles(item._id).success(function(files){
                                                        angular.forEach(files, function(file) {
                                                            taskList[collection.name][file.name] = file._id;
                                                        });
                                                    });
                                                });
                                            });
                                    }
                                });
                            });
                    });
                });
        };

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
            var authString = $window.btoa(login + ':' + password),
                self = this;
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
                self.fetchTaskList();
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
        this.listFolders = function ( parentId, parentType ) {
            parentType = parentType || "folder";
            return this.get('folder?parentType='+parentType+'&parentId=' + parentId);
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

        this.getFileId = function (itemId, fileName, callback) {
            this.listItemFiles(itemId)
                .success(function(files) {
                    var count = files.length;
                    while(count--) {
                        if(files[count].name === fileName) {
                            callback(files[count]._id);
                            return;
                        }
                    }
                    callback(undefined);
                }).error(function() {
                    callback(undefined);
                });
        };

        this.createFolder = function (parentId, name, description, parentType) {
            parentType = parentType || "folder";
            return this.post(['folder?parentId=', parentId, '&parentType=', parentType, '&name=', escape(name), '&description=', escape(description)].join(''));
        };

        this.deleteFolder = function (id) {
            return this.delete('folder/' + id);
        };

        this.deleteItem = function (id) {
            return this.delete('item/' + id);
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

                    // Notify that upload started
                    $rootScope.$broadcast('notification-message', {
                        type: 'upload',
                        file: file.name,
                        done: 0,
                        total: chunks
                    });

                    uploadNextChunk = function (offset) {
                        var blob;

                        if (offset + chunkSize >= file.size) {
                            blob = file.slice(offset);
                            that.uploadChunk(upload._id, offset, blob)
                                .success(function (data) {
                                    $rootScope.$broadcast('file-uploaded', parentId, data);
                                    $rootScope.$broadcast('notification-message', null);
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

        this.uploadContentToItem = function (itemId, name, content) {
            var self = this,
                blob = new Blob([content], { type: "text/plain"});

            function uploadFunction (upload) {
                self.uploadChunk(upload._id, 0, blob)
                    .success(function (data) {
                        console.log("Upload ok");
                    })
                    .error(function (data) {
                        console.warn('could not upload data');
                        console.warn(data);
                    });
            }

            function foundFileId (fileId) {
                if(fileId) {
                    self.put(['file/', fileId, '/contents',
                               '?size=', content.length].join(''))
                        .success(uploadFunction).error(function (data) {
                            console.warn("Could not upload content");
                            console.warn(data);
                        });
                } else {
                    self.post(['file',
                               '?parentType=item',
                               '&parentId=', itemId,
                               '&name=', name,
                               '&size=', content.length,
                               '&mimeType=txt/plain'].join(''))
                        .success(uploadFunction).error(function (data) {
                            console.warn("Could not upload content");
                            console.warn(data);
                        });
                }
            }

            // Find  out if the file already exist
            self.getFileId(itemId, name, foundFileId);
        };

        this.downloadContentFromItem = function (itemId, name, callback) {
            var self = this;

            function processFileId (fileId) {
                if(fileId) {
                    self.get(['file/', fileId, '/download/', name].join(''))
                        .success(callback)
                        .error(function(data) {
                            console.warn("Error while downloading file content");
                            console.warn(data);
                        });
                } else {
                    callback(undefined);
                }
            }

            self.getFileId(itemId, name, processFileId);
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

        this.getTaskId = function(workflow, taskName) {
            console.log(taskList);
            if(workflow && taskName) {
                return taskList[workflow][taskName];
            }
            return null;
        };

        this.updateItemMetadata = function (item, metadata) {
            return this.put(['item', item._id, 'metadata'].join('/'), metadata)
                .success(function(){
                    item.meta = metadata;
                    console.log('Success metadata updating');
                }).error(function(){
                    console.log('Error when updating metadata');
                });
        };

        this.updateTaskStatus = function (item) {
            var self = this;

            self.get(['tasks/', item.meta.task, '/status'].join(''))
                .success(function(response) {
                    if(item.meta.status !== response.status) {
                        console.log('update status to ' + response.status);
                        var meta = angular.copy(item.meta);
                        meta.status = response.status;
                        self.updateItemMetadata(item, meta);
                    }
                })
                .error(function(resp){
                    console.log('error when updating status');
                });
        };

        this.startTask = function (item, taskDefId) {
            var self = this;
            // Create task instance
            self.post('tasks', { taskSpecId: taskDefId })
                .success(function(response){
                    // Update Item metadata
                    var metadata = {
                        task: response._id,
                        spec: response.taskSpecId,
                        status: response.status
                    };
                    self.updateItemMetadata(item, metadata);

                    // Start task
                    self.put(['tasks', response._id, 'run'].join('/'), {
                        input: {
                            item: { id: item._id },
                            path: "data"
                        },
                        output: {
                            item: { id: item._id }
                        }})
                        .success(function(){
                            console.log("Task successfully started");
                        })
                        .error(function(error) {
                            console.log("Error while starting Task");
                            console.log(error);
                        });
                })
                .error(function(error) {
                    console.log("Error while task creation");
                    console.log(error);
                });
        };

        this.deleteTask = function (item) {
            var self = this,
                taskId = item.meta.task;

            self.delete(['tasks', taskId].join('/'))
                .success(function(){
                    // Remove item metadata
                    self.updateItemMetadata(item, {});
                })
                .error(function(error){
                    console.log("Error when deleting task " + taskId);
                    console.log(error);
                    console.log(item);
                    self.updateItemMetadata(item, {});
                });
        };

        this.terminateTask = function (item) {
            var self = this,
                taskId = item.meta.task;

            // PUT /task/<_id from above>/terminate
            // DELETE /task/<_id from above>
            self.put(['tasks', taskId, 'terminate'].join('/'))
                .success(function(){
                    var metadata = angular.copy(item.meta);
                    metadata.status = 'terminate';
                    self.updateItemMetadata(item, metadata);
                })
                .error(function(error) {
                    console.log("Error when terminating task " + taskId);
                    console.log(error);
                });
        };

        this.getSessionURL = function (taskId, callback) {
            this.get(['tasks', taskId].join('/'))
                .success(function(resp){
                    var sesssionId = resp.output.cluster._id + '%2F' + resp.output.pvw_job._id;
                    callback( ( $window.location.protocol === 'https:' ? "wss://" : "ws://") + $window.location.host + "/proxy?sessionId=" + sesssionId);
                })
                .error(function(error){
                    console.log("Error when fetching task info for " + taskId);
                    console.log(error);
                });
        };

    }]);
