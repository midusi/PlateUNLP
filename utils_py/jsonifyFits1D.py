import json
import os

class FileFinder:
    folder_path:str
    
    def __init__(self, folder_path):
        self.folder_path = folder_path
 
    def filename_in_folder(self, startwhith:list) -> dict:
        # Esta funcion recupera todos los archivos que inicien con alguna de 
        # las cadenas especificadas y un diccionario con las archivos que 
        # matchearon con cada inicio.

        filepaths:dict = {item: [] for item in startwhith}
        
        for path, folders, files in os.walk(self.folder_path):
            for file in files:
                for start in startwhith:
                    if file.startswith(start):
                        filepaths[start].append(os.path.join(path, file))
                        break
        return filepaths

def jsonifyFits1D():
    folder_path = "C:\\Users\\santi\\OneDrive\\Documentos\\Doctorado\\Datos Crudos"
    ff = FileFinder(folder_path=folder_path)
    start_array1 = ["WOBJ", "WCOMP"]
    start_array2 = ["EFBTOBJ", "EFBTCOMP"]
    filesW = ff.filename_in_folder(startwhith=start_array1)
    filesW = filesW["WOBJ"] + filesW["WCOMP"]
    filesEFBT = ff.filename_in_folder(startwhith=start_array2)
    filesEFBT = filesEFBT["EFBTOBJ"] + filesEFBT["EFBTCOMP"]
    
    function_json = {}
    return function_json