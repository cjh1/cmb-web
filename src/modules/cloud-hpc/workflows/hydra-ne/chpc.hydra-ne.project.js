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
