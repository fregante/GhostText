__author__ = 'Guido Krömer'
__license__ = 'MIT'
__version__ = '0.1'
__email__ = 'mail 64 cacodaemon 46 de'

import sublime
from sublime_plugin import TextCommand
from threading import Thread
import json
from .WebSocket.Server import Server
from .WebSocket.AbstractOnClose import AbstractOnClose
from .WebSocket.AbstractOnMessage import AbstractOnMessage
from .SublimeTextareaTools.OnSelectionModifiedListener import OnSelectionModifiedListener
from .SublimeTextareaTools.WindowHelper import WindowHelper


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
        print(text)
        try:
            request = json.loads(text)
            self._current_view.run_command('replace_content', {'txt': request['text']})
        except ValueError:
            print('Invalid JSON!')


class OnClose(AbstractOnClose):
    def on_close(self):
        self._web_socket_server.on_message(OnConnect())
        Thread(target=web_socket_server_thread).start()

web_socket_server = Server('localhost', 1337)
OnSelectionModifiedListener.set_web_socket_server(web_socket_server)

web_socket_server.on_message(OnConnect())
web_socket_server.on_close(OnClose())


def web_socket_server_thread():
    global web_socket_server
    web_socket_server.start()

Thread(target = web_socket_server_thread).start()