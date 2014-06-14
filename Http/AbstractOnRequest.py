from .AbstractHandler import AbstractHandler


class AbstractOnRequest(AbstractHandler):
    """
    Abstract on request handler.
    """
    def on_request(self, method, uri, version, headers):
        raise NotImplementedError("error message")