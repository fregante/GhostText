import socket
from .Request import Request
from .Response import Response

class HttpServer:
    """
    A simple, single threaded, http server.
    """
    def __init__(self, host='localhost', port=4001):
        self._on_request_handler = None
        self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._socket.bind((host, port))
        self._conn = None
        self._address = None

    def start(self):
        """
        Starts the server.
        """
        print('HTTP Start')
        self._socket.listen(1)

        while True:
            self._conn, self._address = self._socket.accept()
            request = self._recv_all()
            request = self._parse_request(request)
            response = self._on_request_handler.on_request(request)
            self._conn.sendall(bytes(self._build_response(response), 'UTF-8'))
            self._conn.close()

    def stop(self):
        """
        Stops the server.
        """
        print('HTTP Stop')
        self._socket.close()

    def _recv_all(self):
        """
        Receive all data.
        """
        msg = bytearray()
        while True:
            chunk = self._conn.recv(4096)
            msg.extend(chunk)

            if len(chunk) < 4096:
                break

        return msg

    def _parse_request(self, request):
        """
        Parses the http request string and returns the request parts.
        """
        headers_temp = request.decode("utf-8").strip().split("\r\n")
        request_method, request_uri, http_version = headers_temp.pop(0).split(" ")
        request_headers = {}

        for header in headers_temp:
            key, value = header.split(": ")
            request_headers[key] = value

        return Request(request_method, request_uri, http_version, request_headers)

    def _build_response(self, response):
        response_header = ""

        for key in response.get_headers():
            response_header += "{}: {}\r\n".format(key, response.get_headers()[key])

        return "HTTP/1.1 {} OK\r\n{}\r\n{}".format(response.get_status(), response_header, response.get_data())

    def on_request(self, handler):
        """
        Sets the on request handler.
        """
        print('Setting on request handler')
        self._on_request_handler = handler
        self._on_request_handler.set_http_server(self)