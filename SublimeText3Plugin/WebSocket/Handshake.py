import hashlib
import base64


class Handshake:
    """
    Handles the WebSocket handshake.
    """
    def perform(self, data):
        """
        Parses the given request data and returns a matching response header.
        """
        key = self._build_web_socket_accept_from_request_header(data.decode("utf-8"))

        return self._build_response_header(key)

    def _build_web_socket_accept_from_request_header(self, header):
        """
        Parses the response header and builds a sec web socket accept.
        """
        search_term = "Sec-WebSocket-Key: "
        start = header.find(search_term) + len(search_term)
        end = header.find("\r\n", start)
        key = header[start:end]

        guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
        key = (key + guid).encode('utf-8')
        sha1 = hashlib.sha1(key).digest()

        return base64.b64encode(sha1)

    def _build_response_header(self, key):
        """
        Builds the response header containing the given key.
        """
        return str("HTTP/1.1 101 Switching Protocols\r\n" +
                       "Upgrade: websocket\r\n" + 
                       "Connection: Upgrade\r\n" + 
                       "Sec-WebSocket-Accept: " + 
                       key.decode('utf-8') + 
                       "\r\n\r\n")