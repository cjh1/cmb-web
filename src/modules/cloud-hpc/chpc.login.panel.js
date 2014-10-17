angular.module('chpc.directives', [])
    .directive('chpcLoginPanel', ['$templateCache', function($templateCache) {
        return {
            restrict: 'AC',
            template: $templateCache.get('cloud-hpc/chpc.login.panel.html')
        };
  }]);