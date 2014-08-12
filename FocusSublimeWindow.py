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
            os.system('sh -c "xdotool windowactivate $(xdotool search --class sublime | tail -1)"')
        elif platform == 'osx':
            script = """
            tell application "Sublime Text"
                activate
            end tell
            """  # Brings ALL the windows forward
            subprocess.Popen(["osascript", "-e", script])
        elif platform == 'windows':  # needs http://www.nirsoft.net/utils/nircmd.html to be installed in windows dir
            subprocess.Popen('nircmd win activate process sublime_text.exe')
