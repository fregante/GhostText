

class Request():
    """
    HTTP request.
    """

    def __init__(self, method, uri, version, headers):
        self._method = method
        self._uri = uri
        self._version = version
        self._headers = headers

    def get_method(self):
        """
        Gets the request method.
        """
        return self._method

    def get_uri(self):
        """
        Gets the request URI.
        """
        return self._uri

    def get_version(self):
        """
        Gets the request version.
        """
        return self._version

    def get_headers(self):
        """
        Gets the request headers.
        """
        return self._headers