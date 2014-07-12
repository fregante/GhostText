

class Response():
    """
    HTTP response.
    """

    def __init__(self, data, status="200 OK", headers=None):
        self._data = data
        self._status = status
        self._headers = headers or {}

    def get_data(self):
        """
        Gets the response data.
        """
        return self._data

    def get_status(self):
        """
        Gets the response status.
        """
        return self._status

    def get_headers(self):
        """
        Gets the response headers.
        """
        return self._headers