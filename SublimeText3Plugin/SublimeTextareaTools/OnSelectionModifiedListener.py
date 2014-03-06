import sublime
from sublime_plugin import EventListener
import json
import sys


class OnSelectionModifiedListener(EventListener):
    _web_socket_server = None
    _view_name = None

    def on_selection_modified(self, view):
        if not OnSelectionModifiedListener._web_socket_server:
            return

        if not OnSelectionModifiedListener._view_name or OnSelectionModifiedListener._view_name != view.name():
            return

        sel_min, sel_max = OnSelectionModifiedListener._get_max_selection(view)

        changed_text = view.substr(sublime.Region(0, view.size()))
        response = json.dumps({
            'title': view.name(),
            'text':  changed_text,
            'cursor': {'min': sel_min, 'max': sel_max}
        })
        OnSelectionModifiedListener._web_socket_server.send_message(response)

    @staticmethod
    def set_web_socket_server(web_socket_server):
        OnSelectionModifiedListener._web_socket_server = web_socket_server

    @staticmethod
    def set_view_name(name):
        OnSelectionModifiedListener._view_name = name

    @staticmethod
    def _get_max_selection(view):
        _max = 0
        _min = sys.maxsize

        for pos in view.sel():
            _min = min(pos.begin(), _min)
            _max = max(pos.end(), _max)

        return _min, _max