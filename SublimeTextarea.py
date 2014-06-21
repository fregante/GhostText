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
from .Http.Request import Request
from .Http.Response import Response


class WebSocketServerThread(Thread):
    def __init__(self):
        super().__init__()
        self._server = WebSocketServer('localhost', 0)
        self._server.on_message(OnConnect())
        self._server.on_close(OnClose())

    def run(self):
        self._server.start()

    def get_server(self):
        return self._server


class OnRequest(AbstractOnRequest):
    def on_request(self, request):
        web_socket_server_thread = WebSocketServerThread()
        web_socket_server_thread.start()
        while not web_socket_server_thread.get_server().get_running():
            sleep(0.1)

        port = web_socket_server_thread.get_server().get_port()

        return Response(json.dumps({"WebSocketPort": port, "ProtocolVersion": 1}), "200 OK", {'Content-Type': 'application/json'})


class HttpStatusServerThread(Thread):
    def __init__(self):
        super().__init__()
        self._server = HttpServer('localhost', 4001)
        self._server.on_request(OnRequest())

    def run(self):
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
            OnSelectionModifiedListener.bind_view(current_view, self._web_socket_server)
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
        OnSelectionModifiedListener.unbind_view_by_web_socket_server_id(self._web_socket_server)

http_status_server_thread = HttpStatusServerThread()
http_status_server_thread.start()