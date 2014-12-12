angular.module('chpc.workflow.hydra-ne')
   .directive('hydraNeResultViewer', ['$templateCache', function($templateCache) {
      return {
         restrict: 'A',
         scope: {
            launcherUrl: '@',
            itemId: '@'
         },
         controller: ['$scope', 'girder.net.GirderConnector', function($scope, $girder) {
            var session = null,
               autobahnConnection = null,
               viewport = null;

            $scope.$on("$destroy", function() {
               if(session) {
                  console.log("close PVWeb client");
                  var connectionToDelete = autobahnConnection;
                  // session.call('application.exit.later', [ 5 ]).then(function(){
                     try {
                        connectionToDelete.close();
                     } catch (closeError) {
                     }
                  // });
                  session = null;
                  autobahnConnection = null;
                  viewport = null;
               }
            });


         $scope.connect = function (url) {
               var configObject = {
                  application: 'result-viewer',
                  token: $girder.getAuthToken(),
                  itemId: $scope.itemId
               };
               if(url.indexOf("ws") === 0) {
                  configObject.sessionURL = url;
               } else {
                  configObject.sessionManagerURL = url;
               }
               vtkWeb.smartConnect(configObject,
                  function(connection) {
                     autobahnConnection = connection.connection;
                     session = connection.session;

                     $('.app-wait-start-page').remove();
                     $('.hide-on-start').removeClass('hide-on-start');

                     pv.initializeVisualizer( session, '.pv-viewport',
                                             '.pv-pipeline', '.pv-proxy-editor',
                                             '.pv-files', '.pv-source-list',
                                             '.pv-filter-list', '.pv-data-info');
                  },
                  function(code, error) {
                     console.log('Autobahn error ' + error);
                  });
            };
         }],
         template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.result.viewer.html')
       };
   }]);
