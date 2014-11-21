// Root module
angular.module('chpc',
    ['chpc.main', 'chpc.directives', 'chpc.workflow.hydra-ne', 'chpc.workflow.mpas-ocean'])
    // Helper filter
    .filter('toDateNumber', function() {
        return function(str) {
            return new Date(str).getTime();
        };
    })
    .directive("fileread", [function () {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.fileread = loadEvent.target.result;
                        });
                    };
                    reader.readAsDataURL(changeEvent.target.files[0]);
                });
            }
        };
    }])
    .directive("filemeta", [function () {
        return {
            scope: {
                filemeta: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    scope.$apply(function () {
                        scope.filemeta = changeEvent.target.files[0];
                    });
                });
            }
        };
    }]);

angular.module('chpc.main',
    ['girder.net', 'ui.bootstrap']);