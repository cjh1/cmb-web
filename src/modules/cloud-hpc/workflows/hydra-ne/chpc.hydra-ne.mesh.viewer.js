angular.module('chpc.workflow.hydra-ne')
   .directive('hydraNeMeshViewer', ['$templateCache', function($templateCache) {
      return {
         restrict: 'A',
         controller: ['$scope', function($scope) {
            var colorPalette = [
               "#76c9fb", "#7d85f8", "#8ff696", "#99b5ad", "#bfad71",
               "#fed50c", "#e8285d", "#fa4627", "#9c37fe", "#1353fe"
            ],
            session = null,
            viewport = null;

            $scope.mainVisible = true;
            $scope.activeFace = 0;
            $scope.faces = [];

            $scope.connect = function (url) {
               vtkWeb.smartConnect({ sessionURL: url },
                  function(connection) {
                     session = connection.session;
                     viewport = vtkWeb.createViewport({session:connection.session});
                     viewport.bind(".hydra-mesh-viewer .renderer");
                     viewport.resetCamera();

                     function rerender() {
                        viewport.render();
                     }

                     // Handle window resize
                     $(window).resize(function() {
                         if(viewport) {
                             viewport.render();
                         }
                     }).trigger('resize');

                     // Update face list
                     session.call('extract.faces', []).then(function(names) {
                        $scope.faces = [];
                        var size = names.length;
                        for(var i = 0; i < size; ++i) {
                           $scope.faces.push({ visible: true, name: names[i], color: colorPalette[i%colorPalette.length]});
                        }
                        for(var index = 0; index < $scope.faces.length; ++index) {
                           session.call('toggle.color', [ index, $scope.faces[index].color ]).then(rerender);
                        }
                        $scope.$apply();
                     });
                  },
                  function(code, error) {
                     console.log('Autobahn error ' + error);
                  });
            };

            function getNextColor (oldColor) {
               var oldIndex = colorPalette.indexOf(oldColor);
               oldIndex++;
               oldIndex = (oldIndex < 0) ? 0 : (oldIndex >= colorPalette.length ? 0 : oldIndex);
               return colorPalette[oldIndex];
            }

            $scope.toggleVisibility = function(index) {
               if(index === -1) {
                  $scope.mainVisible = !$scope.mainVisible;
                  var count = $scope.faces.length;
                  while(count--) {
                     $scope.faces[count].visible = $scope.mainVisible;
                  }
                  session.call('toggle.visibility', [ -1, $scope.mainVisible ]).then(function(){
                     viewport.render();
                  });
               } else {
                  $scope.faces[index].visible = !$scope.faces[index].visible;
                  session.call('toggle.visibility', [ index, $scope.faces[index].visible ]).then(function(){
                     viewport.render();
                  });
               }
            };

            $scope.updateActiveFace = function(index) {
               $scope.activeFace = index;
            };

            $scope.changeName = function(index, newName) {
               $scope.faces[index].name = newName;
            };

            $scope.changeColor = function(index) {
               $scope.faces[index].color = getNextColor($scope.faces[index].color);
               session.call('toggle.color', [ index, $scope.faces[index].color ]).then(function(){
                  viewport.render();
               });
            };

            console.log('mesh viewer activated');
         }],
         template: $templateCache.get('cloud-hpc/workflows/hydra-ne/chpc.hydra-ne.mesh.viewer.html')
       };
   }]);
