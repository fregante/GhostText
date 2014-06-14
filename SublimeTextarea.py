__author__ = 'Guido Krömer'
__license__ = 'MIT'
__version__ = '0.1'
__email__ = 'mail 64 cacodaemon 46 de'

import sublime
from sublime_plugin import TextCommand
from threading import Thread
import json
from time import sleep
from .WebSocket.WebSocketServer import WebSocketServer
from .WebSocket.AbstractOnClose import AbstractOnClose
from .WebSocket.AbstractOnMessage import AbstractOnMessage
from .SublimeTextareaTools.OnSelectionModifiedListener import OnSelectionModifiedListener
from .SublimeTextareaTools.WindowHelper import WindowHelper
from .Http.HttpServer import HttpServer
from .Http.AbstractOnRequest import AbstractOnRequest


class WebsocketServerThread(Thread):
    def __init__(self):
        super().__init__()
        print("WebsocketServerThread.__init__")
        self._server = WebSocketServer('localhost', 0)
        self._server.on_message(OnConnect())
        self._server.on_close(OnClose())
        OnSelectionModifiedListener.set_web_socket_server(self._server) #TODO

    def run(self):
        print("WebsocketServerThread.run")
        self._server.start()

    def get_server(self):
        return self._server


class OnRequest(AbstractOnRequest):
    def on_request(self, method, uri, version, headers):
        print("OnRequest.on_request")
        websocket_server_thread = WebsocketServerThread()
        websocket_server_thread.start()
        while not websocket_server_thread.get_server().get_running():
            sleep(0.1)

        port = websocket_server_thread.get_server().get_port()

        return 200, {'Content-Type': 'application/json'}, json.dumps({"WebSocketPort": port})


class HttpStatusServerThread(Thread):
    def __init__(self):
        super().__init__()
        print("HttpStatusServerThread.__init__")
        self._server = HttpServer('localhost', 4001)
        self._server.on_request(OnRequest())

    def run(self):
        print("HttpStatusServerThread.run")
        self._server.start()


class ReplaceContentCommand(TextCommand):
    """
    Replaces the views complete text content.
    """
    def run(self, edit, **args):
        self.view.replace(edit, sublime.Region(0, self.view.size()), args['txt'])


class OnConnect(AbstractOnMessage):
    def on_message(self, text):
        try:
            request = json.loads(text)
            window_helper = WindowHelper()
            current_view = window_helper.add_file(request['title'], request['text'])
            OnSelectionModifiedListener.set_view_name(request['title'])

            self._web_socket_server.on_message(OnMessage(current_view))
        except ValueError:
            print('Invalid JSON!')


class OnMessage(AbstractOnMessage):
    def __init__(self, current_view):
        self._current_view = current_view

    def on_message(self, text):
        try:
            request = json.loads(text)
            self._current_view.run_command('replace_content', {'txt': request['text']})
        except ValueError:
            print('Invalid JSON!')


class OnClose(AbstractOnClose):
    def on_close(self):
        print("WebSocket Closed bye bye")
        """
        self._web_socket_server.on_message(OnConnect())
        Thread(target=web_socket_server_thread).start()
        """

http_status_server_thread = HttpStatusServerThread()
http_status_server_thread.start()