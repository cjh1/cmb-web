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

    $scope.ok = function () {


        // Create folder and item with mesh inside
        $girder.createFolder($scope.form.group, $scope.form.name, $scope.form.description)
            .success(function (data) {
                console.log('create folder');
                console.log(data);

                $modalInstance.close(data);
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