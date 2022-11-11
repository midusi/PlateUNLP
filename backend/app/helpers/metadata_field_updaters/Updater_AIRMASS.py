from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import calculate_airmass

class Updater_AIRMASS(FieldUpdater):    
    
    DEPENDENCIES = ["OBSERVAT", "HA", "RA", "DEC"]
    
    @classmethod
    def update(cls, metadata):
        have_dependencies = True
        
        for key in cls.DEPENDENCIES:
            if (metadata.get(key) == None):
                have_dependencies = False
                break
            
        if (have_dependencies):
            metadata["AIRMASS"] = calculate_airmass(metadata["OBSERVAT"].split(':')[0], metadata["HA"], metadata["RA"], metadata["DEC"])
            
        return have_dependencies