angular.module('chpc.workflow.hydra-ne')

.controller('HydraNeCreateSimulationCtrl', [ '$scope', '$modalInstance', 'girder.net.GirderConnector', 'parentId', function($scope, $modalInstance, $girder, parentFolderId) {

    $scope.form = { analysis: 'energy', description: '' };

    $scope.ok = function () {
        $girder.createItem(parentFolderId, $scope.form.name, $scope.form.description, { type: $scope.form.analysis })
            .success(function (data) {
                $modalInstance.close(data);
            })
            .error(function (data, status, headers, config) {
                $modalInstance.dismiss('cancel');
            });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
