__author__ = 'Guido Krömer'
__license__ = 'MIT'
__version__ = '0.2'
__email__ = 'mail 64 cacodaemon 46 de'

import sublime
from sublime import Window
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
from .GhostTextTools.Utils import Utils
from .Http.HttpServer import HttpServer
from .Http.AbstractOnRequest import AbstractOnRequest
from .Http.Request import Request
from .Http.Response import Response


class WebSocketServerThread(Thread):
    def __init__(self, settings):
        super().__init__()
        self._server = WebSocketServer('localhost', 0)
        self._server.on_message(OnConnect(settings))
        self._server.on_close(OnClose(settings))

    def run(self):
        self._server.start()

    def get_server(self):
        return self._server


class OnRequest(AbstractOnRequest):
    def __init__(self, settings):
        self.new_window_on_connect = bool(settings.get('new_window_on_connect', False))
        self.window_command_on_connect = str(settings.get('window_command_on_connect', 'focus_sublime_window'))
        self._settings = settings

    def on_request(self, request):
        if len(sublime.windows()) == 0 or self.new_window_on_connect:
            sublime.run_command('new_window')

        if len(self.window_command_on_connect) > 0:
            sublime.active_window().run_command(self.window_command_on_connect)

        web_socket_server_thread = WebSocketServerThread(self._settings)
        web_socket_server_thread.start()
        while not web_socket_server_thread.get_server().get_running():
            sleep(0.1)

        port = web_socket_server_thread.get_server().get_port()
        Utils.show_status('Connection opened')

        return Response(json.dumps({"WebSocketPort": port, "ProtocolVersion": 1}),
                        "200 OK",
                        {'Content-Type': 'application/json'})


class HttpStatusServerThread(Thread):
    def __init__(self, settings):
        super().__init__()
        server_port = int(settings.get('server_port', 4001))
        self._server = HttpServer('localhost', server_port)
        self._server.on_request(OnRequest(settings))

    def run(self):
        try:
            self._server.start()
        except OSError as e:
            Utils.show_error(e, 'HttpStatusServerThread')
            raise e

    def stop(self):
        self._server.stop()


class ReplaceContentCommand(TextCommand):
    """
    Replaces the views complete text content.
    """
    def run(self, edit, **args):
        self.view.replace(edit, sublime.Region(0, self.view.size()), args['text'])
        text_length = len(args['text'])
        self.view.sel().clear()

        if 'selections' in args and len(args['selections']) > 0:
            selection = args['selections'][0]
            self.view.sel().add(sublime.Region(selection['start'], selection['end']))
        else:
            self.view.sel().add(sublime.Region(text_length, text_length))


class OnConnect(AbstractOnMessage):
    def __init__(self, settings):
        self._settings = settings

    def on_message(self, text):
        try:
            request = json.loads(text)
            window_helper = WindowHelper()
            syntax = Utils.get_syntax_by_host(request['url'])
            current_view = window_helper.add_file(request['title'] + '.' + syntax, request['text'])
            OnSelectionModifiedListener.bind_view(current_view, self._web_socket_server)
            self._web_socket_server.on_message(OnMessage(self._settings, current_view))
            current_view.window().focus_view(current_view)
        except ValueError as e:
            Utils.show_error(e, 'Invalid JSON')


class OnMessage(AbstractOnMessage):
    def __init__(self, settings, current_view):
        self._current_view = current_view
        self._settings = settings

    def on_message(self, text):
        try:
            request = json.loads(text)
            self._current_view.run_command('replace_content', request)
            self._current_view.window().focus_view(self._current_view)
        except ValueError as e:
            Utils.show_error(e, 'Invalid JSON')


class OnClose(AbstractOnClose):
    def __init__(self, settings):
        self._settings = settings
        self._close_view_on_disconnect = bool(settings.get('close_view_on_disconnect', False))

    def on_close(self):
        view_id = OnSelectionModifiedListener.find_view_id_by_web_socket_server_id(self._web_socket_server)
        if view_id is not None:
            view = Utils.find_view_by_id(view_id)
            if view is not None:
                Utils.mark_view_as(view, 'disconnected')

        if self._close_view_on_disconnect:
            Utils.close_view_by_id(view_id)

        OnSelectionModifiedListener.unbind_view_by_web_socket_server_id(self._web_socket_server)
        Utils.show_status('Connection closed')


class GhostTextGlobals():
    """
    'Namespace' for global vars.
    """
    http_status_server_thread = None


def plugin_loaded():
    print('GhostText is starting now…')
    settings = sublime.load_settings('GhostText.sublime-settings')
    GhostTextGlobals.http_status_server_thread = HttpStatusServerThread(settings)
    GhostTextGlobals.http_status_server_thread.start()

    Utils.replace_connected_with_disconnected_prefix()


def plugin_unloaded():
    print('GhostText is stopping now…')
    print(GhostTextGlobals.http_status_server_thread)
    if GhostTextGlobals.http_status_server_thread is None:
        return

    GhostTextGlobals.http_status_server_thread.stop()
