from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import simbad_sptype

class Updater_SPTYPE(FieldUpdater):
    
    @classmethod
    def update(cls, metadata):
        if (True):
            metadata["SPTYPE"] = simbad_sptype(metadata['OBJECT'])