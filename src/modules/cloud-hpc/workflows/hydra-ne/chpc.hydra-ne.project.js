angular.module('chpc.workflow.hydra-ne')
.directive('hydraNeProject', ['$templateCache', function($templateCache) {
    return {
        restrict: 'E',
        template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.project.html')
    };
}]);