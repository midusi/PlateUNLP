import os
import json

class DictPersistJSON(dict):
    def __init__(self, filename, *args, **kwargs):
        self.filename = filename
        self._load()
        self.update(*args, **kwargs)

    def _load(self):
        if os.path.isfile(self.filename) and os.path.getsize(self.filename) > 0:
            with open(self.filename, 'r') as fh:
                self.update(json.load(fh))

    def _dump(self):
        with open(self.filename, 'w') as fh:
            json.dump(self, fh, indent=4)

    def __getitem__(self, key):
        return dict.__getitem__(self, key)

    def __setitem__(self, key, val):
        dict.__setitem__(self, key, val)
        self._dump()

    def __repr__(self):
        dictrepr = dict.__repr__(self)
        return '%s(%s)' % (type(self).__name__, dictrepr)

    def update(self, *args, **kwargs):
        for k, v in dict(*args, **kwargs).items():
            self[k] = v
        self._dump()
