# Segmentación de placa (Identificación de espectros)

La etapa de Segmentación de placa busca identificar las porciones del escaneo original que se corresponden a cada espectro a procesar.

Lo primero que hay que hacer es cargar el archivo de la placa escaneada:

![alt text](./images/PlateSegmentation/cargarEscaneo.png)

Una vez cargado el archivo, se habilita la interfaz de segmentación de espectros, compuesta por los siguientes elementos:

![alt text](./images/PlateSegmentation/elementosSegmentadorPlaca.png)

1. **Boton _Autodetect Bounding Boxes_**: al hacer clic, se ejecuta un modelo detector de espectros sobre la imagen. Sus predicciones se aprovechan para identificar las posiciones de cada espectro y señalarlas con cajas delimitadoras.
![alt text](./images/PlateSegmentation/plateSegmentationinfer.png)
Para saber mas leer [Detector de Espectros](./spectrum-detector.md)

2. **_Rotate 90º_**:  al hacer clic, la imagen es rotada la imagen 90º a la derecha. Solo afecta la visualización (no modifica cómo se almacenan los datos más adelante).

3. **_Invert colors_**: invierte los colores de la imagen. Sólo visualización.

4. **_Draw Box_**: al seleccionarlo se entra en modo de dibujo, lo cual permite al usuario crear cajas delimitadoras sobre la imagen. Así se puede indicar manualmente la posición de espectros.

5. **_Área de vizualización_**: se muestra el escaneo seleccionado en un menú interactivo que permite acercar, alejar y arrastrar la imagen. También se muestran las cajas delimitadoras especificadas y se permite redimensionarlas o moverlas. Para interactuar con una caja delimitadora, hacer clic sobre ella para entrar en modo de edición. Para deseleccionarla, hacer clic nuevamente sobre la misma caja o seleccionar otra.
![alt text](./images/PlateSegmentation/plateSegmentationBBEdit.gif)

6. **_Bounding Boxes List_**: se muestra un listado de cada una de las cajas delimitadoras especificadas sobre la imagen:
![alt text](./images/PlateSegmentation/boundingBoxList.png)
De cada caja se muestra su identificador (izquierda), el tipo de objeto que hay dentro (centro-derecha), un botón para eliminar la caja (derecha). Cuando una caja delimitadora está seleccionada también se muestra un conjunto de inputs con información que se tiene que especificar sobre cada caja:
    - OBJECT: Nombre del objeto observado.
    - DATE-OBS: Fecha de observación.
    - MAIN-ID: ID principal en la base de datos astronómica Simbad.
    -UT: tiempo universal.

    Se usarán más adelante para obtener el valor de un listado más grande de metadatos.

Una vez especificada la ubicación de todos los espectros y sus valores especificados se habilita el botón _Save_ con el que se podrá pasar a la siguiente etapa.