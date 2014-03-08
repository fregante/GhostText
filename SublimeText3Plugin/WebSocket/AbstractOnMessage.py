from .AbstractHandler import AbstractHandler


class AbstractOnMessage(AbstractHandler):
    """
    Abstract on message handler.
    """
    def on_message(self, text):
        raise NotImplementedError("error message")