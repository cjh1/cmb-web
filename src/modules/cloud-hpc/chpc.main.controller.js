angular.module('chpc.main')
    /** The chpc.main.RootController controller provide the root API of the
     * application workflow.
     */
     .controller('chpc.main.RootController', ['$scope', 'girder.net.GirderConnector', '$modal', '$templateCache', function ($scope, $network, $modal, $templateCache) {

        // First fetch our workflow definitions
        $network.fetch('workflows.json').success(function (data) {
            $scope.workflowsMeta = data;
        });

        /**
         * The navigation state reflect what the main page should present.
         *   [ workflows, workflow, project, simulation ]
         *
         * List of states and meaning:
         *  - workflows: Home page with the list of available simulation workflows. (Girder: Collections)
         *  - workflow: List all the projects of any groups that the user have access to. (Girder: Collection/Folder <=> Group | Collection/Folder/Folder <=> Project)
         *  - project: Show the project dashboard where actions like 'View Mesh', 'Create simualtion', 'Open simualtion' can be performed.
         *  - simulation: Show the simulation configuration and allow the following actions: 'Run', 'Duplicate'
         *  - ... Still need more thoughts ...
         */
        var fullPathDepth = ['workflows', 'workflow', 'project'];

        $scope.navigationState = 'workflows';
        $scope.navigationPath = ['workflows'];
        $scope.navigationIcones = { workflows : 'fa-home', workflow: 'fa-share-alt', project: 'fa-tasks'};

        $scope.updateNavigation = function (state) {
            $scope.navigationState = state;
            $scope.navigationPath = fullPathDepth.slice(0, fullPathDepth.indexOf(state) + 1);
            if(state === 'workflows') {
                $scope.workflowType = 'default';
            }
        };

        // Authentication / User handling -------------------------------------

        $scope.user = null;

        $scope.$on('login', function (event, user) {
            $scope.user = user;
            $scope.updateAndShowWorkflows();
        });

        $scope.$on('login-error', function (event) {
            $scope.user = null;
            $scope.$broadcast('notification-message', {
                type: 'error',
                message: 'Invalid login or password'
            });
        });

        $scope.$on('logout-error', function (event) {
            $scope.user = null;
            $scope.$broadcast('notification-message', {
                type: 'error',
                message: 'The logout action failed'
            });
        });

        $scope.$on('logout', function (event) {
            $scope.user = null;
        });

        /**
         * Authenticate a given user
         */
        $scope.login = function (login, password) {
            $network.login(login, password);
        };

        /**
         * Switch to anonymous navigation
         */
        $scope.logout = function () {
            $network.logout();
        };

        // Common workflow management -----------------------------------------
        $scope.workflows = [];
        $scope.groups = [];
        $scope.projects = {};
        $scope.project = null;
        $scope.workflowType = 'default';

        /**
         * Fetch the list of workflows and update the global navigation
         */
        $scope.updateAndShowWorkflows = function () {
            $network.listWorkflows().success(function(data) {
                $scope.workflows = {};

                var array = data,
                    count = array.length;
                while(count--) {
                    $scope.workflows[array[count].name] = array[count];
                }


                $scope.groups = [];
                $scope.projects = {};
                $scope.project = null;
                $scope.workflowType = 'default';
                $scope.updateNavigation('workflows');
            });
        };

        /**
         * Fetch groups and project associated with a workflow
         * for the given user and update navigation.
         */
        $scope.selectWorkflow = function (workflowName) {
            $scope.workflowType = workflowName;

            $network.listWorkflowGroups($scope.workflows[workflowName]._id).success(function (groups) {
                    var process,
                        found,
                        i;

                process = function(groups) {
                    $scope.groups = groups;
                    var count = groups.length,
                        array = groups,
                        projectsMap = {},
                        addGroupProjects = function (projects) {
                            var list = projects,
                                size = list.length;
                            while(size--) {
                                var project = list[size];
                                projectsMap[project._id] = project;
                            }
                        };

                    while(count--) {
                        $network.listFolders(array[count]._id).success(addGroupProjects);
                    }
                    $scope.projects = projectsMap;
                    $scope.updateNavigation('workflow');
                };

                // Look for a folder in this workflow with the same name as the
                // user's login - this is the user's "My Projects" folder.  If
                // it does not create it before rendering the projects view.
                found = false;
                for (i = 0; i < groups.length; i++) {
                    if (groups[i].name === $scope.user.login) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $network.createFolder($scope.workflows[workflowName]._id, $scope.user.login, $scope.user.login + "'s projects", "collection")
                        .success(function (folder) {
                            $scope.groups = groups = groups.concat(folder);
                            process(groups);
                        });
                } else {
                    process(groups);
                }
            });
        };

        /**
         * Select a project
         */
        $scope.selectProject = function (projectId) {
            $scope.project = $scope.projects[projectId];
            $scope.updateNavigation('project');
        };

        /**
         * Create project inside given group
         */
        $scope.createProject = function (groupId) {
            var modalInstance = $modal.open({
                    template: $templateCache.get($scope.workflowsMeta[$scope.workflowType].template),
                    controller: $scope.workflowsMeta[$scope.workflowType].controller,
                    size: 'lg',
                    resolve: {
                        group: function() {
                            return groupId;
                        },
                        title: function() {
                            return $scope.workflowsMeta[$scope.workflowType].title;
                        }
                    }
                });

            modalInstance.result.then(function(newProject) {
                $scope.projects[newProject._id] = newProject;
            });
        };

        /**
         * Delete the given folder
         */
        $scope.deleteProject = function (projectId) {
            $network.deleteFolder(projectId).success(function(){
                console.log('Success');
                delete $scope.projects[projectId];
            }).error(function(data, status, config){
                console.log('error');
            });
        };
     }]);
