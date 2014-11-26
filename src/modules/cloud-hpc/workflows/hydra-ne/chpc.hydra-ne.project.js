angular.module('chpc.workflow.hydra-ne')
.directive('hydraNeProject', ['$templateCache', function ($templateCache) {
    return {
        restrict: 'E',
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.project.html')
    };
}])
.controller('hydraNeProjectCtrl', [ '$scope', 'girder.net.GirderConnector','$modal', '$templateCache', function ($scope, $girder, $modal, $templateCache) {

    function updateSimulations(parentId) {
        $girder.listItems(parentId)
            .success(function(simulations){
                $scope.simulations = simulations;
            })
            .error(function() {
                console.log('failure in simulations fetching');
            });
    }

    function updateResults(parentId) {
        $girder.listItems(parentId)
            .success(function(results){
                $scope.results = results;
            })
            .error(function(){
                console.log('failure in results fetching');
            });
    }

    function updateMesh(mesh) {
        $scope.mesh = mesh;
        console.log($scope);
    }

    var hex = "0123456789abcdef";


    $scope.viewMesh = function () {
        $scope.meshViewer = true;
    };

    // FIXME: bind the button to viewMesh instead for now.
    $scope.sampleJob = function () {
        var name = "sample_cluster-";
        for (var i = 0; i < 16; i++) {
            name += hex[Math.floor(Math.random() * hex.length)];
        }

        $girder.post("item?folderId=" + $scope.resultsFolder._id + "&name=sample_job").success(function (folder) {
            $girder.post("clusters", JSON.stringify({
                config: [
                    {
                        _id: "546a6364192c142c7da87aea"
                    }
                ],
                name: "sample_cluster-" + new Date().getTime(),
                template: "default_cluster"
            })).success(function (cluster) {
                if (cluster.status !== "created") {
                    console.warn(cluster);
                    return;
                }

                console.log("Cluster '" + cluster.name + "' created");

                $girder.post("jobs", JSON.stringify({
                    onComplete: {
                        cluster: "terminate"
                    },
                    input: [
                        {
                            itemId: $scope.meshItem._id,
                            path: "input"
                        }
                    ],
                    commands: [
                        "echo 'hello dave'",
                        "cp input/" + $scope.mesh.name + " mesh_copy.dat"
                    ],
                    name: "sample_job",
                    output: {
                        itemId: folder._id
                    }
                })).success(function (job) {
                    if (job.status !== "created") {
                        console.warn(job);
                        return;
                    }

                    console.log("Job " + job.name + " created");

                    $girder.put("clusters/" + cluster._id + "/start", JSON.stringify({
                        onStart: {
                            submitJob: job._id
                        }
                    })).success($scope.monitorJob(cluster, job));
                });
            }).error(function (data) {
                console.warn(data);
            });
        });
    };

    $scope.monitorJob = function (cluster, job) {
        return function () {
            var count = 0,
                delay = 3000;

            $girder.get("clusters/" + cluster._id + "/status")
                .success(function (response) {
                    console.log(response);
                    console.log("cluster status: " + response.status);
                    count++;
                    if (count === 2) {
                        window.setTimeout($scope.monitorJob(cluster, job), delay);
                    }
                });

            $girder.get("jobs/" + job._id + "/status")
                .success(function (response) {
                    console.log("job status: " + response.status);
                    count++;
                    if (count === 2) {
                        window.setTimeout($scope.monitorJob(cluster, job), delay);
                    }
                });
        };
    };

    $scope.downloadLink = function () {
        window.location.assign($girder.getApiBase() + 'file/' + $scope.mesh._id + '/download' + '?token=' + $girder.getAuthToken());
    };

    $scope.loadSimulations = function() {
        $girder.listFolders($scope.project._id).success(function(list) {
            var count = list.length;
            while(count--) {
                if (list[count].name === 'simulations') {
                    $scope.simulationsFolder = list[count];
                    updateSimulations(list[count]._id);
                } else if (list[count].name === 'results') {
                    $scope.resultsFolder = list[count];
                    updateResults(list[count]._id);
                }
            }
        });

        $girder.listItems($scope.project._id, "mesh")
            .success(function (items) {
                if (items.length === 0) {
                    console.error("no mesh item found");
                }

                $girder.listItemFiles(items[0]._id)
                    .success(function (files) {
                        var i;

                        $scope.meshItem = items[0];

                        if (items.length === 0) {
                            console.error("no mesh file found");
                        } else if (items.length > 1) {
                            console.error("multiple files found in mesh item");
                        }

                        updateMesh(files[0]);
                    });
            });
    };

    $scope.openSimulation = function (simulationId) {
        console.log('open simulation ' + simulationId);
        $scope.simulation = "Just to fill it and test the directive";
    };

    $scope.createSimulation = function () {
        var modalInstance = $modal.open({
            template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.create.simulation.html'),
            controller: 'HydraNeCreateSimulationCtrl',
            size: 'lg',
            resolve: {
                parentId: function() {
                    return $scope.simulationsFolder._id;
                }
            }
        });

        modalInstance.result.then(function(newSimulation) {
            //
            console.log('new simulation');
            console.log(newSimulation);
        });
    };

    $scope.deleteSimulation = function (simulationId) {
        console.log('delete simulation ' + simulationId);
    };


    $scope.results = [];
    $scope.simulations = [];
    $scope.mesh = null;
}]);
