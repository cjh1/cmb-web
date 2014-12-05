angular.module('chpc.workflow.hydra-ne')
.directive('hydraNeSimulation', ['$templateCache', function ($templateCache) {
    return {
        restrict: 'A',
        scope: {
          item: '='
        },
        controller: [ '$scope', 'girder.net.GirderConnector', function($scope, $girder) {
          var statusClasses = { complete: 'fa-check green', incomplete: 'fa-close red'},
              sectionsStatus = {};

          $scope.activeSection = 'mat';
          $scope.inputTemplate = {};
          $scope.dataValues = {};

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

          $scope.initialize = function () {
            angular.forEach(sectionsStatus, function(value, key) {
              this[key] = 'incomplete';
            }, sectionsStatus);

            // Download data model
            $girder.downloadContentFromItem($scope.item, 'input', function(content) {
              $scope.dataValues = content;
            });
          };

          $scope.validate = function (sectionName) {
            sectionsStatus[sectionName] = 'complete';
            $girder.uploadContentToItem($scope.item, 'input', angular.toJson($scope.dataValues, true));
            $girder.uploadContentToItem($scope.item, 'input-deck.txt', templates.hydraInputDeck({ data : $scope.dataValues }));
          };

          $scope.getClassIcon = function (sectionName) {
            return statusClasses[sectionsStatus[sectionName]];
          };

          $scope.activate = function (sectionName) {
            $scope.activeSection = sectionName;
          };
        }],
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.edit.simulation.html')
    };
}])
.directive('inputParameter', ['$templateCache', function ($templateCache) {
  return {
        scope: {
          property: '=',
          values: '='
        },
        restrict: 'A',
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.property.html')
    };
}]);
