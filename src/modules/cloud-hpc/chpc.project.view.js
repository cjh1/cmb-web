angular.module('chpc.main')
.directive('projectView', ['$compile', function($compile) {
        return {
            restrict: 'E',
            compile: function (element, attrs) {
                return function(scope, element) {
                    var view = angular.element('<a-project></a-project>'.replace(/a/g, scope.workflowType));
                    element.append(view);
                    $compile(view)(scope);
                };
            }
        };
}]);