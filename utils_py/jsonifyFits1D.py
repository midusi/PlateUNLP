import os
import json
import numpy as np
from astropy.io import fits

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

def extract_lamp_info(filepath:str, normalize:bool=False):
    """Funcion para obtener los datos de un archivo correspondiente a una lampara de comparación

    Args:
        filepath (str, optional): Direccion del archivo.
        normalize (bool, optional): Booleano para saber si los datos de respuesta deben estar. 
        normalizados o no. Defaults to False.

    Returns:
        numpy.ndarray: Datos de la lampara correspondientes al eje X
        numpy.ndarray: Datos de la lampara correspondientes al eje Y
        list: Headers adjuntos al archivo
    """
    # Extraer datos y headers del archivo
    hdul = fits.open(filepath) 
    if('WOBJ' in filepath): # Espectro calibrado
        headers = hdul[0].header
        data = hdul[0].data[0][0]
    else:
        headers = hdul[0].header
        data = hdul[0].data
    
    # Separ datos en X e Y
    obs_x = np.array(range(len(data)))
    obs_y = data
    
    # Normalizado de los datos obserbados en el eje Y
    if (normalize):
        obs_y, _, _ = normalize_min_max(obs_y)
    
    return obs_x, obs_y, headers

def jsonifyFits1D(path:str):
    #folder_path = "C:\\Users\\santi\\OneDrive\\Documentos\\Doctorado\\Datos Crudos" #Home
    folder_path = "/home/sponte/Documentos/Doctorado/AppAlineado/AppAlineado/db/exampleLampsFiles/Conjunto_Original(HeNeAr)/WCOMPs" #Lab
    ff = FileFinder(folder_path=folder_path)
    start_array = ["WOBJ", "WCOMP"]
    filesW = ff.filename_in_folder(startwhith=start_array)
    filesW = filesW["WOBJ"] + filesW["WCOMP"]

    folder_path = "/home/sponte/Documentos/Doctorado/AppAlineado/AppAlineado/db/exampleLampsFiles/Conjunto_Original(HeNeAr)/EFBTCOMPs" #Lab
    ff = FileFinder(folder_path=folder_path)
    start_array = ["EFBTOBJ", "EFBTCOMP"]
    filesEFBT = ff.filename_in_folder(startwhith=start_array)
    filesEFBT = filesEFBT["EFBTOBJ"] + filesEFBT["EFBTCOMP"]

    for file in filesW:
        name = file.split('/')[-1].split('.')[0]
        print(name)
        emp_x, emp_y, emp_head = extract_lamp_info(file, normalize=False)

        for_json = [{"pix":str(it[0]), "wav":str(it[1])} for it in zip(emp_x, emp_y)]

        with open(os.path.join(path,f"{name}.json"), "w") as archivo_json:
            json.dump(for_json, archivo_json, indent=4)

path_save = '/home/sponte/Documentos/Doctorado/AppAlineado/AppAlineado/db/exampleLampsFiles/Conjunto_Original(HeNeAr)/WCOMPs_JSON'
jsonifyFits1D(path=path_save)