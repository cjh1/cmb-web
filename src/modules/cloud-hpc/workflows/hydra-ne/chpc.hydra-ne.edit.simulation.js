angular.module('chpc.workflow.hydra-ne')
.directive('hydraNeSimulation', ['$templateCache', function ($templateCache) {
    return {
        restrict: 'A',
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.edit.simulation.html')
    };
}])
.directive('inputParameter', ['$templateCache', function ($templateCache) {
  return {
        scope: {
          property: '='
        },
        restrict: 'A',
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.property.html')
    };
}])
.controller('hydraNeEditSimulationCtrl', [ '$scope', 'girder.net.GirderConnector', function($scope, $girder) {
   var statusClasses = { complete: 'fa-check green', incomplete: 'fa-close red'},
      sectionsStatus = {};

  $scope.activeSection = 'mat';
  $scope.inputTemplate = {};
  $girder.fetch('assets/input-hydra.json')
    .success(function(data) {
      $scope.inputTemplate = data;
      sectionsStatus = {};

      var array = data.views,
          count = array.length;
      while(count--) {
        sectionsStatus[array[count].id] = 'incomplete';
      }
    })
    .error(function() {
      console.log('error fetching def');
    });

  $scope.validate = function(sectionName) {
    sectionsStatus[sectionName] = 'complete';
  };

  $scope.getClassIcon = function(sectionName) {
    return statusClasses[sectionsStatus[sectionName]];
  };

  $scope.activate = function (sectionName) {
    $scope.activeSection = sectionName;
  };

}]);
