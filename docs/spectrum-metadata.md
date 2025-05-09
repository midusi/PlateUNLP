# Metadatos de espectro

En esta seccion se busca obtener los metadatos que corresponden especificamente al espectro con el que se esta trabajando:

![alt text](./images/SpectrumMetadata/SpectrumMetadata.png)

El sistema aprovecha los datos ingresados hasta el momento por el usuario para obtener los valores de los siguientes metadatos:

| Metadato | Definición |
|:---------|:----------:|
| TIME-OBS | Tiempo local al inicio de la observación |
| ST | Tiempo sideral medio local|
| HA | Ángulo horario |
| RA | Ascensión recta |
| DEC | Declinación |
| GAIN | Ganancia, electrones por adu |
| RA2000 | Ascensión recta ICRS J2000 |
| DEC2000 | Declinación ICRS J2000 |
| RA1950 | Sistema de coordenadas FK4 |
| DEC1950 | Sistema de coordenadas FK4 |
| EXPTIME | Tiempo de integración en segundos |
| DETECTOR | Instrumento que captura la imagen |
| IMGTYP | Object, dark, zero, etc. |
| SPTYPE | Tipo espectral SIMBAD |
| JD | Fecha Juliana |
| EQUINOX | Época de RA y DEC |
| AIRMASS | Masa de aire |

Escencialmente solo se requieren 4 metadatos para calcular el maximo posible de informacion, sean estos OBJECT, DATE-OBS, OBSERVAT, UT. En este punto los mismos ya fueron especificados por el usuario por lo que al entrar a la etapa PlateUNLP empieza a calcular los demas.

SPTYPE y MAIN-ID no son obtenibles de forma analitica, es necesario consultarlo al repositorio externo [SIMBAD](https://simbad.cfa.harvard.edu/simbad/).

Ademas, el usuario puede indicar que no conoce algunos de los 4 metadatos escenciales. Dependiendo de la información disponible el sistema calculara mas o menos informacion. El siguiente diagrama muestra que metadatos se requieren para obtener cada uno y si los mismos requieren la interaccion del usuario o de un repositorio externo:

![Diagrama de dependencias de metadatos. Con icono de usuario aquellos que si o si deben ser ingresados por el usuario. Con icono de SIMBAD aquellos que son consultados al repositorio de igual nombre.](./images/SpectrumMetadata/dependenciasMetadatos.png)

Una vez calculados todos los datos el usuario puede modificar los valores determinados por PlateUNLP si es que no le parece correcto.

Al presionar el boton _Save_ se guardan los valores actuales y se pasa a la etapa siguiente.
