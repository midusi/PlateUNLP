from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import hora_local

class Updater_TIMEOBS(FieldUpdater):
    
    DEPENDENCIES = ["OBSERVAT", "DATE-OBS", "UT"]
    
    @classmethod
    def update(cls, metadata):
        have_dependencies = True
        
        for key in cls.DEPENDENCIES:
            if (metadata.get(key) == None):
                have_dependencies = False
                break
            
        if (have_dependencies):
            metadata["TIME-OBS"] = hora_local(metadata["OBSERVAT"] , metadata["DATE-OBS"], metadata["UT"])