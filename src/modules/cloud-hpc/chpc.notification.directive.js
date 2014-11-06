angular.module('chpc.main')
.directive('notificationCenter', ['$templateCache', function ($templateCache) {
    return {
        controller: ['$scope', '$timeout', function ($scope, $timeout) {
            var id = null,
                timeoutValue = 5000; // 5s

            $scope.message = null;
            $scope.$on('notification-message', function (evt, message) {
                if (id) {
                    $timeout.cancel(id);
                }

                $scope.message = message;

                id = $timeout(function () {
                    $scope.message = null;
                }, timeoutValue);
            });

            $scope.hide = function () {
                $scope.message = null;
            };

            $scope.percentage = function () {
                return 100 * $scope.message.done / $scope.message.total;
            };

            $scope.percentageInt = function () {
                return Math.floor($scope.percentage());
            };
        }],

        template: $templateCache.get('cloud-hpc/chpc.notification.center.html')
    };
}]);
