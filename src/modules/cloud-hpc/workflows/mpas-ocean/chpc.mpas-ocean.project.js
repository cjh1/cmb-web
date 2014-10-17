angular.module('chpc.workflow.mpas-ocean')
.directive('mpasOceanProject', ['$templateCache', function($templateCache) {
    return {
        restrict: 'E',
        template: $templateCache.get('cloud-hpc/workflows/mpas-ocean/chpc.mpas-ocean.project.html')
    };
}]);