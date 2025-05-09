# Elección de espectro

A partir de esta etapa el usuario tendrá que elegir con que espectro trabajara a cada momento. Para facilitar esta tarea, se presenta el menú de selección de espectros:

![alt text](./images/SpectrumSelection/SpectrumSelection.png)

En este menú se muestra una tabla en la que, para cada espectro, se detalla la siguiente información:

1. **_Name_**: nombre identificador del espectro.
2. **_Image_**: recorte de la porción del escaneo que corresponde al espectro.
3. **_Steps_**: cantidad de etapas que faltan completar para obtener los datos procesados de cada espectro.
4. **_Status_**: un espectro estar en 1 de 2 estados:
    - _Pending_: faltan realizar tareas para terminar de procesar el espectro.
    - _Complete_: el espectro está totalmente procesado y listo para su descarga.
5. **_Download Button_**: permite la descarga de los datos procesados de un espectro. Si el espectro no está del todo procesado descarga los archivos de procesado en el estado intermedio en que se encuentren.
6. **_Select and Work Button_**: al cliquear indica a _PlateUNLP_ que el usuario quiere continuar con el procesado de ese espectro. El usuario es redirigido a la siguiente etapa de procesamiento y la barra de navegación se actualiza para reflejar con qué espectro se está trabajando:
![alt text](./images/SpectrumSelection/SpectrumSelectionSelectSpectrum.png)