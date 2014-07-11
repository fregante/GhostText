import os
import sublime
from sublime_plugin import WindowCommand


class FocusSublimeWindowCommand(WindowCommand):
    """
    Focuses the SublimeText window using a OS specific shell command.
    """
    def run(self, **args):
        platform = sublime.platform()

        if platform == 'linux':
            os.system('wmctrl -a "Sublime Text"')
        elif platform == 'osx':
            print(platform)
            #TODO I have no mac
        elif platform == 'windows':
            print(platform)
            #TODO maybe this can do the job: http://www.nirsoft.net/utils/nircmd.html