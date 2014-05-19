from .AbstractHandler import AbstractHandler


class AbstractOnClose(AbstractHandler):
    """
    Abstract on connection close handler.
    """
    def on_close(self):
        raise NotImplementedError("error message")