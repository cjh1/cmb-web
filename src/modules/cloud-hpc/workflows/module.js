// Root module
angular.module('chpc',
    ['chpc.main', 'chpc.directives', 'chpc.workflow.hydra-ne', 'chpc.workflow.mpas-ocean'])
    // Helper filter
    .filter('toDateNumber', function() {
        return function(str) {
            var day = str.split(' ')[0].split('-'),
                time = str.split(' ')[1].split('.')[0].split(':'),
                args = [].concat(day, time);
            return new Date(args[0], args[1], args[2], args[3], args[4], args[5]).getTime();
        };
    })
    .filter('bytes', function() {
        return function(bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
            if (typeof precision === 'undefined') precision = 1;
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
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
