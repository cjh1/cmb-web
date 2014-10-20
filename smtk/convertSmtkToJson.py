import xmltodict, json

pathToConvert = '/.../SimBuilderTemplates/XML/Hydra_Template.sbt'

with open(pathToConvert, 'r') as xmlSMTK:
    o = xmltodict.parse(xmlSMTK)
    with open('Hydra_Template.json', 'w') as outputFile:
        outputFile.write(json.dumps(o))
