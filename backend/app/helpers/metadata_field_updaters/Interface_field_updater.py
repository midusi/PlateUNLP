from abc import ABC
from abc import abstractmethod

# Esta clase actua a modo de interface para asegurarnos de que todos los 
# campos sepan como hallar su valor
class FieldUpdater(ABC):
    
    # Este metodo recibe un conjunto de metadatos lo actualiza segun si tiene 
    # que agregar un campo o no.
    # En caso de poder agrega el campo que esta relacionado a la clase y termina. 
    # En caso de que no tenga los metadatos necesarios para calcular su metadato 
    # relacionado entonces no hace nada.
    # Puede levantar alertas bajo ciertas condiciones (Por ejemplo: Si un valor 
    # necesario no es satisfactorio para sus calculos)
    @abstractmethod
    def update(cls, metadata):
        pass