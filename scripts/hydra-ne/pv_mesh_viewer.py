# import to process args
import os

# import paraview modules.
from paraview.web import wamp      as pv_wamp
from paraview.web import protocols as pv_protocols

# import RPC annotation
from autobahn.wamp import register as exportRpc

from paraview import simple
from vtk.web import server

try:
    import argparse
except ImportError:
    # since  Python 2.6 and earlier don't have argparse, we simply provide
    # the source for the same as _argparse and we use it instead.
    import _argparse as argparse

# =============================================================================
# Create custom Pipeline Manager class to handle clients requests
# =============================================================================

class _MeshViewer(pv_wamp.PVServerProtocol):

   meshFile = None
   faces = None

   @staticmethod
   def add_arguments(parser):
      parser.add_argument("--mesh", default=None, help="Surface Mesh to load", dest="file")

   @staticmethod
   def configure(args):
      _MeshViewer.authKey = args.authKey
      _MeshViewer.meshFile = args.file

   def initialize(self):
      # Bring used components
      self.registerVtkWebProtocol(pv_protocols.ParaViewWebMouseHandler())
      self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPort())
      self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPortImageDelivery())

      # Update authentication key to use
      self.updateSecret(_MeshViewer.authKey)

      # Process file onlu once
      if not _MeshViewer.faces:
         self.processFile()

   def processFile(self):
      reader = simple.OpenDataFile(_MeshViewer.meshFile)
      reader.UpdatePipeline()

      # Get information about cell data arrays
      nbFaces = 0
      cdInfo = reader.GetCellDataInformation()
      numberOfCellArrays = cdInfo.GetNumberOfArrays()
      for idx in xrange(numberOfCellArrays):
            array = cdInfo.GetArray(idx)
            if array.GetName() != 'modelfaceids':
               continue
            nbFaces = int(array.GetRange(-1)[1])

      # Extract each face and keep representation around
      _MeshViewer.faces = []
      for idx in range(nbFaces):
         threshold = simple.Threshold(Scalars = ['CELLS', 'modelfaceids'], Input=reader, ThresholdRange=[idx, idx])
         rep = simple.Show(threshold)
         _MeshViewer.faces.append(rep)

      view = simple.Render()
      view.Background = [0,0,0]

   def convertToColor(self, colorStr):
      encoding = "0123456789abcdef"
      result = []
      for colorIdx in range(3):
         value = float(encoding.index(colorStr[colorIdx*2])*16 + encoding.index(colorStr[colorIdx*2 + 1])) / 255.0
         result.append(value)
      return result

   @exportRpc('toggle.visibility')
   def toggleVisibility(self, index, visible):
      if index == -1:
         for rep in _MeshViewer.faces:
            rep.Visibility = visible
      else:
         _MeshViewer.faces[index].Visibility = visible

   @exportRpc('toggle.color')
   def changeColor(self, index, color):
      _MeshViewer.faces[index].DiffuseColor = self.convertToColor(color[1:])

   @exportRpc('extract.faces')
   def getFaceList(self):
      # FIXME when we get the right face names
      result = []
      for i in range(len(_MeshViewer.faces)):
         result.append("Face %d" % (i+1))
      return result

# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="Mesh Viewer")

    # Add arguments
    server.add_arguments(parser)
    _MeshViewer.add_arguments(parser)
    args = parser.parse_args()
    _MeshViewer.configure(args)

    # Start server
    server.start_webserver(options=args, protocol=_MeshViewer)
