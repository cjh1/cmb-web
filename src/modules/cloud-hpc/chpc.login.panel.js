angular.module('chpc.directives', [])
    .directive('chpcLoginPanel', ['$templateCache', function($templateCache) {
        return {
            restrict: 'AC',
            template: $templateCache.get('cloud-hpc/chpc.login.panel.html')
        };
    }])
    .directive('chpcEnter', function() {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.chpcEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });