from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import epoca

class Updater_EQUINOX(FieldUpdater):
    
    DEPENDENCIES = ["DATE-OBS"]
    
    @classmethod
    def update(cls, metadata):
        have_dependencies = True
        
        for key in cls.DEPENDENCIES:
            if (metadata.get(key) == None):
                have_dependencies = False
                break
            
        if (have_dependencies):
            metadata["EQUINOX"] = epoca(metadata['DATE-OBS'])
            
        return have_dependencies