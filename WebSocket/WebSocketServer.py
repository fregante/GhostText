import socket
import traceback
from math import ceil
from .Frame import Frame
from .Handshake import Handshake


class WebSocketServer:
    """
    A simple, single threaded, web socket server.
    """

    _id = 1

    def __init__(self, host='localhost', port=0):
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
        self._port = 0
        self._close_frame_send = False
        self._close_frame_received = False

        self._received_payload = ''
        self._id = WebSocketServer._id
        WebSocketServer._id += 1
        print("WebSocketServer id: {}".format(self._id))

    def start(self):
        """
        Starts the server,
        """
        print('Start')
        self._socket.listen(1)
        self._port = self._socket.getsockname()[1]
        print('Listening on: {}'.format(self._port))
        self._running = True
        self._conn, self._address = self._socket.accept()

        data = self._recv_all()
        self._conn.sendall(self._handshake.perform(data).encode("utf-8"))

        while self._running:
            try:
                header = self._conn.recv(24)  # Max web socket header length
            except OSError:
                self._running = False
                continue

            if len(data) > 0:
                self._frame = Frame()

                try:
                    self._frame.parse(header)
                except IndexError:
                    print(str(e))
                    print(traceback.format_exc())
                    self._running = False
                    continue

                if self._frame.terminate:
                    self._close_frame_received = True
                    if not self._close_frame_send:
                        self._conn.send(self._frame.close())
                        self._close_frame_send = True
                    self._running = False
                    continue

                data = bytearray()
                data.extend(header)
                offset = self._frame.get_payload_offset()

                if offset > 0:
                    try:
                        for offset_part in range(0, ceil(offset/4096)):
                            data.extend(self._conn.recv(4096))
                    except MemoryError as e:
                        print(str(e))
                        print(traceback.format_exc())
                        continue

                if self._frame.utf8:
                    try:
                        request = self._frame.get_payload(data).decode("utf-8")
                        self._received_payload += request.lstrip('\x00')
                    except UnicodeDecodeError:
                        continue

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
        try:
            if not self._close_frame_send and not self._close_frame_received:
                self._conn.close()
        except BrokenPipeError:
            print('Ignored BrokenPipeError')
        except OSError:
            print('Ignored OSError')

        if self._on_close_handler:
            print('Triggering on_close')
            self._on_close_handler.on_close()

    def initiate_close(self):
        """
        Initiates the close handshake at the server side
        """
        self._conn.send(self._frame.close())
        self._close_frame_send = True


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

    def get_running(self):
        """
        Returns the running state.
        """
        return self._running

    def get_port(self):
        """
        Gets the port the server is listening/running on.
        """
        return self._port

    def get_id(self):
        """
        Gets the server's id.
        """
        return self._id


    def _recv_all(self, chunk_size=4096):
        """
        Receive all data.
        """
        msg = bytearray()
        while True:
            chunk = self._conn.recv(chunk_size)
            msg.extend(chunk)

            if len(chunk) < chunk_size:
                break

        return msg