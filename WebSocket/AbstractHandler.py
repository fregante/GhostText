class AbstractHandler():
    """
    Abstract on whatever handler.
    """
    def __init__(self):
        self._web_socket_server = None

    def set_web_socket_server(self, web_socket_server):
        self._web_socket_server = web_socket_server