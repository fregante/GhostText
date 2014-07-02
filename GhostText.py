__author__ = 'Guido Krömer'
__license__ = 'MIT'
__version__ = '0.2'
__email__ = 'mail 64 cacodaemon 46 de'

import sublime
from sublime_plugin import TextCommand
from sublime_plugin import EventListener
from threading import Thread
import json
from time import sleep
from .WebSocket.WebSocketServer import WebSocketServer
from .WebSocket.AbstractOnClose import AbstractOnClose
from .WebSocket.AbstractOnMessage import AbstractOnMessage
from .GhostTextTools.OnSelectionModifiedListener import OnSelectionModifiedListener
from .GhostTextTools.WindowHelper import WindowHelper
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

        return Response(json.dumps({"WebSocketPort": port, "ProtocolVersion": 1}),
                        "200 OK",
                        {'Content-Type': 'application/json'})


class HttpStatusServerThread(Thread):
    def __init__(self, server_port=4001):
        super().__init__()
        self._server = HttpServer('localhost', server_port)
        self._server.on_request(OnRequest())

    def run(self):
        self._server.start()


class ReplaceContentCommand(TextCommand):
    """
    Replaces the views complete text content.
    """
    def run(self, edit, **args):
        self.view.replace(edit, sublime.Region(0, self.view.size()), args['txt'])
        text_length = len(args['txt'])
        self.view.sel().clear()
        self.view.sel().add(sublime.Region(text_length, text_length))


class OnConnect(AbstractOnMessage):
    def on_message(self, text):
        try:
            request = json.loads(text)
            window_helper = WindowHelper()
            current_view = window_helper.add_file(request['title'], request['text'])
            OnSelectionModifiedListener.bind_view(current_view, self._web_socket_server)
            self._web_socket_server.on_message(OnMessage(current_view))
            self._set_syntax_by_host(request['url'], current_view)
        except ValueError:
            print('Invalid JSON!')

    def _set_syntax_by_host(self, host, view):
        settings = sublime.load_settings('GhostText.sublime-settings')
        syntax = settings.get('default_syntax', 'Packages/Markdown/Markdown.tmLanguage')
        host_to_syntax = settings.get('host_to_syntax')

        for host_fragment in host_to_syntax:
            if host_fragment in host:
                syntax = host_to_syntax[host_fragment]

        view.set_syntax_file(syntax)


class OnMessage(AbstractOnMessage):
    def __init__(self, current_view):
        self._current_view = current_view

    def on_message(self, text):
        try:
            request = json.loads(text)
            self._current_view.run_command('replace_content', {'txt': request['text']})
            self._current_view.window().focus_view(self._current_view)
        except ValueError:
            print('Invalid JSON!')


class OnClose(AbstractOnClose):
    def on_close(self):
        OnSelectionModifiedListener.unbind_view_by_web_socket_server_id(self._web_socket_server)


class SublimeTextLoaded(EventListener):
    """
    Workaround, start plug-in when sublime text is ready for fetching the settings.
    """
    activated = False

    def on_activated(self, view):
        if SublimeTextLoaded.activated:
            return

        SublimeTextLoaded.activated = True

        settings = sublime.load_settings('GhostText.sublime-settings')
        server_port = int(settings.get('server_port', 4001))

        http_status_server_thread = HttpStatusServerThread(server_port)
        http_status_server_thread.start()