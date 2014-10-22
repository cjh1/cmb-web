angular.module('chpc.workflow.hydra-ne')
.directive('hydraNeSimulation', ['$templateCache', function ($templateCache) {
    return {
        restrict: 'A',
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.edit.simulation.html')
    };
}])
.controller('hydraNeEditSimulationCtrl', [ '$scope', 'girder.net.GirderConnector', function($scope, $girder) {
   $scope.activeSection = 'mat';

   $scope.activate = function (sectionName) {
      console.log('activate ' + sectionName);
      $scope.activeSection = sectionName;
   };

}]);
