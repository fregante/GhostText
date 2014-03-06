import sublime
from sublime_plugin import TextCommand
from sublime_plugin import EventListener
from threading import Thread
import json
from .WebSocket.Server import Server
from .WebSocket.AbstractOnClose import AbstractOnClose
from .WebSocket.AbstractOnMessage import AbstractOnMessage
from .SublimeTextareaTools.OnSelectionModifiedListener import OnSelectionModifiedListener
from .SublimeTextareaTools.WindowHelper import WindowHelper


class OnConnect(AbstractOnMessage):
    def __init__(self, web_socket_server):
        self._web_socket_server = web_socket_server

    def on_message(self, text):
        try:
            request = json.loads(text)
            window_helper = WindowHelper()
            current_view = window_helper.add_file(request['title'], request['text'])
            OnSelectionModifiedListener.set_view_name(request['title'])

            self._web_socket_server.on_message(OnMessage(self._web_socket_server, current_view))
        except ValueError:
            print('Invalid JSON!')


class OnMessage(AbstractOnMessage):
    def __init__(self, web_socket_server, current_view):
        self._web_socket_server = web_socket_server
        self._current_view = current_view

    def on_message(self, text):
        try:
            request = json.loads(text)
            self._current_view.run_command('replace_content', {'txt': request['text']})
        except ValueError:
            print('Invalid JSON!')


class OnClose(AbstractOnClose):
    def __init__(self, web_socket_server):
        self._web_socket_server = web_socket_server

    def on_close(self):
        self._web_socket_server.on_message(OnConnect(self._web_socket_server))
        Thread(target=web_socket_server_thread).start()

web_socket_server = Server('localhost', 2000)
OnSelectionModifiedListener.set_web_socket_server(web_socket_server)

web_socket_server.on_message(OnConnect(web_socket_server))
web_socket_server.on_close(OnClose(web_socket_server))


def web_socket_server_thread():
    global web_socket_server
    web_socket_server.start()

Thread(target = web_socket_server_thread).start()