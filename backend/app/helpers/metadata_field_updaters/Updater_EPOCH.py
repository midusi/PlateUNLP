from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from app.helpers.metadatalib import epoca

class Updater_EPOCH(FieldUpdater):
    
    @classmethod
    def update(cls, metadata):
        if (True):
            metadata["EPOCH"] = epoca(metadata['DATE-OBS'])