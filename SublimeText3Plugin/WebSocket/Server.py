import socket
from .Frame import Frame
from .Handshake import Handshake


class Server:
    """
    A simple, single threaded, web socket server.
    """
    def __init__(self, host='localhost', port=1337):
        self._handshake = Handshake()
        self._frame = Frame()

        self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._socket.bind((host, port))

        self._on_message_handler = None
        self._on_close_handler = None
        self._running = False
        self._conn = None
        self._address = None

        self._received_payload = ''

    def start(self):
        """
        Starts the server,
        """
        print('Start')
        self._socket.listen(1)
        self._conn, self._address = self._socket.accept()
        self._running = True

        data = self._conn.recv(1024)
        self._conn.sendall(self._handshake.perform(data).encode("utf-8"))

        while self._running:
            header = self._conn.recv(24)  # Max web socket header length

            if len(data) > 0:
                self._frame = Frame()

                try:
                    self._frame.parse(header)
                except IndexError:
                    self._running = False
                    continue

                if self._frame.terminate:
                    self._running = False
                    continue

                data = bytearray()
                data.extend(header)
                offset = self._frame.get_payload_offset()
                data.extend(self._conn.recv(offset))

                if self._frame.utf8:
                    request = self._frame.get_payload(data).decode("utf-8")
                    self._received_payload += request.lstrip('\x00')

                if self._frame.utf8 and self._frame.fin:
                    self._on_message_handler.on_message(self._received_payload)
                    self._received_payload = ''

        print('Stop')
        self.stop()

    def send_message(self, txt):
        """
        Sends a message if the server is in running state.
        """
        if not self._running:
            return

        self._frame = Frame()
        raw_data = self._frame.create(txt)
        self._conn.send(raw_data)

    def stop(self):
        """
        Stops the server by sending the fin package to the client and closing the socket.
        """
        self._running = False
        self._conn.send(self._frame.close())
        self._conn.close()
        if self._on_close_handler:
            print('Triggering on_close')
            self._on_close_handler.on_close()

    def on_message(self, handler):
        """
        Sets the on message handler.
        """
        print('Setting on message handler')
        self._on_message_handler = handler
        self._on_message_handler.set_web_socket_server(self)

    def on_close(self, handler):
        """
        Sets the on connection closed handler.
        """
        print('Setting on close handler')
        self._on_close_handler = handler
        self._on_close_handler.set_web_socket_server(self)