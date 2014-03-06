import sublime


class WindowHelper(sublime.Window):
    def __init__(self):
        self.window_id = sublime.active_window().id()

    def add_file(self, title, text):
        view = self.new_file()
        view.set_name(title)
        view.set_status('title', title)
        view.run_command('replace_content', {'txt': text})

        return view
