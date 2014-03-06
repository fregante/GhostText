import sublime
from sublime_plugin import TextCommand


class ReplaceContentCommand(TextCommand):
    def run(self, edit, **args):
        self.view.replace(edit, sublime.Region(0, self.view.size()), args['txt'])