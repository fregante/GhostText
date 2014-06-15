import sublime
from sublime_plugin import EventListener
import json
import sys


class OnSelectionModifiedListener(EventListener):
    """
    Handles content changes, each changes gets send with the given web socket server to the client.
    """
    _bind_views = {}

    def on_selection_modified(self, view):
        if view.id() not in OnSelectionModifiedListener._bind_views:
            return

        sel_min, sel_max = OnSelectionModifiedListener._get_max_selection(view)

        changed_text = view.substr(sublime.Region(0, view.size()))
        response = json.dumps({
            'title': view.name(),
            'text':  changed_text,
            'cursor': {'min': sel_min, 'max': sel_max}
        })

        OnSelectionModifiedListener._bind_views[view.id()].send_message(response)

    @staticmethod
    def bind_view(view, web_socket_server):
        """
        Binds a view to a WebSocket.
        """
        print("Bind view with id: {}".format(view.id()))
        OnSelectionModifiedListener._bind_views[view.id()] = web_socket_server

    @staticmethod
    def unbind_view(view):
        """
        Unbinds a view connected to a WebSocket.
        """
        OnSelectionModifiedListener.unbind_view_by_id(view.id())

    @staticmethod
    def unbind_view_by_id(view_id):
        """
        Unbinds a view specified by it's id connected to a WebSocket.
        """
        print("Unbind view with id: {}".format(view_id))
        del OnSelectionModifiedListener._bind_views[view_id]

    @staticmethod
    def unbind_view_by_web_socket_server_id(web_socket_server):
        """
        Unbinds a view specified by it's WebSocket server.
        """
        for view_id in OnSelectionModifiedListener._bind_views:
            if OnSelectionModifiedListener._bind_views[view_id].get_id() == web_socket_server.get_id():
                OnSelectionModifiedListener.unbind_view_by_id(view_id)

    @staticmethod
    def _get_max_selection(view):
        """
        Returns the min and max values of all selections from the given view.
        """
        _max = 0
        _min = sys.maxsize

        for pos in view.sel():
            _min = min(pos.begin(), _min)
            _max = max(pos.end(), _max)

        return _min, _max