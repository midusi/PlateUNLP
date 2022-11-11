from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import angulo_horario

class Updater_HA(FieldUpdater):
    
    DEPENDENCIES = ["RA1950", "ST"]
    
    @classmethod
    def update(cls, metadata):
        have_dependencies = True
        
        for key in cls.DEPENDENCIES:
            if (metadata.get(key) == None):
                have_dependencies = False
                break
            
        if (have_dependencies):
            metadata["HA"] = angulo_horario(metadata["RA1950"], metadata["ST"])
        
        return have_dependencies