__author__ = 'caco'

import json
from Http.Server import Server
from Http.AbstractOnRequest import AbstractOnRequest


class OnRequest(AbstractOnRequest):
    def on_request(self, method, uri, version, headers):
        print("On Reqeusrt")
        print(method)
        print(uri)
        print(version)

        for key in headers:
            print(key)
            print(headers[key])

        return 200, {"No": "Data"}, json.dumps({"FreePort": 1337})


if __name__ == '__main__':
    sever = Server()
    sever.on_request(OnRequest())
    sever.start()