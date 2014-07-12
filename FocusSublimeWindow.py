import os
import sublime
import subprocess
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
            script = """
            tell application "Sublime Text"
                activate
            end tell
            """ # Brings ALL the windows forward
            subprocess.Popen(["osascript", "-e", script])
        elif platform == 'windows':
            print(platform)
            #TODO maybe this can do the job: http://www.nirsoft.net/utils/nircmd.html