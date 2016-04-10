import sublime
import traceback


class Utils():
    """
    Loose collection of GhostText related utils for working with the Sublime Text API.
    """

    @staticmethod
    def show_status(status=''):
        """
        Shows a status message.
        """
        sublime.status_message('GhostText - {}'.format(status))

    @staticmethod
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

    @staticmethod
    def search_views_by_title(needle):
        """
        Search for views in all open windows containing the given needle.
        """
        result = []
        for window in sublime.windows():
            for view in window.views():
                name = Utils.get_name_or_file_name_from_view(view)
                if needle in name:
                    result.append(view)
                if needle == name:
                    result.append(view)

        return result

    @staticmethod
    def find_view_by_id(view_id):
        """
        Finds a view in all open windows containing the given id.
        """
        for window in sublime.windows():
            for view in window.views():
                if view.id() is view_id:
                    return view

        return None

    @staticmethod
    def close_view(view):
        """
        Closes the given view by running the close_by_index command.
        If there are more than one open windows and the window has no more views it gets closed, too.
        """
        window = view.window()
        group_index, view_index = window.get_view_index(view)
        window.run_command('close_by_index', {'group': group_index, 'index': view_index})
        if len(sublime.windows()) > 1 and len(window.views()) is 0:
            window.run_command('close')

    @staticmethod
    def close_view_by_id(view_id):
        """
        Closes the given view, specified by it's id, by running the close_by_index command.
        """
        view = Utils.find_view_by_id(view_id)

        if view is None:
            return

        Utils.close_view(view)

    @staticmethod
    def mark_view_as(view, state):
        """
        Marks a view, sets a prefix, as connected or disconnected.
        """
        name = Utils.get_name_or_file_name_from_view(view)
        name = name.replace(Utils.get_view_prefix('connected'), '')
        name = name.replace(Utils.get_view_prefix('disconnected'), '')
        name = name.lstrip()
        view.set_name('{} {}'.format(Utils.get_view_prefix(state), name))

    @staticmethod
    def replace_connected_with_disconnected_prefix():
        """
        Replaces the connected prefix with the disconnected one.
        """
        view_prefix_connected = Utils.get_view_prefix('connected')

        for view in Utils.search_views_by_title(view_prefix_connected):
            name = Utils.get_name_or_file_name_from_view(view)
            if view_prefix_connected in name:
                Utils.mark_view_as(view, 'disconnected')

    @staticmethod
    def get_view_prefix(state):
        """
        Gets the view prefix by the given state from the config.
        """
        settings = sublime.load_settings('GhostText.sublime-settings')
        return settings.get('view_title_prefix')[state]

    @staticmethod
    def get_name_or_file_name_from_view(view):
        """
        Returns the name from the given view,
        if no name is set the file name gets returned,
        when no file name was found an empty string is teh result.
        """
        name = view.name()
        if name is not None:
            return name

        name = view.file_name()
        if name is not None:
            return name

        return ''

    @staticmethod
    def get_syntax_by_host(host):
        """
        Looks for a user-suggested syntax in the "host_to_syntax" setting,
        defaults to "default_syntax"
        """
        settings = sublime.load_settings('GhostText.sublime-settings')
        host_to_syntax = settings.get('host_to_syntax')

        syntax = None
        syntax_part = None
        for host_fragment in host_to_syntax:
            if host_fragment not in host:
                continue

            return host_to_syntax[host_fragment]

        return settings.get('default_syntax')