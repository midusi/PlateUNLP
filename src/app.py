from bs4 import BeautifulSoup as bs
import requests

DOMAIN = 'http://sedici.unlp.edu.ar' #Dominio
#URL donde estan todas las imagenes, puse rpp=300 para que ponga todos los links en una pagina
URL = 'http://sedici.unlp.edu.ar/handle/10915/74499/discover?search-result=true&query=&current-scope=10915/74499&sort_by=score&order=desc&rpp=300' 
FILETYPE = '.fits' #tipo de archivos que voy a buscar
SUB_LINKS_ARRAY = [] #arreglo de sublinks (guarda solo los que dicen 'handle')


def get_soup(url): #devuele el HTML parseado de la url pasada como parametro
    return bs(requests.get(url).text, 'html.parser')

for link in get_soup(URL).find_all('a'): #busco todo lo que tenga 'a'
    sub_link = link.get('href') #me guardo cada sublink al que debo entrar(donde esta el link de cada archivo)
    if 'handle' in sub_link:
        SUB_LINKS_ARRAY.append(sub_link) #me guardo los sublinks en un arreglo

length = len(SUB_LINKS_ARRAY) #obtengo la longitud del arreglo de sub links

for i in range(length):  #para cada sub link vuelvo a hacer lo mismo
    
    soup = get_soup(DOMAIN+SUB_LINKS_ARRAY[i]) #obtengo el HTML parseado
    for sub_link2 in soup.find_all('a'): #busco todo lo que tenga 'a'
        file_link = sub_link2.get('href') #me guardo el link del archivo .fits
        if FILETYPE in file_link: # si el tipo de archivo(.fits) esta en el link
            file_name = soup.title.string + ".fits"  #le asigno como nombre al archivo el titulo + .fits
            print('Descargando el archivo: ' + file_name + '\n' +'del link: ' + DOMAIN+file_link + '\n') #imprimo que lo voy a descargar
            with open(file_name, 'wb') as file:
                response = requests.get(DOMAIN + file_link) #descargo el archivo
                file.write(response.content) 

#LO HACE DOS VECES POR CADA LINK PORQUE HAY DOS BOTONES PARA DESCARGAR (TOCANDO IMAGEN O TOCANDO DESCARGAR)