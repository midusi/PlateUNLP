from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import simbad_cooJ1950

class Updater_RA1950_DEC1950(FieldUpdater):
    
    DEPENDENCIES = ["RA2000", "DEC2000"]
    
    @classmethod
    def update(cls, metadata):
        have_dependencies = True
        
        for key in cls.DEPENDENCIES:
            if (metadata.get(key) == None):
                have_dependencies = False
                break
            
        if (have_dependencies):
            metadata["RA1950"], metadata["DEC1950"] = simbad_cooJ1950(metadata["RA2000"], metadata["DEC2000"])
            
        return have_dependencies