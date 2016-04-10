import sublime
import os
from .Utils import Utils


class WindowHelper(sublime.Window):
    """
    Helper class for opening new files in the active sublime text window.
    """
    def __init__(self):
        self.window_id = sublime.active_window().id()
        self._view_disconnected_prefix = Utils.get_view_prefix('disconnected')
        self._view_connected_prefix = Utils.get_view_prefix('connected')

    def add_file(self, title, text):
        """
        Creates a new file and adds the given text content to it.
        """
        view = self._find_disconnected_view(title)
        view.set_name('{} {}'.format(self._view_connected_prefix, os.path.splitext(title)[0]))
        view.set_status('title', title)
        view.run_command('replace_content', {'text': text})
        view.set_scratch(True)

        return view

    def _find_disconnected_view(self, title=None):
        disconnected_views = []

        if title is not None:  # if title is set try to find the best match by exact title first
            needle = '{} {}'.format(self._view_disconnected_prefix, title)
            disconnected_views.extend(Utils.search_views_by_title(needle))

        disconnected_views.extend(Utils.search_views_by_title(self._view_disconnected_prefix))
        if len(disconnected_views) > 0:
            return disconnected_views[0]

        return self.open_file(title)