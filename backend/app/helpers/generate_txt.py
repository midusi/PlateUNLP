import os
def generate_txt(plateData,data,path,fileName):
	
	path = os.path.join(path,f'{fileName}.txt')
	f= open(path,"w+")

	if(plateData["PLATE-N"] == ""):
		plate = "sin identificacion"
	else:
		plate = f'identificada como {plateData["PLATE-N"]}'

	if(data["OBJECT"] == ""):
		object_id = "una fuente astronómica desconocida"
	else:
		object_id = f'la fuente astronómica {data["OBJECT"]}'

	if(data["DATE-OBS"] == ""):
		date = "en una fecha desconocida"
	else:
		date = f'en la fecha {data["DATE-OBS"]}'

	if(plateData["OBSERVAT"] == ""):
		observatory = "un observatorio desconocido"
	else:
		observatory = f'el observatorio {plateData["OBSERVAT"]}'

	mensaje = f'Archivo en formato FITS de la placa espectrográfica {plate} de {object_id} observada {date} desde {observatory}. Digitalizado con un escaner Nikon LS-9000ED en el marco del proyecto de Recuperación del Trabajo Observacional Histórico (ReTrOH) de la Facultad de Ciencias Astronómicas y Geofísicas de la Universidad Nacional de La Plata (FCAG-UNLP) en colaboración con Nuevo Observatorio Virtual Argentino (NOVA).'
	f.write(mensaje)
	f.close()
