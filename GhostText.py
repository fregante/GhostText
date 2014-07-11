__author__ = 'Guido Krömer'
__license__ = 'MIT'
__version__ = '0.2'
__email__ = 'mail 64 cacodaemon 46 de'

import os
import sublime
import traceback
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
    def __init__(self, new_window_on_connect = False):
        self.new_window_on_connect = new_window_on_connect

    def on_request(self, request):
        if len(sublime.windows()) == 0 or self.new_window_on_connect:
            sublime.run_command("new_window")

        web_socket_server_thread = WebSocketServerThread()
        web_socket_server_thread.start()
        while not web_socket_server_thread.get_server().get_running():
            sleep(0.1)

        port = web_socket_server_thread.get_server().get_port()
        show_status('Connection opened')

        return Response(json.dumps({"WebSocketPort": port, "ProtocolVersion": 1}),
                        "200 OK",
                        {'Content-Type': 'application/json'})


class HttpStatusServerThread(Thread):
    def __init__(self, server_port=4001, new_window_on_connect=False):
        super().__init__()
        self._server = HttpServer('localhost', server_port)
        self._server.on_request(OnRequest(new_window_on_connect))

    def run(self):
        try:
            self._server.start()
        except OSError as e:
            show_error(e, 'HttpStatusServerThread')
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
    def on_message(self, text):
        try:
            request = json.loads(text)
            window_helper = WindowHelper()
            current_view = window_helper.add_file(request['title'], request['text'])
            OnSelectionModifiedListener.bind_view(current_view, self._web_socket_server)
            self._web_socket_server.on_message(OnMessage(current_view))
            current_view.window().focus_view(current_view)
            self._set_syntax_by_host(request['url'], current_view)
        except ValueError as e:
            show_error(e, 'Invalid JSON')

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
            self._current_view.run_command('replace_content', request)
            self._current_view.window().focus_view(self._current_view)
        except ValueError as e:
            show_error(e, 'Invalid JSON')


class OnClose(AbstractOnClose):
    def on_close(self):
        OnSelectionModifiedListener.unbind_view_by_web_socket_server_id(self._web_socket_server)
        show_status('Connection closed')


class GhostTextGlobals():
    """
    'Namespace' for global vars.
    """
    http_status_server_thread = None


def show_error(e=None, hint='', message=''):
    """
    Shows a sublime error dialog.
    """
    if hint:
        hint = ' - ' + hint

    if e:
        sublime.status_message('GhostText{}: {}, {}, {}'.format(hint, message, str(e), traceback.format_exc()))
    else:
        sublime.status_message('GhostText{}: {}'.format(hint, message))


def show_status(status=''):
    """
    Shows a status message.
    """
    sublime.status_message('GhostText - {}'.format(status))


def plugin_loaded():
    print('GhostTest is starting now…')
    settings = sublime.load_settings('GhostText.sublime-settings')
    server_port = int(settings.get('server_port', 4001))
    new_window_on_connect = bool(settings.get('new_window_on_connect', False))

    GhostTextGlobals.http_status_server_thread = HttpStatusServerThread(server_port, new_window_on_connect)
    GhostTextGlobals.http_status_server_thread.start()


def plugin_unloaded():
    print('GhostTest is stopping now…')
    print(GhostTextGlobals.http_status_server_thread)
    if GhostTextGlobals.http_status_server_thread is None:
        return

    GhostTextGlobals.http_status_server_thread.stop()
