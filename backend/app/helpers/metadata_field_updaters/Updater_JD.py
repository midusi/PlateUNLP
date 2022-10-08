from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import calculate_jd

class Updater_JD(FieldUpdater):
    
    DEPENDENCIES = ["DATE-OBS", "TIME-OBS"]
    
    @classmethod
    def update(cls, metadata):
        have_dependencies = True
        
        for key in cls.DEPENDENCIES:
            if (metadata.get(key) == None):
                have_dependencies = False
                break
            
        if (have_dependencies):
            metadata["JD"] = calculate_jd(metadata['DATE-OBS'], metadata['TIME-OBS'])
        
        return have_dependencies