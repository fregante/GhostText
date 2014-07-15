import socket
import traceback
from .Request import Request


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
        self._run = True

    def start(self):
        """
        Starts the server.
        """
        print('HTTP Start')
        self._socket.listen(1)

        while self._run:
            try:
                self._conn, self._address = self._socket.accept()
                request = self._recv_all()
                if len(request) > 0:
                    request = self._parse_request(request)
                    response = self._on_request_handler.on_request(request)
                    self._conn.sendall(bytes(self._build_response(response), 'utf-8'))
                self._conn.close()
            except ConnectionAbortedError:
                pass
            except OSError as e:
                print(str(e))
                print(traceback.format_exc())
                pass

        self._conn = None
        print('HTTP Stopped')

    def stop(self):
        """
        Stops the server.
        """
        print('HTTP server is stopping now…')
        self._run = False

        if self._conn is not None:
            try:
                self._conn.close()
            except OSError as e:
                print(str(e))
                print(traceback.format_exc())
                pass

        try:
            self._socket.shutdown(socket.SHUT_RDWR)
        except OSError as e:
            print(str(e))
            print(traceback.format_exc())
            pass

        try:
            self._socket.close()
        except OSError as e:
            print(str(e))
            print(traceback.format_exc())
            pass

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
        raw_request = request.decode("utf-8").strip()

        try:
            raw_header, raw_data = raw_request.split("\r\n\r\n", 1)
        except ValueError:
            raw_header = raw_request
            raw_data = None

        headers_temp = raw_header.split("\r\n")
        request_method, request_uri, http_version = headers_temp.pop(0).split(" ")
        request_headers = {}

        for header in headers_temp:
            key, value = header.split(": ")
            request_headers[key] = value

        return Request(request_method, request_uri, http_version, request_headers, raw_data)

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