angular.module('chpc.workflow.hydra-ne')
.directive('hydraNeCreateProject', ['$templateCache', function($templateCache) {
    return {
        restrict: 'E',
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.create.project.html')
    };
}])
.controller('HydraNeCreateProjectCtrl', [ '$scope', '$modalInstance', 'girder.net.GirderConnector', 'title', 'group', function($scope, $modalInstance, $girder, title, group) {

    $scope.title = title;
    $scope.form = {group:group};

    $scope.$on('file-uploaded', function(origin, uploadItem) {
        console.log(uploadItem);
        console.log('trigger post-processing of the mesh ' + uploadItem._id);
    });

    $scope.ok = function () {
        // Create folder and item with mesh inside
        $girder.createFolder($scope.form.group, $scope.form.name, $scope.form.description)
            .success(function (folder) {
                $girder.createItem(folder._id, "mesh", "Mesh file used for simulation")
                    .success(function (item) {
                        $girder.uploadFileItem(item._id, $scope.form.mesh);
                    })
                    .error(function (data) {
                        console.warn('Could not create mesh item');
                        console.warn(data);
                    });

                $girder.createFolder(folder._id, "results", "Simulation results")
                    .error(function (data) {
                        console.warn('Could not create results folder');
                        console.warn(data);
                    });

                $girder.createFolder(folder._id, "simulations", "Simulations")
                    .error(function (data) {
                        console.warn('Could not create simulations folder');
                        console.warn(data);
                    });

                $modalInstance.close(folder);
            })
            .error(function (data, status, headers, config) {
                console.log('creation failed');
                console.log(data);
                console.log(status);
                console.log(headers);
                console.log(config);
                $modalInstance.dismiss('cancel');
            });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
