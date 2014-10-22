angular.module('chpc.workflow.hydra-ne')

.controller('HydraNeCreateSimulationCtrl', [ '$scope', '$modalInstance', 'girder.net.GirderConnector', 'parentId', function($scope, $modalInstance, $girder, parentFolderId) {

    $scope.form = { analysis: 'energy', description: '' };

    console.log('parentFolderId found ' + parentFolderId);

    $scope.ok = function () {

        console.log($scope.form);

        $girder.createItem(parentFolderId, $scope.form.name, $scope.form.description, { type: $scope.form.analysis })
            .success(function (data) {
                console.log('create simulation');
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