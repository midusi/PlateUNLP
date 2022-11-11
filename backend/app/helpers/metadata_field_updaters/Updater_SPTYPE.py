from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import simbad_sptype

class Updater_SPTYPE(FieldUpdater):
    
    DEPENDENCIES = ["OBJECT"]
    
    @classmethod
    def update(cls, metadata):
        have_dependencies = True
        
        for key in cls.DEPENDENCIES:
            if (metadata.get(key) == None):
                have_dependencies = False
                break
            
        if (have_dependencies):
            metadata["SPTYPE"] = simbad_sptype(metadata['OBJECT'])
            
        return have_dependencies