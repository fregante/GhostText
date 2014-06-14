import socket
import json


class Server:
    """
    A simple, single threaded, http server.
    """
    def __init__(self, host='localhost', port=1338):
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

        i = 0

        while True:
            self._conn, self._address = self._socket.accept()
            request = self._recv_all()
            request_method, request_uri, http_version, request_headers = self._parse_request(request)
            response_status, response_headers, response_data = \
                self._on_request_handler.on_request(request_method, request_uri, http_version, request_headers)
            response = self._build_response(response_status, response_headers, response_data)
            self._conn.sendall(bytes(response, 'UTF-8'))
            self._conn.close()
            i += 1

        self.stop()

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
        return self._conn.recv(1024)

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

        return request_method, request_uri, http_version, request_headers

    def _build_response(self, status, response_headers, response_data):
        response_header = ""

        for key in response_headers:
            response_header += "{}: {}\r\n".format(key, response_headers[key])

        return "HTTP/1.1 {} OK\r\n{}\r\n{}".format(status, response_header, response_data)

    def on_request(self, handler):
        """
        Sets the on request handler.
        """
        print('Setting on request handler')
        self._on_request_handler = handler
        self._on_request_handler.set_http_server(self)