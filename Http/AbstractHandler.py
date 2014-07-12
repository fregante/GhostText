class AbstractHandler():
    """
    Abstract on whatever handler.
    """
    def __init__(self):
        self._http_server = None

    def set_http_server(self, http_server):
        self._http_server = http_server